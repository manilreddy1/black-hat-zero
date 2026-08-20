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

    // Themes + problem statements stay sealed until staff flip the reveal
    // switch in event settings; before that leads only see "not released yet".
    const { data: settings } = await db
      .from("event_settings")
      .select("themes_revealed, whatsapp_group_url, theme_selection_locked")
      .limit(1)
      .maybeSingle();
    const themesRevealed = Boolean(
      (settings as { themes_revealed?: boolean } | null)?.themes_revealed,
    );
    const whatsappGroupUrl = (settings as { whatsapp_group_url?: string | null } | null)?.whatsapp_group_url ?? null;
    let themes: { id: string; title: string; description: string | null; problem_statement: string | null }[] = [];
    if (themesRevealed && confirmed) {
      const { data: rows } = await db
        .from("challenges")
        .select("id, title, description, problem_statement, sort_order, is_published")
        .eq("is_published", true)
        .order("sort_order");
      themes = (rows ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        problem_statement: (r as { problem_statement?: string | null }).problem_statement ?? null,
      }));
    }

    const r = reg as unknown as {
      selected_challenge_id: string | null;
      custom_problem_title: string | null;
      custom_problem_statement: string | null;
      theme_selected_at: string | null;
    };
    const selectionLocked = Boolean(
      (settings as { theme_selection_locked?: boolean } | null)?.theme_selection_locked,
    );

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
      whatsapp_group_url: whatsappGroupUrl,
      themes_revealed: themesRevealed && confirmed,
      themes,
      selection: r.theme_selected_at
        ? {
            challenge_id: r.selected_challenge_id,
            custom_title: r.custom_problem_title,
            custom_statement: r.custom_problem_statement,
            selected_at: r.theme_selected_at,
          }
        : null,
      selection_locked: selectionLocked,

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
        .select("id, team_name, leader_email, leader_name, lead_user_id")
        .ilike("leader_email", addr)
        .limit(1)
        .maybeSingle();
      if (team?.lead_user_id) {
        const { issueLeadPassword } = await import("./lead.server");
        await issueLeadPassword(team.leader_email, team.leader_name, team.team_name ?? undefined);
      }
    } catch {
      /* swallow: response must not leak account existence */
    }
    return { ok: true };
  });


/** Team lead picks their problem statement (or writes a custom "403" one). */
export const selectTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        challenge_id: z.string().uuid().nullable(),
        custom_title: z.string().max(120).optional(),
        custom_statement: z.string().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const email = String((context.claims as { email?: string })?.email ?? "").toLowerCase();
    const found = await myTeam(context.userId, email);
    if (!found) throw new Error("No team found for this account.");
    const { db, reg } = found;

    const { data: settings } = await db
      .from("event_settings")
      .select("themes_revealed, theme_selection_locked")
      .limit(1)
      .maybeSingle();
    const s = settings as { themes_revealed?: boolean; theme_selection_locked?: boolean } | null;
    if (!s?.themes_revealed) throw new Error("Problem statements have not been released yet.");
    const confirmed = reg.status === "REGISTERED" || reg.status === "PAYMENT_APPROVED";
    if (!confirmed) throw new Error("Your registration is not confirmed yet.");
    if (s.theme_selection_locked) throw new Error("Selections are locked by the organisers.");

    let patch: Record<string, unknown>;
    if (data.challenge_id) {
      const { data: ch } = await db
        .from("challenges")
        .select("id")
        .eq("id", data.challenge_id)
        .eq("is_published", true)
        .maybeSingle();
      if (!ch) throw new Error("That theme is not available.");
      patch = {
        selected_challenge_id: data.challenge_id,
        custom_problem_title: null,
        custom_problem_statement: null,
        theme_selected_at: new Date().toISOString(),
      };
    } else {
      const title = (data.custom_title ?? "").trim();
      const statement = (data.custom_statement ?? "").trim();
      if (title.length < 3) throw new Error("Give your problem statement a title.");
      if (statement.length < 20)
        throw new Error("Describe your problem statement in at least 20 characters.");
      patch = {
        selected_challenge_id: null,
        custom_problem_title: title,
        custom_problem_statement: statement,
        theme_selected_at: new Date().toISOString(),
      };
    }

    const { error } = await db.from("registrations").update(patch as never).eq("id", reg.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
