import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { registrationSchema, paymentSchema } from "./schemas";

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const { getCachedSiteContent } = await import("./site-content.server");
  return getCachedSiteContent();
});


export const createRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registrationSchema.parse(d))
  .handler(async ({ data }) => {
    const { assertSameOrigin, throttleRetryMs, throttleMessage, recordFailure, clientIp } =
      await import("./security.server");
    await assertSameOrigin();

    // Rate limit: a few submissions per IP/email, then exponential backoff.
    const ip = await clientIp();
    const throttleIds = [`ip:${ip}`, `email:${data.leader_email}`];
    const retry = await throttleRetryMs("registration", throttleIds);
    if (retry > 0) throw new Error(throttleMessage(retry));
    await recordFailure("registration", throttleIds);

    const { admin, writeAudit, padCode } = await import("./db.server");

    const db = await admin();

    const { data: settings } = await db.from("event_settings").select("*").limit(1).maybeSingle();
    if (!settings) throw new Error("Event configuration unavailable. Try again later.");
    if (settings.maintenance_mode) throw new Error("The platform is under maintenance.");
    if (!settings.registration_open) throw new Error("Registration is currently closed.");
    if (new Date(settings.registration_deadline).getTime() < Date.now())
      throw new Error("The registration deadline has passed.");
    if (data.team_size < settings.min_team_size || data.team_size > settings.max_team_size)
      throw new Error(
        `Team size must be between ${settings.min_team_size} and ${settings.max_team_size}.`,
      );
    if (data.members.length !== data.team_size)
      throw new Error("Member details do not match the selected team size.");

    const { count: teamCount } = await db
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(CANCELLED,PAYMENT_REJECTED)");
    if ((teamCount ?? 0) >= settings.max_teams) throw new Error("Registration is full.");

    const { data: dupe } = await db
      .from("teams")
      .select("id")
      .ilike("leader_email", data.leader_email)
      .limit(1)
      .maybeSingle();
    if (dupe) throw new Error("A team is already registered with this leader email.");

    // Team names must be unique (case-insensitive).
    const { data: nameDupe } = await db
      .from("teams")
      .select("id")
      .ilike("team_name", data.team_name.trim())
      .limit(1)
      .maybeSingle();
    if (nameDupe)
      throw new Error("That team name is already taken. Please choose a different team name.");

    // Server is the only source of truth for pricing.
    const fee = settings.registration_fee;
    const expected = fee * data.team_size;

    const seq = await db.rpc("next_registration_number");
    if (seq.error) throw new Error("Could not allocate a registration ID.");
    const n = Number(seq.data);
    const year = new Date(settings.event_date).getFullYear();
    const registration_code = `BH0-${year}-${padCode(n, 5)}`;
    const team_code = `BH0-TEAM-${padCode(n, 4)}`;

    const { data: team, error: teamErr } = await db
      .from("teams")
      .insert({
        team_code,
        team_name: data.team_name,
        leader_name: data.leader_name,
        leader_email: data.leader_email.toLowerCase(),
        leader_phone: data.leader_phone,
        college: data.college,
        department: data.department,
        year: data.year,
        city: null,
        team_size: data.team_size,
      })
      .select("id, team_code")
      .single();
    if (teamErr || !team) {
      if ((teamErr as { code?: string } | null)?.code === "23505")
        throw new Error("That team name is already taken. Please choose a different team name.");
      throw new Error("Could not create the team record.");
    }

    await db.from("team_members").insert(
      data.members.map((m, i) => ({
        team_id: team.id,
        member_index: i + 1,
        full_name: m.full_name,
        email: m.email.toLowerCase(),
        phone: m.phone,
        student_id: m.student_id || null,
        department: m.department || null,
        year: m.year || null,
        food_pref: m.food_pref,
        is_leader: i === 0,
      })),
    );

    const { data: reg, error: regErr } = await db
      .from("registrations")
      .insert({
        registration_code,
        team_id: team.id,
        status: "PAYMENT_PENDING",
        team_size: data.team_size,
        fee_at_registration: fee,
        expected_amount: expected,
      })
      .select("id, registration_code, status, expected_amount")
      .single();
    if (regErr || !reg) throw new Error("Could not create the registration.");

    await db.from("registration_status_history").insert({
      registration_id: reg.id,
      from_status: "DRAFT",
      to_status: "PAYMENT_PENDING",
      note: "Registration submitted",
    });
    await writeAudit({
      action: "REGISTRATION_CREATED",
      entity: "registrations",
      entity_id: reg.id,
      actor_email: data.leader_email,
      actor_role: "public",
      metadata: { registration_code, team_code, team_size: data.team_size, expected },
    });

    return {
      registration_id: reg.id,
      registration_code,
      team_code,
      team_name: data.team_name,
      team_size: data.team_size,
      fee,
      expected_amount: expected,
      upi_id: settings.upi_id,
      upi_payee_name: settings.upi_payee_name,
      payment_instructions: settings.payment_instructions,
      status: reg.status,
    };
  });

