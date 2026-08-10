import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailInput = z.object({ email: z.string().trim().email().max(160) });

/**
 * Called before a staff sign-in attempt. Throws (with a retry hint) while the
 * email or the caller's IP is locked out by exponential backoff.
 */
export const preStaffLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailInput.parse(d))
  .handler(async ({ data }) => {
    const { assertNotThrottled, clientIp } = await import("./security.server");
    const ip = await clientIp();
    await assertNotThrottled("staff_login", [`email:${data.email}`, `ip:${ip}`]);
    return { ok: true as const };
  });

/** Reports the outcome of a staff sign-in so the backoff can grow or reset. */
export const reportStaffLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailInput.extend({ success: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { recordFailure, clearThrottle, clientIp } = await import("./security.server");
    const { writeAudit } = await import("./db.server");
    const ip = await clientIp();
    const ids = [`email:${data.email}`, `ip:${ip}`];
    if (data.success) {
      await clearThrottle("staff_login", ids);
      await writeAudit({
        action: "STAFF_LOGIN_SUCCESS",
        entity: "auth",
        actor_email: data.email,
        actor_role: "staff",
        metadata: { ip },
      });
      return { locked_ms: 0 };
    }
    const locked_ms = await recordFailure("staff_login", ids);
    await writeAudit({
      action: "STAFF_LOGIN_FAILED",
      entity: "auth",
      actor_email: data.email,
      actor_role: "public",
      metadata: { ip, locked_ms },
    });
    return { locked_ms };
  });

/**
 * Single source of truth for console access. Re-validates the session token,
 * re-derives the console key and re-reads the roles from the database on every
 * request — nothing about the client's state is trusted.
 */
export const verifyConsoleAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ k: z.string().max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertNotThrottled, recordFailure, clearThrottle, clientIp } = await import(
      "./security.server"
    );
    const ip = await clientIp();
    const ids = [`user:${context.userId}`, `ip:${ip}`];
    await assertNotThrottled("console_key", ids);

    const salt = process.env["CONSOLE_KEY_SALT"] ?? "";
    const bytes = new TextEncoder().encode(`${salt}:${context.userId}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const key = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 24);

    if (key !== data.k) {
      const { writeAudit } = await import("./db.server");
      await recordFailure("console_key", ids);
      await writeAudit({
        actor_id: context.userId,
        action: "CONSOLE_KEY_MISMATCH",
        entity: "console",
        metadata: { ip },
      });
      throw new Error("Not found");
    }

    // Roles are re-read server-side on every console request.
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (roleRows ?? []).map((r) => r.role as string);

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, is_active")
      .eq("id", context.userId)
      .maybeSingle();

    if (profile && profile.is_active === false) throw new Error("This account is deactivated.");

    await clearThrottle("console_key", ids);
    return { key, roles, profile, userId: context.userId };
  });
