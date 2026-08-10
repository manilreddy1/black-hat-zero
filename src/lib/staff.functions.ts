import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONTENT_TABLES } from "./schemas";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, is_active")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      userId: context.userId,
      profile,
      roles: (roles ?? []).map((r) => r.role as string),
    };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("./staff.server");
    await requireStaff(context.supabase, context.userId);
    const { admin } = await import("./db.server");
    const db = await admin();

    const { data: regs } = await db
      .from("registrations")
      .select("id, status, team_size, expected_amount, created_at, team_id")
      .order("created_at", { ascending: false });
    const list = regs ?? [];
    const { data: teams } = await db.from("teams").select("id, college");
    const collegeById = new Map((teams ?? []).map((t) => [t.id, t.college]));

    const by = (s: string) => list.filter((r) => r.status === s).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paid = list.filter((r) => r.status === "REGISTERED" || r.status === "PAYMENT_APPROVED");
    const overTime = new Map<string, number>();
    for (const r of list) {
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      overTime.set(k, (overTime.get(k) ?? 0) + 1);
    }
    const sizeDist = new Map<number, number>();
    for (const r of list) sizeDist.set(r.team_size, (sizeDist.get(r.team_size) ?? 0) + 1);
    const collegeDist = new Map<string, number>();
    for (const r of list) {
      const c = collegeById.get(r.team_id) ?? "Unknown";
      collegeDist.set(c, (collegeDist.get(c) ?? 0) + 1);
    }

    return {
      total: list.length,
      registered: by("REGISTERED"),
      pending: by("PAYMENT_PENDING"),
      review: by("PAYMENT_REVIEW"),
      approved: by("PAYMENT_APPROVED"),
      rejected: by("PAYMENT_REJECTED"),
      cancelled: by("CANCELLED"),
      participants: list
        .filter((r) => r.status !== "CANCELLED")
        .reduce((a, r) => a + r.team_size, 0),
      revenue: paid.reduce((a, r) => a + r.expected_amount, 0),
      todays: list.filter((r) => new Date(r.created_at) >= today).length,
      overTime: [...overTime.entries()]
        .sort()
        .slice(-14)
        .map(([date, count]) => ({ date: date.slice(5), count })),
      statusDist: [
        { name: "Pending", value: by("PAYMENT_PENDING") },
        { name: "Review", value: by("PAYMENT_REVIEW") },
        { name: "Registered", value: by("REGISTERED") },
        { name: "Rejected", value: by("PAYMENT_REJECTED") },
      ],
      sizeDist: [...sizeDist.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([size, count]) => ({ name: `${size} member${size > 1 ? "s" : ""}`, count })),
      collegeDist: [...collegeDist.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count })),
    };
  });

export const listRegistrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.string().optional().default("ALL"),
        search: z.string().trim().max(120).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("./staff.server");
    await requireStaff(context.supabase, context.userId);
    const { admin } = await import("./db.server");
    const db = await admin();

    let q = db
      .from("registrations")
      .select(
        "id, registration_code, status, team_size, expected_amount, submitted_at, verified_at, verified_by, team_id",
      )
      .order("submitted_at", { ascending: false })
      .limit(500);
    if (data.status && data.status !== "ALL") q = q.eq("status", data.status as never);
    const { data: regs } = await q;
    const list = regs ?? [];
    const teamIds = list.map((r) => r.team_id);
    const { data: teams } = teamIds.length
      ? await db
          .from("teams")
          .select("id, team_code, team_name, leader_name, leader_email, leader_phone, college")
          .in("id", teamIds)
      : { data: [] };
    const tMap = new Map((teams ?? []).map((t) => [t.id, t]));
    const { data: pays } = await db.from("payments").select("registration_id, utr_number, status");
    const pMap = new Map((pays ?? []).map((p) => [p.registration_id, p]));

    const rows = list.map((r) => {
      const t = tMap.get(r.team_id);
      return {
        ...r,
        team_code: t?.team_code ?? "",
        team_name: t?.team_name ?? "",
        leader_name: t?.leader_name ?? "",
        leader_email: t?.leader_email ?? "",
        leader_phone: t?.leader_phone ?? "",
        college: t?.college ?? "",
        utr_number: pMap.get(r.id)?.utr_number ?? null,
        payment_status: pMap.get(r.id)?.status ?? "NOT_SUBMITTED",
      };
    });
    const s = data.search.toLowerCase();
    return s
      ? rows.filter((r) =>
          [
            r.registration_code,
            r.team_code,
            r.team_name,
            r.leader_email,
            r.leader_phone,
            r.college,
            r.utr_number ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(s),
        )
      : rows;
  });

