import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const codeInput = (d: unknown) =>
  z.object({ code: z.string().trim().min(8).max(120) }).parse(d);

/** Reads a scanned QR and returns what it points at — never mutates anything. */
export const resolveScan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(codeInput)
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["coordinator", "admin", "payment_verifier"]);
    const { readToken } = await import("./tokens.server");
    const parsed = await readToken(data.code);
    if (!parsed) throw new Error("Invalid or tampered QR code.");
    const { admin } = await import("./db.server");
    const db = await admin();

    if (parsed.kind === "A") {
      const { data: reg } = await db
        .from("registrations")
        .select("id, registration_code, status, team_size, team_id")
        .eq("id", parsed.id)
        .maybeSingle();
      if (!reg) throw new Error("Registration not found.");
      const { data: team } = await db
        .from("teams")
        .select("team_name, team_code, college")
        .eq("id", reg.team_id)
        .maybeSingle();
      const { data: att } = await db
        .from("attendance")
        .select("marked_at, marked_by_email")
        .eq("registration_id", reg.id)
        .maybeSingle();
      const { data: members } = await db
        .from("team_members")
        .select("full_name, food_pref")
        .eq("team_id", reg.team_id)
        .order("member_index");
      return {
        kind: "attendance" as const,
        id: reg.id,
        registration_code: reg.registration_code,
        status: reg.status,
        eligible: reg.status === "REGISTERED" || reg.status === "PAYMENT_APPROVED",
        team_name: team?.team_name ?? "",
        team_code: team?.team_code ?? "",
        college: team?.college ?? "",
        members: members ?? [],
        already: att ? { at: att.marked_at, by: att.marked_by_email } : null,
      };
    }

    const { data: tok } = await db
      .from("food_tokens")
      .select("id, released, redeemed_at, redeemed_by_email, member_id, registration_id")
      .eq("id", parsed.id)
      .maybeSingle();
    if (!tok) throw new Error("Food token not found.");
    const { data: member } = await db
      .from("team_members")
      .select("full_name, food_pref, team_id, student_id")
      .eq("id", tok.member_id)
      .maybeSingle();
    const { data: team } = member
      ? await db.from("teams").select("team_name, team_code").eq("id", member.team_id).maybeSingle()
      : { data: null };
    return {
      kind: "food" as const,
      id: tok.id,
      released: tok.released,
      full_name: member?.full_name ?? "",
      student_id: member?.student_id ?? "",
      food_pref: (member as { food_pref?: string } | null)?.food_pref ?? "VEG",
      team_name: team?.team_name ?? "",
      team_code: team?.team_code ?? "",
      already: tok.redeemed_at ? { at: tok.redeemed_at, by: tok.redeemed_by_email } : null,
    };
  });

/** Confirms a team as present. Idempotent — a second scan reports the first. */
export const markAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(codeInput)
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    const role = await requireRole(context.supabase, context.userId, [
      "coordinator",
      "admin",
      "payment_verifier",
    ]);
    const { readToken } = await import("./tokens.server");
    const parsed = await readToken(data.code);
    if (!parsed || parsed.kind !== "A") throw new Error("Invalid attendance QR code.");
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const email = String((context.claims as { email?: string })?.email ?? "");

    const { data: reg } = await db
      .from("registrations")
      .select("id, status, registration_code")
      .eq("id", parsed.id)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found.");
    if (!["REGISTERED", "PAYMENT_APPROVED"].includes(reg.status))
      throw new Error("This team is not a confirmed registration.");

    const { error } = await db.from("attendance").insert({
      registration_id: reg.id,
      marked_by: context.userId,
      marked_by_email: email,
    });
    if (error) {
      const { data: existing } = await db
        .from("attendance")
        .select("marked_at, marked_by_email")
        .eq("registration_id", reg.id)
        .maybeSingle();
      return {
        ok: false as const,
        already: existing
          ? { at: existing.marked_at as string | null, by: existing.marked_by_email }
          : null,
      };
    }
    await writeAudit({
      actor_id: context.userId,
      actor_email: email,
      actor_role: role,
      action: "ATTENDANCE_MARKED",
      entity: "registrations",
      entity_id: reg.id,
      metadata: { registration_code: reg.registration_code },
    });
    return { ok: true as const, already: null };
  });

/** Redeems one participant's food token. Single-use, race-safe. */
export const redeemFoodToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(codeInput)
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    const role = await requireRole(context.supabase, context.userId, [
      "coordinator",
      "admin",
      "payment_verifier",
    ]);
    const { readToken } = await import("./tokens.server");
    const parsed = await readToken(data.code);
    if (!parsed || parsed.kind !== "F") throw new Error("Invalid food token QR.");
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const email = String((context.claims as { email?: string })?.email ?? "");

    // Conditional update: only the first scan can flip redeemed_at.
    const { data: updated } = await db
      .from("food_tokens")
      .update({
        redeemed_at: new Date().toISOString(),
        redeemed_by: context.userId,
        redeemed_by_email: email,
      })
      .eq("id", parsed.id)
      .eq("released", true)
      .is("redeemed_at", null)
      .select("id, member_id")
      .maybeSingle();

    if (!updated) {
      const { data: tok } = await db
        .from("food_tokens")
        .select("released, redeemed_at, redeemed_by_email")
        .eq("id", parsed.id)
        .maybeSingle();
      if (!tok) throw new Error("Food token not found.");
      if (!tok.released) throw new Error("This food token has not been released yet.");
      return {
        ok: false as const,
        already: { at: tok.redeemed_at, by: tok.redeemed_by_email },
      };
    }
    await writeAudit({
      actor_id: context.userId,
      actor_email: email,
      actor_role: role,
      action: "FOOD_TOKEN_REDEEMED",
      entity: "food_tokens",
      entity_id: updated.id,
      metadata: { member_id: updated.member_id },
    });
    return { ok: true as const, already: null };
  });

/** Live check-in counters for the console. */
export const getCheckinStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("./staff.server");
    await requireStaff(context.supabase, context.userId);
    const { admin } = await import("./db.server");
    const db = await admin();
    const [teams, present, tokens] = await Promise.all([
      db
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .in("status", ["REGISTERED", "PAYMENT_APPROVED"]),
      db.from("attendance").select("id", { count: "exact", head: true }),
      db.from("food_tokens").select("released, redeemed_at"),
    ]);
    const list = tokens.data ?? [];
    return {
      teams: teams.count ?? 0,
      present: present.count ?? 0,
      released: list.filter((t) => t.released).length,
      redeemed: list.filter((t) => t.redeemed_at).length,
      total_tokens: list.length,
    };
  });
