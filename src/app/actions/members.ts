"use server";

import { revalidatePath } from "next/cache";
import { eq, or, and } from "drizzle-orm";
import { db } from "@/db";
import { users, loans, fines } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createMemberSchema,
  updateMemberSchema,
  updateMemberStatusSchema,
  deleteMemberSchema,
} from "@/lib/members/validation";
import type { UserRole, UserStatus } from "@/types";

export interface MemberActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
  memberId?: string;
}

/**
 * Generates a collision-resistant unique member code based on role.
 */
async function generateUniqueMemberCode(role: UserRole): Promise<string> {
  const prefix = role === "staff" ? "STF" : role === "librarian" ? "LIB" : role === "admin" ? "ADM" : "STU";
  for (let attempt = 0; attempt < 5; attempt++) {
    const timestampSuffix = Date.now().toString(36).toUpperCase().slice(-4);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidateCode = `${prefix}-${timestampSuffix}${randomSuffix}`;

    const existing = await db.query.users.findFirst({
      where: eq(users.memberCode, candidateCode),
    });

    if (!existing) {
      return candidateCode;
    }
  }
  return `${prefix}-${Date.now()}`;
}

/**
 * Server Action: Create a new library member profile.
 * Enforces `members:create` permission.
 */
export async function createMemberAction(
  _prevState: MemberActionResult | null,
  formData: FormData
): Promise<MemberActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.CREATE_MEMBER)) {
    return { error: "Unauthorized. You do not have permission to register new members." };
  }

  const rawData = {
    fullName: formData.get("fullName")?.toString().trim() ?? "",
    email: formData.get("email")?.toString().trim().toLowerCase() ?? "",
    memberCode: formData.get("memberCode")?.toString().trim().toUpperCase() ?? "",
    role: (formData.get("role")?.toString().trim() || "student") as UserRole,
    status: (formData.get("status")?.toString().trim() || "active") as UserStatus,
    phone: formData.get("phone")?.toString().trim() ?? "",
    department: formData.get("department")?.toString().trim() ?? "",
    gradeClass: formData.get("gradeClass")?.toString().trim() ?? "",
  };

  const validation = createMemberSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  // Determine final member code
  let finalMemberCode: string;
  if (data.memberCode && data.memberCode.trim().length > 0) {
    finalMemberCode = data.memberCode.trim();
  } else {
    finalMemberCode = await generateUniqueMemberCode(data.role as UserRole);
  }

  // 1. Pre-check for duplicate email or memberCode
  try {
    const existing = await db.query.users.findFirst({
      where: or(eq(users.email, data.email), eq(users.memberCode, finalMemberCode)),
    });

    if (existing) {
      if (existing.email.toLowerCase() === data.email.toLowerCase()) {
        return {
          fieldErrors: { email: ["A member with this email address already exists."] },
        };
      }
      if (existing.memberCode === finalMemberCode) {
        return {
          fieldErrors: { memberCode: ["This Member Code is already assigned to another user."] },
        };
      }
    }
  } catch (err) {
    console.error("Database pre-check error:", err);
    return { error: "An unexpected database error occurred during validation." };
  }

  // 2. Provision Supabase Auth user if Admin client is available
  let supabaseAuthId: string | null = null;
  const adminSupabase = createAdminClient();

  if (adminSupabase) {
    try {
      const tempPassword = `LibPass${Math.random().toString(36).slice(-6)}!9`;
      const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName,
          role: data.role,
        },
      });

      if (!authErr && authData?.user) {
        supabaseAuthId = authData.user.id;
      }
    } catch (authErr) {
      console.warn("Supabase Auth admin provisioning skipped or not configured:", authErr);
    }
  }

  let createdId: string;

  // 3. Insert into PostgreSQL public.users
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        supabaseAuthId: supabaseAuthId,
        memberCode: finalMemberCode,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        role: data.role as UserRole,
        status: data.status as UserStatus,
        department: data.department || null,
        gradeClass: data.gradeClass || null,
      })
      .returning();

    createdId = newUser.id;
  } catch (err) {
    console.error("Error creating member record:", err);
    return {
      error: "An error occurred while creating the member profile. Please try again.",
    };
  }

  revalidatePath("/members");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Member profile for "${data.fullName}" (${finalMemberCode}) created successfully.`,
    memberId: createdId,
  };
}

/**
 * Server Action: Update existing member details.
 * Enforces `members:update` permission.
 */
export async function updateMemberAction(
  memberId: string,
  _prevState: MemberActionResult | null,
  formData: FormData
): Promise<MemberActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.UPDATE_MEMBER)) {
    return { error: "Unauthorized. You do not have permission to edit members." };
  }

  const rawData = {
    memberId,
    fullName: formData.get("fullName")?.toString().trim() ?? "",
    role: (formData.get("role")?.toString().trim() || "student") as UserRole,
    phone: formData.get("phone")?.toString().trim() ?? "",
    department: formData.get("department")?.toString().trim() ?? "",
    gradeClass: formData.get("gradeClass")?.toString().trim() ?? "",
  };

  const validation = updateMemberSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  // Verify member exists
  const existing = await db.query.users.findFirst({
    where: eq(users.id, memberId),
  });

  if (!existing) {
    return { error: "Member record was not found." };
  }

  // Prevent role demotion of oneself
  if (session.appUser.id === memberId && data.role !== existing.role) {
    return {
      error: "For security, you cannot alter your own administrative role level.",
    };
  }

  try {
    await db
      .update(users)
      .set({
        fullName: data.fullName,
        role: data.role as UserRole,
        phone: data.phone || null,
        department: data.department || null,
        gradeClass: data.gradeClass || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, memberId));
  } catch (err) {
    console.error("Error updating member profile:", err);
    return { error: "Failed to update member profile." };
  }

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Member profile updated successfully.",
  };
}

/**
 * Server Action: Update account status (active, suspended, inactive).
 * Enforces `members:update` permission and prevents self-suspension.
 */
export async function updateMemberStatusAction(
  memberId: string,
  status: UserStatus,
  reason?: string
): Promise<MemberActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.UPDATE_MEMBER)) {
    return { error: "Unauthorized. You do not have permission to change account status." };
  }

  const validation = updateMemberStatusSchema.safeParse({
    memberId,
    status,
    reason,
  });

  if (!validation.success) {
    return { error: "Invalid status change payload." };
  }

  // Self-suspension safeguard
  if (session.appUser.id === memberId && status !== "active") {
    return {
      error: "You cannot suspend or deactivate your own active administrator account.",
    };
  }

  try {
    await db
      .update(users)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, memberId));
  } catch (err) {
    console.error("Error updating member status:", err);
    return { error: "Failed to update account status." };
  }

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Account status updated to ${status}.`,
  };
}

