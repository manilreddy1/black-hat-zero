/**
 * Opaque, signed QR tokens. The payload carries no secrets — the signature is
 * what makes a token unforgeable, so a copied/edited QR is rejected.
 * Format: `<kind>.<id>.<sig>` where sig = HMAC-SHA256(salt, kind:id) (24 hex).
 */
const encoder = new TextEncoder();

async function sign(payload: string) {
  const salt = process.env["CONSOLE_KEY_SALT"] ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${salt}:qr`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

export type TokenKind = "A" | "F";

export async function makeToken(kind: TokenKind, id: string) {
  const payload = `${kind}:${id}`;
  return `BH0-${kind}-${id}-${await sign(payload)}`;
}

export async function readToken(raw: string): Promise<{ kind: TokenKind; id: string } | null> {
  const value = (raw ?? "").trim().toUpperCase();
  const m = /^BH0-([AF])-([0-9A-F-]{36})-([0-9A-F]{24})$/.exec(value);
  if (!m) return null;
  const kind = m[1] as TokenKind;
  const id = m[2]!.toLowerCase();
  const expected = await sign(`${kind}:${id}`);
  // Constant-time-ish compare.
  const given = m[3]!.toLowerCase();
  if (given.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? { kind, id } : null;
}