export const getRegistrationDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { requireStaff } = await import("./staff.server");
    await requireStaff(context.supabase, context.userId);
    const { admin } = await import("./db.server");
    const db = await admin();

    const { data: reg } = await db.from("registrations").select("*").eq("id", data.id).maybeSingle();
    if (!reg) throw new Error("Registration not found.");
    const { data: team } = await db.from("teams").select("*").eq("id", reg.team_id).single();
    const { data: members } = await db
      .from("team_members")
      .select("*")
      .eq("team_id", reg.team_id)
      .order("member_index");
    const { data: payment } = await db
      .from("payments")
      .select("*")
      .eq("registration_id", reg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: history } = await db
      .from("registration_status_history")
      .select("*")
      .eq("registration_id", reg.id)
      .order("created_at");
    const { data: verifications } = await db
      .from("payment_verifications")
      .select("*")
      .eq("registration_id", reg.id)
      .order("created_at", { ascending: false });

    let screenshot_url: string | null = null;
    if (payment?.screenshot_path) {
      const signed = await db.storage
        .from("payment-proofs")
        .createSignedUrl(payment.screenshot_path, 600);
      screenshot_url = signed.data?.signedUrl ?? null;
    }
    return {
      registration: reg,
      team,
      members: members ?? [],
      payment,
      screenshot_url,
      history: history ?? [],
      verifications: verifications ?? [],
    };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        registration_id: z.string().uuid(),
        decision: z.enum(["APPROVE", "REJECT"]),
        reason: z.string().trim().max(300).optional().default(""),
        notes: z.string().trim().max(500).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    const role = await requireRole(context.supabase, context.userId, [
      "payment_verifier",
      "admin",
    ]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();

    const { data: reg } = await db
      .from("registrations")
      .select("id, status, registration_code")
      .eq("id", data.registration_id)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found.");
    if (reg.status !== "PAYMENT_REVIEW")
      throw new Error("Only registrations under review can be verified.");
    const { data: payment } = await db
      .from("payments")
      .select("id")
      .eq("registration_id", reg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!payment) throw new Error("No payment submission found.");
    if (data.decision === "REJECT" && !data.reason.trim())
      throw new Error("A rejection reason is required.");

    const approve = data.decision === "APPROVE";
    await db.from("payment_verifications").insert({
      payment_id: payment.id,
      registration_id: reg.id,
      decision: approve ? "APPROVED" : "REJECTED",
      reason: data.reason || null,
      notes: data.notes || null,
      verified_by: context.userId,
    });
    await db
      .from("payments")
      .update({ status: approve ? "APPROVED" : "REJECTED" })
      .eq("id", payment.id);

    if (approve) {
      await db
        .from("registrations")
        .update({
          status: "PAYMENT_APPROVED",
          verified_by: context.userId,
          verified_at: new Date().toISOString(),
        })
        .eq("id", reg.id);
      await db.from("registration_status_history").insert([
        {
          registration_id: reg.id,
          from_status: "PAYMENT_REVIEW",
          to_status: "PAYMENT_APPROVED",
          note: data.notes || null,
          changed_by: context.userId,
        },
      ]);
      await db.from("registrations").update({ status: "REGISTERED" }).eq("id", reg.id);
      await db.from("registration_status_history").insert([
        {
          registration_id: reg.id,
          from_status: "PAYMENT_APPROVED",
          to_status: "REGISTERED",
          note: "Auto-promoted after payment approval",
          changed_by: context.userId,
        },
      ]);
    } else {
      await db.from("registrations").update({ status: "PAYMENT_REJECTED" }).eq("id", reg.id);
      await db.from("registration_status_history").insert({
        registration_id: reg.id,
        from_status: "PAYMENT_REVIEW",
        to_status: "PAYMENT_REJECTED",
        note: data.reason,
        changed_by: context.userId,
      });
      await db.from("registrations").update({ status: "PAYMENT_PENDING" }).eq("id", reg.id);
      await db.from("registration_status_history").insert({
        registration_id: reg.id,
        from_status: "PAYMENT_REJECTED",
        to_status: "PAYMENT_PENDING",
        note: "Team may resubmit payment",
        changed_by: context.userId,
      });
    }

    await writeAudit({
      actor_id: context.userId,
      actor_role: role,
      action: approve ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED",
      entity: "registrations",
      entity_id: reg.id,
      metadata: { registration_code: reg.registration_code, reason: data.reason },
    });
    return { ok: true };
  });

