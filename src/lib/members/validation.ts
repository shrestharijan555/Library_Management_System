import { z } from "zod";

export const createMemberSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(255, "Full name is too long"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  memberCode: z
    .string()
    .min(3, "Member code must be at least 3 characters")
    .max(50, "Member code is too long")
    .regex(/^[A-Za-z0-9\-_.]+$/, "Member code contains invalid characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["student", "staff", "librarian", "admin"]).default("student"),
  status: z.enum(["active", "suspended", "inactive"]).default("active"),
  phone: z
    .string()
    .max(50, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .max(100, "Department name is too long")
    .optional()
    .or(z.literal("")),
  gradeClass: z
    .string()
    .max(50, "Grade/Class is too long")
    .optional()
    .or(z.literal("")),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(255, "Full name is too long"),
  role: z.enum(["student", "staff", "librarian", "admin"]),
  phone: z
    .string()
    .max(50, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .max(100, "Department name is too long")
    .optional()
    .or(z.literal("")),
  gradeClass: z
    .string()
    .max(50, "Grade/Class is too long")
    .optional()
    .or(z.literal("")),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const updateMemberStatusSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
  status: z.enum(["active", "suspended", "inactive"]),
  reason: z
    .string()
    .max(255, "Reason is too long")
    .optional()
    .or(z.literal("")),
});

export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;

export const deleteMemberSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
});

export type DeleteMemberInput = z.infer<typeof deleteMemberSchema>;

export const membersQuerySchema = z.object({
  query: z.string().optional(),
  role: z.enum(["all", "student", "staff", "librarian", "admin"]).default("all"),
  status: z.enum(["all", "active", "suspended", "inactive"]).default("all"),
  standing: z.enum(["all", "active_borrowers", "with_overdue", "with_fines"]).default("all"),
  sort: z
    .enum(["newest", "oldest", "name_asc", "name_desc", "code_asc", "loans_desc"])
    .default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(15),
});

export type MembersQueryParams = z.infer<typeof membersQuerySchema>;