export const submitPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => paymentSchema.parse(d))
  .handler(async ({ data }) => {
    const { assertSameOrigin } = await import("./security.server");
    await assertSameOrigin();
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();

    const { data: reg } = await db
      .from("registrations")
      .select("id, registration_code, status, expected_amount, team_id")
      .eq("id", data.registration_id)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found.");
    if (reg.status !== "PAYMENT_PENDING")
      throw new Error(
        reg.status === "PAYMENT_REJECTED"
          ? "Your payment was rejected. Request another chance before resubmitting."
          : "This registration is not awaiting a payment submission.",
      );


    const { data: existingUtr } = await db
      .from("payments")
      .select("id, registration_id, status")
      .ilike("utr_number", data.utr_number)
      .neq("status", "REJECTED")
      .limit(1)
      .maybeSingle();
    if (existingUtr) {
      await writeAudit({
        action: "DUPLICATE_UTR_ATTEMPT",
        entity: "payments",
        entity_id: reg.id,
        actor_role: "public",
        metadata: { utr: data.utr_number },
      });
      throw new Error("This transaction reference has already been submitted.");
    }

    if (!data.screenshot?.base64) throw new Error("Payment screenshot is required.");
    const raw = data.screenshot.base64.split(",").pop() ?? "";
    const bytes = Buffer.from(raw, "base64");
    if (bytes.length > 5 * 1024 * 1024) throw new Error("Screenshot must be under 5 MB.");
    if (!/^image\/(png|jpe?g|webp)$/.test(data.screenshot.type))
      throw new Error("Screenshot must be a PNG, JPG or WEBP image.");
    const ext = data.screenshot.type.split("/")[1]!.replace("jpeg", "jpg");
    const path = `${reg.registration_code}/${Date.now()}.${ext}`;
    const up = await db.storage
      .from("payment-proofs")
      .upload(path, bytes, { contentType: data.screenshot.type, upsert: false });
    if (up.error) throw new Error("Screenshot upload failed. Try again.");
    const screenshot_path = path;

    const { data: payment, error: payErr } = await db
      .from("payments")
      .insert({
        registration_id: reg.id,
        amount: reg.expected_amount,
        utr_number: data.utr_number.toUpperCase(),
        paid_on: data.paid_on,
        paid_time: data.paid_time,
        screenshot_path,
        status: "SUBMITTED",
      })
      .select("id")
      .single();
    if (payErr || !payment) throw new Error("This transaction reference has already been submitted.");

    await db.from("registrations").update({ status: "PAYMENT_REVIEW" }).eq("id", reg.id);
    await db.from("registration_status_history").insert({
      registration_id: reg.id,
      from_status: reg.status,
      to_status: "PAYMENT_REVIEW",
      note: "Payment proof submitted",
    });
    await writeAudit({
      action: "PAYMENT_SUBMITTED",
      entity: "payments",
      entity_id: payment.id,
      actor_role: "public",
      metadata: { registration_code: reg.registration_code },
    });

    return { ok: true, registration_code: reg.registration_code, status: "PAYMENT_REVIEW" };
  });