export const updateEventSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.record(z.string(), z.unknown()).parse(d))
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const { data: current } = await db.from("event_settings").select("*").limit(1).maybeSingle();
    if (!current) throw new Error("Event settings not found.");
    const patch = { ...data } as Record<string, unknown>;
    delete patch["id"];
    delete patch["created_at"];
    const { error } = await db.from("event_settings").update(patch as never).eq("id", current.id);
    if (error) throw new Error(error.message);
    const changedKeys = Object.keys(patch).filter(
      (k) => JSON.stringify((current as never)[k]) !== JSON.stringify(patch[k]),
    );
    for (const key of changedKeys) {
      const action =
        key === "upi_id" ? "UPI_CHANGED" : key === "registration_fee" ? "FEE_CHANGED" : "SETTINGS_UPDATED";
      await writeAudit({
        actor_id: context.userId,
        actor_role: "admin",
        action,
        entity: "event_settings",
        entity_id: current.id,
        metadata: { key, from: (current as never)[key], to: patch[key] },
      });
    }
    return { ok: true };
  });

export const saveContentRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: z.enum(CONTENT_TABLES),
        id: z.string().uuid().nullable().optional(),
        values: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole, resequenceSortOrder } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    let rowId = data.id ?? null;
    if (data.id) {
      const { error } = await db.from(data.table).update(data.values as never).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await db
        .from(data.table)
        .insert(data.values as never)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      rowId = (inserted as { id?: string } | null)?.id ?? null;
    }

    // Setting a sort order that is already taken pushes the rest down by one.
    const target = Number((data.values as Record<string, unknown>)["sort_order"]);
    if (rowId && Number.isFinite(target)) {
      await resequenceSortOrder(db as never, data.table, rowId, target);
    }

    await writeAudit({
      actor_id: context.userId,
      actor_role: "admin",
      action: "CONTENT_UPDATED",
      entity: data.table,
      entity_id: data.id ?? "new",
    });
    return { ok: true };
  });

export const deleteContentRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ table: z.enum(CONTENT_TABLES), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const { error } = await db.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit({
      actor_id: context.userId,
      actor_role: "admin",
      action: "CONTENT_DELETED",
      entity: data.table,
      entity_id: data.id,
    });
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin } = await import("./db.server");
    const db = await admin();
    const { data } = await db
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    return data ?? [];
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("./staff.server");
    await requireStaff(context.supabase, context.userId);
    const { admin } = await import("./db.server");
    const db = await admin();
    const { data } = await db
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const listStaffUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getRoles } = await import("./staff.server");
    const myRoles = await getRoles(context.supabase, context.userId);
    const isSuperAdmin = myRoles.includes("super_admin");
    if (!isSuperAdmin && !myRoles.includes("admin")) {
      throw new Error("Unauthorized: insufficient permissions.");
    }
    const { admin } = await import("./db.server");
    const db = await admin();
    const { data: roles } = await db.from("user_roles").select("user_id, role");
    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await db.from("profiles").select("*").in("id", ids)
      : { data: [] };
    const users = (profiles ?? [])
      .map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
      }))
      // The super admin account stays invisible to ordinary admins.
      .filter((u) => isSuperAdmin || !u.roles.includes("super_admin"));
    return { isSuperAdmin, users };
  });