/**
 * Server Action: Delete a member profile safely.
 * Enforces `members:delete` permission, checks for active loans and unpaid fines.
 */
export async function deleteMemberAction(memberId: string): Promise<MemberActionResult> {
  const session = await requireAuthUser();

  if (!hasPermission(session.appUser.role, PERMISSIONS.DELETE_MEMBER)) {
    return { error: "Unauthorized. You do not have permission to delete member records." };
  }

  const validation = deleteMemberSchema.safeParse({ memberId });
  if (!validation.success) {
    return { error: "Invalid member deletion request." };
  }

  // Self-deletion safeguard
  if (session.appUser.id === memberId) {
    return { error: "You cannot delete your own active account." };
  }

  // 1. Check for active loans
  const activeLoan = await db.query.loans.findFirst({
    where: and(eq(loans.userId, memberId), eq(loans.status, "active")),
  });

  if (activeLoan) {
    return {
      error:
        "Cannot delete this member because they currently have active book loans checked out. Please return all borrowed items first.",
    };
  }

  // 2. Check for unpaid fines
  const unpaidFine = await db.query.fines.findFirst({
    where: and(eq(fines.userId, memberId), eq(fines.status, "unpaid")),
  });

  if (unpaidFine) {
    return {
      error:
        "Cannot delete this member because they have outstanding unpaid fines. Please collect or waive all fines first.",
    };
  }

  // 3. Check for historical circulation loans or reservations
  const historicalLoan = await db.query.loans.findFirst({
    where: eq(loans.userId, memberId),
  });

  if (historicalLoan) {
    return {
      error:
        "Cannot permanently delete this member because historical circulation records reference them. To revoke access while preserving institutional audit logs, please change their status to 'Inactive' or 'Suspended' instead.",
    };
  }

  // 4. Delete user record from database
  try {
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, memberId),
    });

    await db.delete(users).where(eq(users.id, memberId));

    // Optional: cleanup Supabase Auth user if linked
    if (userToDelete?.supabaseAuthId) {
      try {
        const adminSupabase = createAdminClient();
        if (adminSupabase) {
          await adminSupabase.auth.admin.deleteUser(userToDelete.supabaseAuthId);
        }
      } catch (authCleanupErr) {
        console.warn("Failed to delete linked Supabase auth user:", authCleanupErr);
      }
    }
  } catch (err) {
    console.error("Error deleting member record:", err);
    return {
      error: "An unexpected error occurred while deleting the member record.",
    };
  }

  revalidatePath("/members");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Member record has been permanently removed.",
  };
}
