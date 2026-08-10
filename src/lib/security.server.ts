/**
 * Server-only brute-force throttle with exponential backoff.
 * State lives in the database (workers are stateless), keyed by scope+identifier.
 */
const FREE_ATTEMPTS = 3; // attempts allowed before backoff kicks in
const BASE_DELAY_MS = 5_000; // first penalty
const MAX_DELAY_MS = 15 * 60_000; // 15 minutes
const WINDOW_MS = 30 * 60_000; // counter resets after this much quiet time

export async function hashIdentifier(value: string) {
  const salt = process.env["CONSOLE_KEY_SALT"] ?? "";
  const bytes = new TextEncoder().encode(`${salt}:throttle:${value.toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export async function clientIp(): Promise<string> {
  try {
    const { getRequestIP } = await import("@tanstack/react-start/server");
    return getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    return "unknown";
  }
}

export function backoffMs(attempts: number) {
  if (attempts <= FREE_ATTEMPTS) return 0;
  return Math.min(BASE_DELAY_MS * 2 ** (attempts - FREE_ATTEMPTS - 1), MAX_DELAY_MS);
}

type Row = { attempts: number; locked_until: string | null; last_attempt_at: string };

async function readRow(scope: string, identifier: string) {
  const { admin } = await import("./db.server");
  const db = await admin();
  const { data } = await db
    .from("auth_throttle")
    .select("attempts, locked_until, last_attempt_at")
    .eq("scope", scope)
    .eq("identifier", identifier)
    .maybeSingle();
  return (data ?? null) as Row | null;
}

/** Returns the remaining lockout in ms (0 when not throttled). Never throws. */
export async function throttleRetryMs(scope: string, rawIdentifiers: string[]) {
  let retryAfter = 0;
  for (const raw of rawIdentifiers) {
    const row = await readRow(scope, await hashIdentifier(raw));
    if (!row?.locked_until) continue;
    const ms = new Date(row.locked_until).getTime() - Date.now();
    if (ms > retryAfter) retryAfter = ms;
  }
  return retryAfter > 0 ? retryAfter : 0;
}

export function throttleMessage(retryAfterMs: number) {
  const secs = Math.ceil(retryAfterMs / 1000);
  return `Too many failed attempts. Try again in ${secs >= 60 ? `${Math.ceil(secs / 60)} minute(s)` : `${secs} second(s)`}.`;
}

/** Throws when the caller is currently locked out (used on non-UI paths). */
export async function assertNotThrottled(scope: string, rawIdentifiers: string[]) {
  const ms = await throttleRetryMs(scope, rawIdentifiers);
  if (ms > 0) throw new Error(throttleMessage(ms));
}

/** Records a failure and extends the lockout exponentially. */
export async function recordFailure(scope: string, rawIdentifiers: string[]) {
  const { admin } = await import("./db.server");
  const db = await admin();
  let retryAfterMs = 0;
  for (const raw of rawIdentifiers) {
    const identifier = await hashIdentifier(raw);
    const row = await readRow(scope, identifier);
    const stale =
      row && Date.now() - new Date(row.last_attempt_at).getTime() > WINDOW_MS && !row.locked_until;
    const attempts = (stale ? 0 : (row?.attempts ?? 0)) + 1;
    const delay = backoffMs(attempts);
    const locked_until = delay > 0 ? new Date(Date.now() + delay).toISOString() : null;
    if (delay > retryAfterMs) retryAfterMs = delay;
    await db.from("auth_throttle").upsert(
      {
        scope,
        identifier,
        attempts,
        locked_until,
        last_attempt_at: new Date().toISOString(),
      },
      { onConflict: "scope,identifier" },
    );
  }
  return retryAfterMs;
}

/** Clears the counters after a successful authentication. */
export async function clearThrottle(scope: string, rawIdentifiers: string[]) {
  const { admin } = await import("./db.server");
  const db = await admin();
  for (const raw of rawIdentifiers) {
    await db
      .from("auth_throttle")
      .delete()
      .eq("scope", scope)
      .eq("identifier", await hashIdentifier(raw));
  }
}