export const lookupRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(4).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { admin } = await import("./db.server");
    const db = await admin();
    const q = data.query.trim();

    let teamId: string | null = null;
    const byReg = await db
      .from("registrations")
      .select("team_id")
      .ilike("registration_code", q)
      .maybeSingle();
    if (byReg.data) teamId = byReg.data.team_id;
    if (!teamId) {
      const byTeam = await db.from("teams").select("id").ilike("team_code", q).maybeSingle();
      if (byTeam.data) teamId = byTeam.data.id;
    }
    if (!teamId && q.includes("@")) {
      const byEmail = await db.from("teams").select("id").ilike("leader_email", q).maybeSingle();
      if (byEmail.data) teamId = byEmail.data.id;
    }
    if (!teamId) return { found: false as const };

    const { data: team } = await db
      .from("teams")
      .select("team_code, team_name, team_size, leader_name, college")
      .eq("id", teamId)
      .single();
    const { data: reg } = await db
      .from("registrations")
      .select("id, registration_code, status, expected_amount, submitted_at, verified_at")
      .eq("team_id", teamId)
      .maybeSingle();
    if (!team || !reg) return { found: false as const };
    const { data: payment } = await db
      .from("payments")
      .select("utr_number, status, created_at")
      .eq("registration_id", reg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      found: true as const,
      team_name: team.team_name,
      team_code: team.team_code,
      team_size: team.team_size,
      college: team.college,
      registration_code: reg.registration_code,
      status: reg.status,
      amount: reg.expected_amount,
      submitted_at: reg.submitted_at,
      verified_at: reg.verified_at,
      payment_submitted: !!payment,
      payment_status: payment?.status ?? null,
      utr_number: payment?.utr_number ?? null,
      registration_id: reg.id,
    };
  });

export const getPaymentContext = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ registration_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { admin } = await import("./db.server");
    const db = await admin();
    const { data: reg } = await db
      .from("registrations")
      .select("id, registration_code, status, expected_amount, team_size, fee_at_registration, team_id")
      .eq("id", data.registration_id)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found.");
    const { data: team } = await db
      .from("teams")
      .select("team_name, team_code")
      .eq("id", reg.team_id)
      .single();
    const { data: settings } = await db
      .from("event_settings")
      .select("upi_id, upi_payee_name, payment_instructions, currency, payments_enabled, whatsapp_group_url")
      .limit(1)
      .maybeSingle();
    return { registration: reg, team, settings };
  });

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        email: z.string().trim().email().max(120),
        subject: z.string().trim().max(120).optional().default(""),
        message: z.string().trim().min(10).max(1500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { assertSameOrigin } = await import("./security.server");
    await assertSameOrigin();
    const { admin } = await import("./db.server");
    const db = await admin();
    await db.from("contact_messages").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      subject: data.subject || null,
      message: data.message,
    });
    return { ok: true };
  });

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        email: z.string().trim().email().max(120),
        phone: z.string().trim().min(7).max(20),
        team_name: z.string().trim().max(60).optional().default(""),
        team_size: z.number().int().min(1).max(10),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { assertSameOrigin } = await import("./security.server");
    await assertSameOrigin();
    const { admin } = await import("./db.server");
    const db = await admin();
    const { data: settings } = await db
      .from("event_settings")
      .select("waitlist_enabled")
      .limit(1)
      .maybeSingle();
    if (!settings?.waitlist_enabled) throw new Error("The waitlist is not open.");
    await db.from("waitlist").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      team_name: data.team_name || null,
      team_size: data.team_size,
    });
    return { ok: true };
  });

export const getCustomPage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { publicClient } = await import("./db.server");
    const sb = publicClient();
    const { data: page } = await sb
      .from("custom_pages")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    return page;
  });