export const createStaffUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(120),
        password: z.string().min(10).max(72),
        full_name: z.string().trim().min(2).max(80),
        role: z.enum(["admin", "coordinator", "payment_verifier"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { getRoles } = await import("./staff.server");
    const myRoles = await getRoles(context.supabase, context.userId);
    const isSuperAdmin = myRoles.includes("super_admin");
    if (!isSuperAdmin && !myRoles.includes("admin")) {
      throw new Error("Unauthorized: insufficient permissions.");
    }
    if (!isSuperAdmin && data.role === "admin") {
      throw new Error("Only the super admin can create administrators.");
    }
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const created = await db.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (created.error || !created.data.user) throw new Error(created.error?.message ?? "Failed");
    const uid = created.data.user.id;
    await db.from("profiles").upsert({ id: uid, email: data.email, full_name: data.full_name });
    await db.from("user_roles").insert({ user_id: uid, role: data.role });
    await writeAudit({
      actor_id: context.userId,
      actor_role: isSuperAdmin ? "super_admin" : "admin",
      action: "USER_CREATED",
      entity: "profiles",
      entity_id: uid,
      metadata: { email: data.email, role: data.role },
    });
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "coordinator", "payment_verifier"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    // Role changes are exclusively a super admin power.
    await requireRole(context.supabase, context.userId, ["super_admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const { data: targetRoles } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    if ((targetRoles ?? []).some((r) => r.role === "super_admin")) {
      throw new Error("The super admin account cannot be modified.");
    }
    await db.from("user_roles").delete().eq("user_id", data.user_id);
    await db.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    await writeAudit({
      actor_id: context.userId,
      actor_role: "super_admin",
      action: "ROLE_CHANGED",
      entity: "user_roles",
      entity_id: data.user_id,
      metadata: { role: data.role },
    });
    return { ok: true };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ user_id: z.string().uuid(), is_active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { getRoles } = await import("./staff.server");
    const myRoles = await getRoles(context.supabase, context.userId);
    const isSuperAdmin = myRoles.includes("super_admin");
    if (!isSuperAdmin && !myRoles.includes("admin")) {
      throw new Error("Unauthorized: insufficient permissions.");
    }
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const { data: targetRoles } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);
    const target = (targetRoles ?? []).map((r) => r.role as string);
    if (target.includes("super_admin")) {
      throw new Error("The super admin account cannot be modified.");
    }
    if (!isSuperAdmin && target.includes("admin")) {
      throw new Error("Only the super admin can modify administrator accounts.");
    }
    await db.from("profiles").update({ is_active: data.is_active }).eq("id", data.user_id);
    await db.auth.admin.updateUserById(data.user_id, {
      ban_duration: data.is_active ? "none" : "876000h",
    });
    await writeAudit({
      actor_id: context.userId,
      actor_role: isSuperAdmin ? "super_admin" : "admin",
      action: data.is_active ? "USER_ENABLED" : "USER_DISABLED",
      entity: "profiles",
      entity_id: data.user_id,
    });
    return { ok: true };
  });

