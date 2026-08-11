/**
 * Server-only helpers for team-lead accounts.
 * A lead account is a normal auth user with NO role rows, so the staff console
 * gate (which requires a role) rejects it outright.
 */
export async function ensureLeadAccount(email: string, fullName: string, origin: string) {
  const { admin } = await import("./db.server");
  const db = await admin();

  const addr = email.toLowerCase();
  // Create the account if it doesn't exist yet. A random password is set and
  // never surfaced anywhere — the lead sets their own via the emailed link.
  const random = crypto.randomUUID() + crypto.randomUUID();
  const created = await db.auth.admin.createUser({
    email: addr,
    password: random,
    email_confirm: true,
    user_metadata: { full_name: fullName, account_type: "team_lead" },
  });
  const userId = created.data.user?.id ?? null;

  await sendLeadPasswordEmail(addr, origin);
  return userId;
}

/** Sends the built-in password-set / recovery email to a team lead. */
export async function sendLeadPasswordEmail(email: string, origin: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const safeOrigin = /^https?:\/\/[^\s/]+$/.test(origin) ? origin : "";
  await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${safeOrigin}/team/set-password`,
  });
}
