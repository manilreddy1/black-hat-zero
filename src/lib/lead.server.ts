/**
 * Server-only helpers for team-lead accounts.
 * A lead account is a normal auth user with NO role rows, so the staff console
 * gate (which requires a role) rejects it outright.
 *
 * Flow: staff confirm a team -> a random temporary password is issued and sent
 * to the leader's inbox -> the lead signs in with it and is forced to choose a
 * new password before the portal unlocks (`must_change_password` metadata).
 */

/** Human-typable temporary password: uppercase + digits, no ambiguous chars. */
export function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `BH0-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

/**
 * Creates the lead account when missing and always sets a fresh temporary
 * password, flagged so the portal forces a change on first sign-in.
 * Returns the plaintext temp password so staff/email can deliver it.
 */
export async function issueLeadPassword(email: string, fullName: string) {
  const { admin } = await import("./db.server");
  const db = await admin();

  const addr = email.toLowerCase();
  const temp = generateTempPassword();
  const meta = { full_name: fullName, account_type: "team_lead", must_change_password: true };

  const created = await db.auth.admin.createUser({
    email: addr,
    password: temp,
    email_confirm: true,
    user_metadata: meta,
  });
  let userId = created.data.user?.id ?? null;

  if (!userId) {
    // Account already exists — find it and reset its password instead.
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users.find((u) => (u.email ?? "").toLowerCase() === addr);
    if (!existing) throw new Error("Could not create or find the lead account.");
    userId = existing.id;
    await db.auth.admin.updateUserById(userId, {
      password: temp,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata ?? {}), ...meta },
    });
  }

  const emailed = await sendLeadPasswordEmail(addr, fullName, temp).catch(() => false);
  return { userId, tempPassword: temp, emailed };
}

/**
 * Emails the temporary password to the lead through Lovable's managed email
 * API. Failures are logged and reported back so staff can fall back to
 * handing the password over manually.
 */
export async function sendLeadPasswordEmail(email: string, fullName: string, temp: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  // Verified sender subdomain for this project (not a secret).
  const senderDomain =
    process.env["LOVABLE_EMAIL_SENDER_DOMAIN"] ?? "notify.blackhatzeronrcm.linkpc.net";
  if (!apiKey || !senderDomain) {
    console.error("[lead-email] missing LOVABLE_API_KEY or sender domain");
    return false;
  }

  const { leadPasswordEmailHtml } = await import("./lead-email");
  const { sendLovableEmail } = await import("@lovable.dev/email-js");

  try {
    const res = await sendLovableEmail(
      {
        to: email,
        from: `BLACK HAT ZERO <noreply@${senderDomain}>`,
        sender_domain: senderDomain,
        subject: "Your BLACK HAT ZERO '26 team portal password",
        html: leadPasswordEmailHtml(fullName, temp),
        text: `Hi ${fullName},\n\nYour BLACK HAT ZERO '26 team portal password: ${temp}\n\nSign in at the Team Login page and set your own password immediately.`,
        purpose: "transactional",
      },
      { apiKey, idempotencyKey: `lead-password-${crypto.randomUUID()}` },
    );
    if (!res.success) console.error("[lead-email] send not accepted", res.status);
    return res.success !== false;
  } catch (err) {
    console.error("[lead-email] send failed", err);
    return false;
  }
}