export const listSiteTexts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin } = await import("./db.server");
    const db = await admin();
    const { data, error } = await db
      .from("site_texts")
      .select("*")
      .order("group_name")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveSiteTexts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        items: z.array(z.object({ key: z.string().min(1).max(120), value: z.string().max(4000) })),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    for (const item of data.items) {
      const { error } = await db
        .from("site_texts")
        .update({ value: item.value })
        .eq("key", item.key);
      if (error) throw new Error(error.message);
    }
    await writeAudit({
      actor_id: context.userId,
      actor_role: "admin",
      action: "CONTENT_UPDATED",
      entity: "site_texts",
      entity_id: String(data.items.length),
      metadata: { keys: data.items.map((i) => i.key) },
    });
    return { ok: true };
  });

export const listContentRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ table: z.enum(CONTENT_TABLES) }).parse(d))
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin } = await import("./db.server");
    const db = await admin();
    const orderCol = data.table === "announcements" ? "created_at" : "sort_order";
    const { data: rows, error } = await db.from(data.table).select("*").order(orderCol);
    if (error) throw new Error(error.message);
    return JSON.parse(JSON.stringify(rows ?? [])) as Record<
      string,
      string | number | boolean | null
    >[];
  });

export const deleteRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();

    const { data: reg } = await db
      .from("registrations")
      .select("id, registration_code, team_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found.");

    const { data: pays } = await db
      .from("payments")
      .select("id, screenshot_path")
      .eq("registration_id", reg.id);
    const paths = (pays ?? []).map((p) => p.screenshot_path).filter(Boolean) as string[];
    if (paths.length) await db.storage.from("payment-proofs").remove(paths);

    await db.from("payment_verifications").delete().eq("registration_id", reg.id);
    await db.from("payments").delete().eq("registration_id", reg.id);
    await db.from("registration_status_history").delete().eq("registration_id", reg.id);
    const { error } = await db.from("registrations").delete().eq("id", reg.id);
    if (error) throw new Error(error.message);
    await db.from("team_members").delete().eq("team_id", reg.team_id);
    await db.from("teams").delete().eq("id", reg.team_id);

    await writeAudit({
      actor_id: context.userId,
      actor_role: "admin",
      action: "REGISTRATION_DELETED",
      entity: "registrations",
      entity_id: reg.id,
      metadata: { registration_code: reg.registration_code },
    });
    return { ok: true };
  });

/** Staff-only: full site content including hidden sections and unpublished pages, for live preview. */
export const getPreviewContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStaff } = await import("./staff.server");
    await requireStaff(context.supabase, context.userId);
    const { admin } = await import("./db.server");
    const db = await admin();

    const [
      settings,
      timeline,
      prizes,
      rules,
      faqs,
      sponsors,
      challenges,
      announcements,
      texts,
      sections,
      nav,
      pages,
    ] = await Promise.all([
      db.from("event_settings").select("*").limit(1).maybeSingle(),
      db.from("timeline_items").select("*").order("sort_order"),
      db.from("prizes").select("*").order("sort_order"),
      db.from("rules").select("*").order("sort_order"),
      db.from("faqs").select("*").order("sort_order"),
      db.from("sponsors").select("*").order("sort_order"),
      db.from("challenges").select("*").order("sort_order"),
      db.from("announcements").select("*").order("created_at", { ascending: false }).limit(5),
      db.from("site_texts").select("key,value"),
      db.from("page_sections").select("*").order("sort_order"),
      db.from("nav_items").select("*").order("sort_order"),
      db.from("custom_pages").select("*").order("sort_order"),
    ]);

    const textMap: Record<string, string> = {};
    for (const row of texts.data ?? []) textMap[row.key] = row.value;

    return {
      settings: settings.data,
      timeline: timeline.data ?? [],
      prizes: prizes.data ?? [],
      rules: rules.data ?? [],
      faqs: faqs.data ?? [],
      sponsors: sponsors.data ?? [],
      challenges: challenges.data ?? [],
      announcements: announcements.data ?? [],
      sections: sections.data ?? [],
      nav: nav.data ?? [],
      pages: pages.data ?? [],
      texts: textMap,
    };
  });
