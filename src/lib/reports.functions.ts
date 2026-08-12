import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * One consolidated read for the console Reports page: attendance, meals and
 * registration/payment rollups. Staff-only (coordinator + admin + super_admin).
 */
export const getReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["coordinator", "admin"]);
    const { admin } = await import("./db.server");
    const db = await admin();

    const [
      { data: regs },
      { data: teams },
      { data: members },
      { data: attendance },
      { data: tokens },
      { data: payments },
    ] = await Promise.all([
      db
        .from("registrations")
        .select("id, registration_code, status, team_size, team_id, expected_amount, submitted_at"),
      db.from("teams").select("id, team_name, team_code, college, leader_name, leader_email, leader_phone"),
      db
        .from("team_members")
        .select("id, team_id, member_index, full_name, email, phone, student_id, department, is_leader, food_pref")
        .order("member_index"),
      db.from("attendance").select("registration_id, marked_at, marked_by_email"),
      db
        .from("food_tokens")
        .select("id, registration_id, member_id, released, released_at, redeemed_at, redeemed_by_email"),
      db.from("payments").select("registration_id, amount, utr_number, status, paid_on, paid_time"),
    ]);

    const regList = regs ?? [];
    const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
    const memberById = new Map((members ?? []).map((m) => [m.id, m]));
    const attByReg = new Map((attendance ?? []).map((a) => [a.registration_id, a]));
    const payByReg = new Map((payments ?? []).map((p) => [p.registration_id, p]));
    const tokList = tokens ?? [];

    const confirmed = regList.filter(
      (r) => r.status === "REGISTERED" || r.status === "PAYMENT_APPROVED",
    );

    const teamRow = (r: (typeof regList)[number]) => {
      const t = teamById.get(r.team_id);
      const att = attByReg.get(r.id);
      const mine = tokList.filter((x) => x.registration_id === r.id);
      return {
        registration_id: r.id,
        registration_code: r.registration_code,
        team_name: t?.team_name ?? "",
        team_code: t?.team_code ?? "",
        college: t?.college ?? "",
        leader_name: t?.leader_name ?? "",
        leader_email: t?.leader_email ?? "",
        leader_phone: t?.leader_phone ?? "",
        team_size: r.team_size,
        status: r.status as string,
        marked_at: (att?.marked_at as string | null) ?? null,
        marked_by: (att?.marked_by_email as string | null) ?? null,
        tokens_total: mine.length,
        tokens_released: mine.filter((x) => x.released).length,
        tokens_redeemed: mine.filter((x) => x.redeemed_at).length,
      };
    };

    const present = confirmed
      .filter((r) => attByReg.has(r.id))
      .map(teamRow)
      .sort((a, b) => String(b.marked_at).localeCompare(String(a.marked_at)));
    const absent = confirmed
      .filter((r) => !attByReg.has(r.id))
      .map(teamRow)
      .sort((a, b) => a.team_name.localeCompare(b.team_name));

    const meals = tokList
      .map((tk) => {
        const m = memberById.get(tk.member_id);
        const t = m ? teamById.get(m.team_id) : undefined;
        return {
          token_id: tk.id,
          full_name: m?.full_name ?? "",
          student_id: m?.student_id ?? "",
          department: m?.department ?? "",
          email: m?.email ?? "",
          phone: m?.phone ?? "",
          food_pref: (m?.food_pref as string) ?? "VEG",
          is_leader: Boolean(m?.is_leader),
          team_name: t?.team_name ?? "",
          team_code: t?.team_code ?? "",
          released: Boolean(tk.released),
          released_at: (tk.released_at as string | null) ?? null,
          redeemed_at: (tk.redeemed_at as string | null) ?? null,
          redeemed_by: (tk.redeemed_by_email as string | null) ?? null,
        };
      })
      .sort((a, b) => String(b.redeemed_at ?? "").localeCompare(String(a.redeemed_at ?? "")));

    const participants = (members ?? []).map((m) => {
      const t = teamById.get(m.team_id);
      const reg = regList.find((r) => r.team_id === m.team_id);
      const att = reg ? attByReg.get(reg.id) : undefined;
      const tk = tokList.find((x) => x.member_id === m.id);
      return {
        member_id: m.id,
        full_name: m.full_name,
        email: m.email,
        phone: m.phone,
        student_id: m.student_id ?? "",
        department: m.department ?? "",
        is_leader: m.is_leader,
        food_pref: (m.food_pref as string) ?? "VEG",
        team_name: t?.team_name ?? "",
        team_code: t?.team_code ?? "",
        registration_code: reg?.registration_code ?? "",
        status: (reg?.status as string) ?? "",
        team_present: Boolean(att),
        meal_redeemed: Boolean(tk?.redeemed_at),
      };
    });

    const registrations = regList
      .map((r) => {
        const t = teamById.get(r.team_id);
        const p = payByReg.get(r.id);
        return {
          registration_id: r.id,
          registration_code: r.registration_code,
          team_name: t?.team_name ?? "",
          team_code: t?.team_code ?? "",
          leader_email: t?.leader_email ?? "",
          team_size: r.team_size,
          status: r.status as string,
          expected_amount: r.expected_amount,
          paid_amount: p?.amount ?? null,
          utr_number: p?.utr_number ?? "",
          payment_status: (p?.status as string) ?? "",
          submitted_at: r.submitted_at as string,
        };
      })
      .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)));

    const byStatus: Record<string, number> = {};
    for (const r of regList) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

    return {
      generated_at: new Date().toISOString(),
      summary: {
        teams_total: regList.length,
        teams_confirmed: confirmed.length,
        teams_present: present.length,
        teams_absent: absent.length,
        participants_total: (members ?? []).length,
        participants_present: participants.filter((p) => p.team_present).length,
        tokens_total: tokList.length,
        tokens_released: tokList.filter((t) => t.released).length,
        tokens_redeemed: tokList.filter((t) => t.redeemed_at).length,
        veg_redeemed: meals.filter((m) => m.redeemed_at && m.food_pref !== "NON_VEG").length,
        nonveg_redeemed: meals.filter((m) => m.redeemed_at && m.food_pref === "NON_VEG").length,
        amount_collected: regList
          .filter((r) => r.status === "REGISTERED" || r.status === "PAYMENT_APPROVED")
          .reduce((s, r) => s + (payByReg.get(r.id)?.amount ?? 0), 0),
        by_status: byStatus,
      },
      present,
      absent,
      meals,
      participants,
      registrations,
    };
  });
