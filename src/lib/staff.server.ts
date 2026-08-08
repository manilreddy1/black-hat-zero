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
