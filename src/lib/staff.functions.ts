import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONTENT_TABLES } from "./schemas";
import * as SCHEMAS from "./schemas";

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
    const activeTeamIds = new Set(list.filter((r) => r.status !== "CANCELLED").map((r) => r.team_id));
    const { data: allMembers } = await db.from("team_members").select("team_id, food_pref");
    const foodMembers = (allMembers ?? []).filter((m) => activeTeamIds.has(m.team_id));
    const veg = foodMembers.filter((m) => (m.food_pref ?? "VEG") !== "NON_VEG").length;
    const nonVeg = foodMembers.length - veg;


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
      foodDist: [
        { name: "Veg", value: veg },
        { name: "Non-veg", value: nonVeg },
      ],
      veg,
      nonVeg,
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
    let receipt_url: string | null = null;
    const receiptPath = (verifications ?? []).find(
      (v) => (v as { receipt_path?: string | null }).receipt_path,
    ) as { receipt_path?: string | null } | undefined;
    if (receiptPath?.receipt_path) {
      const signed = await db.storage
        .from("payment-proofs")
        .createSignedUrl(receiptPath.receipt_path, 600);
      receipt_url = signed.data?.signedUrl ?? null;
    }
    const { data: attendance } = await db
      .from("attendance")
      .select("marked_at, marked_by_email")
      .eq("registration_id", reg.id)
      .maybeSingle();
    const { data: foodTokens } = await db
      .from("food_tokens")
      .select("member_id, released, released_at, redeemed_at, redeemed_by_email")
      .eq("registration_id", reg.id);

    return {
      registration: reg,
      team,
      attendance,
      foodTokens: foodTokens ?? [],
      members: members ?? [],
      payment,
      screenshot_url,
      receipt_url,
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
        receipt: z
          .object({ base64: z.string().min(1), type: z.string().min(1) })
          .nullable()
          .optional(),
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

    let receipt_path: string | null = null;
    if (approve) {
      if (!data.receipt?.base64)
        throw new Error("A payment-received proof image is required to approve.");
      const raw = data.receipt.base64.split(",").pop() ?? "";
      const bytes = Buffer.from(raw, "base64");
      if (bytes.length > 5 * 1024 * 1024) throw new Error("Proof must be under 5 MB.");
      if (!/^image\/(png|jpe?g|webp)$/.test(data.receipt.type))
        throw new Error("Proof must be a PNG, JPG or WEBP image.");
      const ext = data.receipt.type.split("/")[1]!.replace("jpeg", "jpg");
      const path = `${reg.registration_code}/receipt-${Date.now()}.${ext}`;
      const up = await db.storage
        .from("payment-proofs")
        .upload(path, bytes, { contentType: data.receipt.type, upsert: false });
      if (up.error) throw new Error("Proof upload failed. Try again.");
      receipt_path = path;
    }

    await db.from("payment_verifications").insert({
      payment_id: payment.id,
      registration_id: reg.id,
      decision: approve ? "APPROVED" : "REJECTED",
      reason: data.reason || null,
      notes: data.notes || null,
      receipt_path,
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

      // Provision the team-lead portal: one food token per participant (held
      // back until an admin releases them) and a login account for the leader.
      const { data: fullReg } = await db
        .from("registrations")
        .select("team_id")
        .eq("id", reg.id)
        .maybeSingle();
      if (fullReg) {
        const { data: team } = await db
          .from("teams")
          .select("id, leader_email, leader_name, lead_user_id")
          .eq("id", fullReg.team_id)
          .maybeSingle();
        const { data: members } = await db
          .from("team_members")
          .select("id")
          .eq("team_id", fullReg.team_id);
        for (const m of members ?? []) {
          await db
            .from("food_tokens")
            .upsert({ registration_id: reg.id, member_id: m.id }, { onConflict: "member_id" });
        }
        if (team && !team.lead_user_id) {
          try {
            const { getRequestHeader } = await import("@tanstack/react-start/server");
            const origin = getRequestHeader("origin") ?? "";
            const { ensureLeadAccount } = await import("./lead.server");
            const uid = await ensureLeadAccount(team.leader_email, team.leader_name, origin);
            if (uid) await db.from("teams").update({ lead_user_id: uid }).eq("id", team.id);
          } catch {
            /* never block verification on email/account provisioning */
          }
        }
      }

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

/**
 * Admins (and super admins) may edit team + member details while the payment is
 * not yet approved. Super admins keep full control even after approval.
 */
export const updateRegistrationTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const { clean, cleanEmail, cleanPhone, cleanRoll, DEPARTMENT_OPTIONS, FIELD_LIMITS, ROLL_RE, yearFromDepartment } =
      SCHEMAS;
    const dept = z
      .preprocess((v) => clean(v ?? ""), z.string().max(FIELD_LIMITS.department))
      .refine((v) => v === "" || DEPARTMENT_OPTIONS.includes(v as string), "Select a valid department");
    return z
      .object({
        id: z.string().uuid(),
        team_name: z.preprocess(clean, z.string().min(2).max(FIELD_LIMITS.team_name)),
        college: z.preprocess(clean, z.string().min(2).max(FIELD_LIMITS.college)),
        department: dept,
        members: z
          .array(
            z.object({
              id: z.string().uuid().nullable().optional(),
              full_name: z.preprocess(clean, z.string().min(2).max(FIELD_LIMITS.name)),
              email: z.preprocess(cleanEmail, z.string().email().max(FIELD_LIMITS.email)),
              phone: z
                .preprocess(cleanPhone, z.string())
                .refine((v) => /^\+91[6-9]\d{9}$/.test(v as string), "Enter a valid 10-digit mobile number"),
              student_id: z
                .preprocess(cleanRoll, z.string().length(10))
                .refine((v) => ROLL_RE.test(v as string), "Roll number must match 2_X0_A62__"),
              department: dept,
            }),
          )
          .min(1)
          .max(10),
      })
      .refine((v) => new Set(v.members.map((m) => m.email)).size === v.members.length, {
        message: "Each member must have a unique email address",
      })
      .refine((v) => new Set(v.members.map((m) => m.phone)).size === v.members.length, {
        message: "Each member must have a unique phone number",
      })
      .transform((v) => ({
        ...v,
        members: v.members.map((m) => ({ ...m, year: yearFromDepartment(m.department || v.department) })),
      }))
      .parse(d);
  })
  .handler(async ({ data, context }) => {
    const { getRoles } = await import("./staff.server");
    const roles = await getRoles(context.supabase, context.userId);
    const isSuper = roles.includes("super_admin");
    const isAdmin = isSuper || roles.includes("admin");
    if (!isAdmin) throw new Error("Unauthorized: admin access required.");

    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();

    const { data: reg } = await db
      .from("registrations")
      .select("id, registration_code, team_id, status, fee_at_registration")
      .eq("id", data.id)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found.");

    const locked = reg.status === "PAYMENT_APPROVED" || reg.status === "REGISTERED";
    if (locked && !isSuper)
      throw new Error("Payment already approved — only a super admin can edit this team.");

    const { data: settings } = await db
      .from("event_settings")
      .select("min_team_size, max_team_size")
      .limit(1)
      .maybeSingle();
    const min = settings?.min_team_size ?? 1;
    const max = settings?.max_team_size ?? 10;
    if (data.members.length < min || data.members.length > max)
      throw new Error(`Team size must be between ${min} and ${max} members.`);

    const leader = data.members[0]!;
    await db
      .from("teams")
      .update({
        team_name: data.team_name,
        college: data.college,
        department: data.department,
        year: SCHEMAS.yearFromDepartment(data.department),
        leader_name: leader.full_name,
        leader_email: leader.email,
        leader_phone: leader.phone,
        team_size: data.members.length,
      })
      .eq("id", reg.team_id);

    const { data: existing } = await db.from("team_members").select("id").eq("team_id", reg.team_id);
    const keep = new Set(data.members.map((m) => m.id).filter(Boolean) as string[]);
    const removals = (existing ?? []).filter((e) => !keep.has(e.id)).map((e) => e.id);
    if (removals.length) await db.from("team_members").delete().in("id", removals);

    for (const [i, m] of data.members.entries()) {
      const row = {
        team_id: reg.team_id,
        member_index: i + 1,
        full_name: m.full_name,
        email: m.email,
        phone: m.phone,
        student_id: m.student_id,
        department: m.department || data.department,
        year: m.year,
        is_leader: i === 0,
      };
      if (m.id) await db.from("team_members").update(row).eq("id", m.id);
      else await db.from("team_members").insert(row);
    }

    await db
      .from("registrations")
      .update({
        team_size: data.members.length,
        expected_amount: data.members.length * (reg.fee_at_registration ?? 0),
      })
      .eq("id", reg.id);

    await writeAudit({
      actor_id: context.userId,
      actor_role: isSuper ? "super_admin" : "admin",
      action: "REGISTRATION_EDITED",
      entity: "registrations",
      entity_id: reg.id,
      metadata: { registration_code: reg.registration_code, team_size: data.members.length, locked },
    });
    return { ok: true };
  });

/**
 * Releases food tokens to participants. Admin/super-admin only, and only for
 * confirmed teams — tokens stay hidden in the lead portal until this runs.
 */
export const releaseFoodTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        registration_id: z.string().uuid().nullable().optional(),
        all: z.boolean().optional().default(false),
        release: z.boolean().optional().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    const role = await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();

    let ids: string[] = [];
    if (data.all) {
      const { data: regs } = await db
        .from("registrations")
        .select("id")
        .in("status", ["REGISTERED", "PAYMENT_APPROVED"]);
      ids = (regs ?? []).map((r) => r.id);
    } else if (data.registration_id) {
      const { data: reg } = await db
        .from("registrations")
        .select("id, status")
        .eq("id", data.registration_id)
        .maybeSingle();
      if (!reg) throw new Error("Registration not found.");
      if (!["REGISTERED", "PAYMENT_APPROVED"].includes(reg.status))
        throw new Error("Only confirmed teams can receive food tokens.");
      ids = [reg.id];
    } else {
      throw new Error("Nothing selected.");
    }

    // Make sure a token row exists for every participant before releasing.
    for (const id of ids) {
      const { data: reg } = await db
        .from("registrations")
        .select("team_id")
        .eq("id", id)
        .maybeSingle();
      if (!reg) continue;
      const { data: members } = await db.from("team_members").select("id").eq("team_id", reg.team_id);
      for (const m of members ?? []) {
        await db
          .from("food_tokens")
          .upsert({ registration_id: id, member_id: m.id }, { onConflict: "member_id" });
      }
    }

    const { data: touched } = await db
      .from("food_tokens")
      .update({ released: data.release, released_at: data.release ? new Date().toISOString() : null })
      .in("registration_id", ids)
      .is("redeemed_at", null)
      .select("id");

    await writeAudit({
      actor_id: context.userId,
      actor_role: role,
      action: data.release ? "FOOD_TOKENS_RELEASED" : "FOOD_TOKENS_WITHDRAWN",
      entity: "registrations",
      ...(ids.length === 1 ? { entity_id: ids[0]! } : {}),
      metadata: { teams: ids.length, tokens: touched?.length ?? 0 },
    });
    return { ok: true, teams: ids.length, tokens: touched?.length ?? 0 };
  });

