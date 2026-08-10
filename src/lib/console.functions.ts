import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns an unguessable, per-user console key derived from the signed-in
 * user's id + a server-only salt. The staff console lives at /c/<key>, so the
 * admin area has no discoverable URL.
 */
export const getConsoleKey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const salt = process.env["CONSOLE_KEY_SALT"] ?? "";
    const bytes = new TextEncoder().encode(`${salt}:${context.userId}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const key = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 24);
    return { key };
  });
