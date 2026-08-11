import { z } from "zod";

/* ---------- sanitisation helpers (shared by client + server) ---------- */

// Strip control chars, zero-width/bidi tricks, collapse whitespace.
export const clean = (v: unknown): string =>
  typeof v === "string"
    ? v
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : (v as string);

export const cleanEmail = (v: unknown): string =>
  typeof v === "string" ? clean(v).toLowerCase().replace(/\s/g, "") : (v as string);

export const cleanPhone = (v: unknown): string => {
  if (typeof v !== "string") return v as string;
  let s = clean(v).replace(/[^\d+]/g, "");
  s = s.replace(/(?!^)\+/g, "");
  let digits = s.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  return "+91" + digits.slice(0, 10);
};

/** Local 10-digit part of a stored +91 number (for form inputs). */
export const localPhone = (v: string) => cleanPhone(v).replace(/^\+91/, "");

export const FIELD_LIMITS = {
  team_name: 60,
  name: 80,
  email: 120,
  phone: 13,
  college: 120,
  department: 80,
  year: 20,
  student_id: 60,
  utr: 40,
} as const;

/** Fixed academic options: branch + year + section, e.g. "CSE-CS II-A". */
export const BRANCH_OPTIONS = [
  "CSE",
  "CSE-CS",
  "CSE-AIML",
  "CSE-DS",
  "CSE-IOT",
  "IT",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
] as const;
export const YEAR_OPTIONS = ["II", "III", "IV"] as const;
export const SECTION_OPTIONS = ["A", "B"] as const;
export const DEPARTMENT_OPTIONS = BRANCH_OPTIONS.flatMap((b) =>
  YEAR_OPTIONS.flatMap((y) => SECTION_OPTIONS.map((s) => `${b} ${y}-${s}`)),
);

/** Extracts the year token ("II" | "III" | "IV") from a department option. */
export const yearFromDepartment = (dept: string) =>
  (dept.match(/\s(II|III|IV)-[AB]$/)?.[1] ?? "") as string;

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u;
const TEXT_RE = /^[\p{L}\p{M}\p{N}\s.,'&()\/+-]+$/u;
const PHONE_RE = /^\+91[6-9]\d{9}$/;


const str = (min: number, max: number, re: RegExp, msg: string) =>
  z
    .preprocess(clean, z.string().min(min, `Must be at least ${min} characters`).max(max))
    .refine((v) => re.test(v as string), { message: msg }) as unknown as z.ZodType<string>;

const optStr = (max: number) =>
  z.preprocess(
    (v) => clean(v ?? ""),
    z.string().max(max).refine((v) => v === "" || TEXT_RE.test(v), {
      message: "Contains invalid characters",
    }),
  ) as unknown as z.ZodType<string>;

const emailField = z.preprocess(
  cleanEmail,
  z.string().email("Enter a valid email address").max(FIELD_LIMITS.email),
) as unknown as z.ZodType<string>;

const phoneField = z
  .preprocess(cleanPhone, z.string().max(FIELD_LIMITS.phone))
  .refine((v) => PHONE_RE.test(v as string), {
    message: "Enter a valid 10-digit Indian mobile number",
  }) as unknown as z.ZodType<string>;

const yearField = z
  .preprocess((v) => clean(v ?? ""), z.string().max(FIELD_LIMITS.year))
  .refine((v) => v === "" || (YEAR_OPTIONS as readonly string[]).includes(v as string), {
    message: "Invalid year",
  }) as unknown as z.ZodType<string>;

export const memberSchema = z.object({
  full_name: str(2, FIELD_LIMITS.name, NAME_RE, "Name contains invalid characters"),
  email: emailField,
  phone: phoneField,
  student_id: optStr(FIELD_LIMITS.student_id),
  department: z
    .preprocess((v) => clean(v ?? ""), z.string().max(FIELD_LIMITS.department))
    .refine((v) => v === "" || DEPARTMENT_OPTIONS.includes(v as string), {
      message: "Select a valid department",
    }) as unknown as z.ZodType<string>,
  year: yearField,
});

export const registrationSchema = z
  .object({
    team_name: str(2, FIELD_LIMITS.team_name, TEXT_RE, "Team name contains invalid characters"),
    leader_name: str(2, FIELD_LIMITS.name, NAME_RE, "Name contains invalid characters"),
    leader_email: emailField,
    leader_phone: phoneField,
    college: str(2, FIELD_LIMITS.college, TEXT_RE, "College contains invalid characters"),
    department: z
      .preprocess(clean, z.string().max(FIELD_LIMITS.department))
      .refine((v) => DEPARTMENT_OPTIONS.includes(v as string), {
        message: "Select a valid department",
      }) as unknown as z.ZodType<string>,
    year: yearField,


    team_size: z.number().int().min(1).max(10),
    members: z.array(memberSchema).min(1).max(10),
  })
  .refine((d) => d.members.length === d.team_size, {
    message: "Member details do not match the selected team size",
    path: ["members"],
  })
  .refine((d) => new Set(d.members.map((m) => m.email)).size === d.members.length, {
    message: "Each member must have a unique email address",
    path: ["members"],
  })
  .refine((d) => new Set(d.members.map((m) => m.phone)).size === d.members.length, {
    message: "Each member must have a unique phone number",
    path: ["members"],
  })
  .refine((d) => d.members[0]?.email === d.leader_email, {
    message: "The first member must be the team leader",
    path: ["members"],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type MemberInput = z.infer<typeof memberSchema>;

export const paymentSchema = z.object({
  registration_id: z.string().uuid(),
  utr_number: z
    .preprocess(
      (v) => (typeof v === "string" ? clean(v).toUpperCase().replace(/[^A-Z0-9-]/g, "") : v),
      z.string().min(6, "UTR looks too short").max(FIELD_LIMITS.utr),
    ) as unknown as z.ZodType<string>,
  paid_on: z.preprocess(clean, z.string().min(4).max(20)) as unknown as z.ZodType<string>,
  paid_time: z.preprocess(clean, z.string().min(3).max(20)) as unknown as z.ZodType<string>,
  screenshot: z
    .object({ name: z.string().max(140), type: z.string().max(60), base64: z.string().max(9_000_000) })
    .nullable()
    .optional(),
});


export const CONTENT_TABLES = [
  "timeline_items",
  "prizes",
  "rules",
  "faqs",
  "sponsors",
  "challenges",
  "announcements",
  "page_sections",
  "nav_items",
  "custom_pages",
] as const;
