import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Team-lead portal server functions. Every read/write is scoped to the team
 * owned by the signed-in lead (matched by `lead_user_id`, falling back to the
 * leader email on the account). Staff roles are irrelevant here — a lead can
 * never see another team, and a staff account without a team sees nothing.
 */
async function myTeam(userId: string, email: string) {
  const { admin } = await import("./db.server");
  const db = await admin();
  let { data: team } = await db
    .from("teams")
    .select("*")
    .eq("lead_user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!team && email) {
    const found = await db
      .from("teams")
      .select("*")
      .ilike("leader_email", email)
      .limit(1)
      .maybeSingle();
    team = found.data;
    if (team) await db.from("teams").update({ lead_user_id: userId }).eq("id", team.id);
  }
  if (!team) return null;
  const { data: reg } = await db
    .from("registrations")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return reg ? { db, team, reg } : null;
}

export const getMyTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string })?.email ?? "").toLowerCase();
    const found = await myTeam(context.userId, email);
    if (!found) return { team: null };
    const { db, team, reg } = found;

    const [{ data: members }, { data: payment }, { data: att }, { data: tokens }] =
      await Promise.all([
        db.from("team_members").select("*").eq("team_id", team.id).order("member_index"),
        db
          .from("payments")
          .select("amount, utr_number, status, created_at")
          .eq("registration_id", reg.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        db.from("attendance").select("*").eq("registration_id", reg.id).maybeSingle(),
        db.from("food_tokens").select("*").eq("registration_id", reg.id),
      ]);

    const confirmed = reg.status === "REGISTERED" || reg.status === "PAYMENT_APPROVED";
    const { makeToken } = await import("./tokens.server");
    const tokenByMember = new Map((tokens ?? []).map((t) => [t.member_id, t]));

    return {
      team: {
        team_code: team.team_code,
        team_name: team.team_name,
        college: team.college,
        department: team.department,
        leader_name: team.leader_name,
        leader_email: team.leader_email,
      },
      registration: {
        registration_code: reg.registration_code,
        status: reg.status,
        team_size: reg.team_size,
        expected_amount: reg.expected_amount,
        submitted_at: reg.submitted_at,
      },
      payment,
      attendance: att ? { marked_at: att.marked_at } : null,
      attendance_qr: confirmed ? await makeToken("A", reg.id) : null,
      members: await Promise.all(
        (members ?? []).map(async (m) => {
          const tok = tokenByMember.get(m.id);
          return {
            id: m.id,
            full_name: m.full_name,
            email: m.email,
            student_id: m.student_id,
            department: m.department,
            is_leader: m.is_leader,
            food_pref: (m as { food_pref?: string }).food_pref ?? "VEG",
            food_qr: tok?.released ? await makeToken("F", tok.id) : null,
            food_redeemed_at: tok?.redeemed_at ?? null,
          };
        }),
      ),
    };
  });

/** Lets a lead who lost access request a fresh temporary password by email. */
export const requestLeadPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email().max(120), origin: z.string().url().max(300) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { assertSameOrigin, throttleRetryMs, throttleMessage, recordFailure, clientIp } =
      await import("./security.server");
    await assertSameOrigin();
    const ip = await clientIp();
    const ids = [`ip:${ip}`, `lead:${data.email.toLowerCase()}`];
    const retry = await throttleRetryMs("lead_reset", ids);
    if (retry > 0) throw new Error(throttleMessage(retry));
    await recordFailure("lead_reset", ids);

    // Always returns ok: never reveals whether an account exists.
    try {
      const addr = data.email.toLowerCase();
      const { admin } = await import("./db.server");
      const db = await admin();
      const { data: team } = await db
        .from("teams")
        .select("id, leader_email, leader_name, lead_user_id")
        .ilike("leader_email", addr)
        .limit(1)
        .maybeSingle();
      if (team?.lead_user_id) {
        const { issueLeadPassword } = await import("./lead.server");
        await issueLeadPassword(team.leader_email, team.leader_name);
      }
    } catch {
      /* swallow: response must not leak account existence */
    }
    return { ok: true };
  });

