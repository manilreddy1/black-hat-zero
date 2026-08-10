import type { SupabaseClient } from "@supabase/supabase-js";

type AnyClient = SupabaseClient<never, never, never>;

export async function getRoles(supabase: unknown, userId: string): Promise<string[]> {
  const client = supabase as AnyClient;
  const { data } = await (client.from("user_roles") as never as {
    select: (c: string) => { eq: (a: string, b: string) => Promise<{ data: { role: string }[] | null }> };
  })
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.role);
}

export async function requireStaff(supabase: unknown, userId: string) {
  const roles = await getRoles(supabase, userId);
  if (roles.length === 0) throw new Error("Unauthorized: staff access required.");
  return roles[0]!;
}

export async function requireRole(supabase: unknown, userId: string, allowed: string[]) {
  const roles = await getRoles(supabase, userId);
  const match = roles.find((r) => allowed.includes(r));
  if (!match) throw new Error("Unauthorized: insufficient permissions.");
  return match;
}

/**
 * Keeps `sort_order` values unique and sequential (1..n) for ordered content
 * tables. The row identified by `id` wins ties, so setting it to an existing
 * number pushes the current occupant (and everything after it) down by one.
 */
export async function resequenceSortOrder(
  db: {
    from: (t: string) => {
      select: (c: string) => { order: (c: string) => Promise<{ data: { id: string; sort_order: number }[] | null }> };
      update: (v: Record<string, unknown>) => { eq: (a: string, b: string) => Promise<unknown> };
    };
  },
  table: string,
  id: string,
  target: number,
) {
  const { data } = await db.from(table).select("id, sort_order").order("sort_order");
  const rows = data ?? [];
  const moved = rows.find((r) => r.id === id);
  if (!moved) return;
  const others = rows.filter((r) => r.id !== id);
  const clamped = Math.max(1, Math.min(target, others.length + 1));
  const ordered = [...others];
  ordered.splice(clamped - 1, 0, moved);
  await Promise.all(
    ordered.map((row, i) =>
      row.sort_order === i + 1
        ? Promise.resolve()
        : db.from(table).update({ sort_order: i + 1 }).eq("id", row.id),
    ),
  );
}
