import { z } from "zod";

export const memberSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(7).max(20),
  student_id: z.string().trim().max(60).optional().default(""),
  department: z.string().trim().max(80).optional().default(""),
  year: z.string().trim().max(20).optional().default(""),
});

export const registrationSchema = z.object({
  team_name: z.string().trim().min(2).max(60),
  leader_name: z.string().trim().min(2).max(80),
  leader_email: z.string().trim().email().max(120),
  leader_phone: z.string().trim().min(7).max(20),
  college: z.string().trim().min(2).max(120),
  department: z.string().trim().min(1).max(80),
  year: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(80),
  team_size: z.number().int().min(1).max(10),
  members: z.array(memberSchema).min(1).max(10),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type MemberInput = z.infer<typeof memberSchema>;

export const paymentSchema = z.object({
  registration_id: z.string().uuid(),
  utr_number: z
    .string()
    .trim()
    .min(6, "UTR looks too short")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "UTR can only contain letters, numbers and dashes"),
  paid_on: z.string().trim().min(4).max(20),
  paid_time: z.string().trim().min(3).max(20),
  screenshot: z
    .object({ name: z.string().max(140), type: z.string().max(60), base64: z.string() })
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