/** Resends the portal password email to a team lead (admin only). */
export const resendLeadInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ registration_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { requireRole } = await import("./staff.server");
    const role = await requireRole(context.supabase, context.userId, ["admin"]);
    const { admin, writeAudit } = await import("./db.server");
    const db = await admin();
    const { data: reg } = await db
      .from("registrations")
      .select("team_id, status")
      .eq("id", data.registration_id)
      .maybeSingle();
    if (!reg) throw new Error("Registration not found.");
    if (!["REGISTERED", "PAYMENT_APPROVED"].includes(reg.status))
      throw new Error("Only confirmed teams have portal access.");
    const { data: team } = await db
      .from("teams")
      .select("id, leader_email, leader_name, lead_user_id")
      .eq("id", reg.team_id)
      .maybeSingle();
    if (!team) throw new Error("Team not found.");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const origin = getRequestHeader("origin") ?? "";
    const { ensureLeadAccount, sendLeadPasswordEmail } = await import("./lead.server");
    if (team.lead_user_id) await sendLeadPasswordEmail(team.leader_email, origin);
    else {
      const uid = await ensureLeadAccount(team.leader_email, team.leader_name, origin);
      if (uid) await db.from("teams").update({ lead_user_id: uid }).eq("id", team.id);
    }
    await writeAudit({
      actor_id: context.userId,
      actor_role: role,
      action: "LEAD_INVITE_SENT",
      entity: "teams",
      entity_id: team.id,
      metadata: { email: team.leader_email },
    });
    return { ok: true };
  });
