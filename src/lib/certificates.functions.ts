import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const certificateFieldSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  source: z.enum(["name", "team", "college", "code", "event", "date", "custom"]),
  text: z.string().max(200).default(""),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(4).max(200),
  color: z.string().max(24),
  weight: z.string().max(10),
  align: z.enum(["left", "center", "right"]),
  font: z.string().max(60),
  fontUrl: z.string().max(300).optional().default(""),
  letterSpacing: z.number().min(-10).max(40).optional().default(0),
  italic: z.boolean().optional().default(false),
  uppercase: z.boolean().default(false),

});

export type CertificateField = z.infer<typeof certificateFieldSchema>;

/** Public: certificate section config + a signed URL for the template image. */
export const getCertificateConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { admin } = await import("./db.server");
  const db = await admin();
  const { data } = await db.from("certificate_settings").select("*").limit(1).maybeSingle();
  if (!data) return null;
  let template_url: string | null = null;
  if (data.template_path) {
    const signed = await db.storage
      .from("certificates")
      .createSignedUrl(data.template_path, 60 * 60);
    template_url = signed.data?.signedUrl ?? null;
  }
  return {
    id: data.id,
    is_enabled: data.is_enabled,
    section_title: data.section_title,
    section_subtitle: data.section_subtitle,
    note: data.note,
    template_path: data.template_path,
    template_url,
    fields: (data.fields ?? []) as CertificateField[],
  };
});

/** Public: find verified participants eligible for a certificate. */
export const lookupCertificate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(4).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { admin } = await import("./db.server");
    const { throttleRetryMs, throttleMessage, recordFailure, clearThrottle, clientIp } =
      await import("./security.server");
    const db = await admin();

    // Abuse protection: exponential backoff per IP for wrong/unknown codes.
    const ip = await clientIp();
    const ids = [`ip:${ip}`];
    const retry_ms = await throttleRetryMs("cert_lookup", ids);
    if (retry_ms > 0)
      return { found: false as const, reason: "throttled" as const, message: throttleMessage(retry_ms) };

    const cfg = await db.from("certificate_settings").select("is_enabled").limit(1).maybeSingle();
    if (!cfg.data?.is_enabled)
      return { found: false as const, reason: "disabled" as const, message: "Certificates are not available yet." };

    const q = data.query.trim();
    let teamId: string | null = null;
    let reg: { registration_code: string; status: string } | null = null;


    const byCode = await db
      .from("registrations")
      .select("registration_code, status, team_id")
      .ilike("registration_code", q)
      .maybeSingle();
    if (byCode.data) {
      teamId = byCode.data.team_id;
      reg = byCode.data;
    } else {
      const team = await db
        .from("teams")
        .select("id")
        .or(`team_code.ilike.${q},leader_email.ilike.${q}`)
        .limit(1)
        .maybeSingle();
      if (team.data) {
        teamId = team.data.id;
        const r = await db
          .from("registrations")
          .select("registration_code, status")
          .eq("team_id", team.data.id)
          .maybeSingle();
        reg = r.data;
      }
    }

    if (!teamId || !reg) {
      const ms = await recordFailure("cert_lookup", ids);
      return {
        found: false as const,
        reason: "not_found" as const,
        message: ms > 0 ? throttleMessage(ms) : "",
      };
    }
    if (!["REGISTERED", "PAYMENT_APPROVED"].includes(reg.status))
      return { found: false as const, reason: "not_verified" as const, message: "" };

    await clearThrottle("cert_lookup", ids);

    const [team, members, settings] = await Promise.all([
      db.from("teams").select("team_name, college").eq("id", teamId).maybeSingle(),
      db.from("team_members").select("full_name").eq("team_id", teamId).order("member_index"),
      db.from("event_settings").select("event_name, event_date").limit(1).maybeSingle(),
    ]);


    return {
      found: true as const,
      registration_code: reg.registration_code,
      team_name: team.data?.team_name ?? "",
      college: team.data?.college ?? "",
      event_name: settings.data?.event_name ?? "",
      event_date: settings.data?.event_date ?? "",
      members: (members.data ?? []).map((m) => m.full_name),
    };
  });

/* ------------------------------- staff side ------------------------------- */

export const getCertificateAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin } = await import("./db.server");
    const db = await admin();
    const { data } = await db.from("certificate_settings").select("*").limit(1).maybeSingle();
    if (!data) return null;
    let template_url: string | null = null;
    if (data.template_path) {
      const signed = await db.storage
        .from("certificates")
        .createSignedUrl(data.template_path, 60 * 60);
      template_url = signed.data?.signedUrl ?? null;
    }
    return { ...data, fields: (data.fields ?? []) as CertificateField[], template_url };
  });

export const saveCertificateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        is_enabled: z.boolean(),
        section_title: z.string().trim().min(1).max(80),
        section_subtitle: z.string().trim().max(200),
        note: z.string().trim().max(300),
        fields: z.array(certificateFieldSchema).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const row = await db.from("certificate_settings").select("id").limit(1).maybeSingle();
    if (!row.data) throw new Error("Certificate settings row missing.");
    const { error } = await db
      .from("certificate_settings")
      .update({
        is_enabled: data.is_enabled,
        section_title: data.section_title,
        section_subtitle: data.section_subtitle,
        note: data.note,
        fields: data.fields as never,
      })
      .eq("id", row.data.id);
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: context.userId,
      actor_role: "admin",
      action: "CERTIFICATE_SETTINGS_UPDATED",
      entity: "certificate_settings",
      entity_id: row.data.id,
    });
    return { ok: true };
  });

export const uploadCertificateTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().max(140),
        type: z.string().max(60),
        base64: z.string().min(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    if (!/^image\/(png|jpe?g|webp)$/.test(data.type))
      throw new Error("Template must be a PNG, JPG or WEBP image.");
    const raw = data.base64.split(",").pop() ?? "";
    const bytes = Buffer.from(raw, "base64");
    if (bytes.length > 8 * 1024 * 1024) throw new Error("Template must be under 8 MB.");

    const { admin } = await import("./db.server");
    const db = await admin();
    const ext = data.type.split("/")[1]!.replace("jpeg", "jpg");
    const path = `templates/${Date.now()}.${ext}`;
    const up = await db.storage
      .from("certificates")
      .upload(path, bytes, { contentType: data.type, upsert: true });
    if (up.error) throw new Error(up.error.message);

    const row = await db.from("certificate_settings").select("id").limit(1).maybeSingle();
    if (row.data)
      await db.from("certificate_settings").update({ template_path: path }).eq("id", row.data.id);

    const signed = await db.storage.from("certificates").createSignedUrl(path, 60 * 60);
    void context.userId;
    return { path, url: signed.data?.signedUrl ?? null };
  });
