import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Publishable-key client for public reads during SSR (RLS applies as anon). */
export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function writeAudit(entry: {
  actor_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await admin();
  await db.from("audit_logs").insert({
    actor_id: entry.actor_id ?? null,
    actor_email: entry.actor_email ?? null,
    actor_role: entry.actor_role ?? null,
    action: entry.action,
    entity: entry.entity ?? null,
    entity_id: entry.entity_id ?? null,
    metadata: (entry.metadata ?? {}) as never,
  });
}

export function padCode(n: number, len: number) {
  return String(n).padStart(len, "0");
}
