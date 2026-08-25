"use server";

import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { registerSchema } from "@/lib/auth/validation";

export interface RegisterActionResult {
  error?: string;
  successMessage?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Generates a collision-resistant member code for student registration.
 */
async function generateUniqueMemberCode(): Promise<string> {
  const prefix = "STU";
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
  return `STU-${Date.now()}`;
}

/**
 * Server Action for User Registration.
 * Validates input, checks for duplicate email/memberCode, registers with Supabase Auth,
 * creates the server-authoritative application user profile in PostgreSQL,
 * and rolls back orphaned Supabase Auth users if database insertion fails.
 */
export async function registerAction(
  prevState: RegisterActionResult | null,
  formData: FormData
): Promise<RegisterActionResult> {
  let shouldRedirectToDashboard = false;

  const rawFullName = formData.get("fullName")?.toString() ?? "";
  const rawEmail = formData.get("email")?.toString() ?? "";
  const rawPassword = formData.get("password")?.toString() ?? "";
  const rawConfirmPassword = formData.get("confirmPassword")?.toString() ?? "";
  const rawMemberCode = formData.get("memberCode")?.toString() ?? "";

  // 1. Validate input fields using registerSchema
  const validation = registerSchema.safeParse({
    fullName: rawFullName,
    email: rawEmail,
    password: rawPassword,
    confirmPassword: rawConfirmPassword,
    memberCode: rawMemberCode,
  });

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, password, memberCode: userMemberCode } = validation.data;

  // Determine member code (user-supplied or collision-resistant auto-generated)
  let finalMemberCode: string;
  if (userMemberCode && userMemberCode.trim().length > 0) {
    finalMemberCode = userMemberCode.trim();
  } else {
    finalMemberCode = await generateUniqueMemberCode();
  }

  // 2. Pre-check for existing email or member code in PostgreSQL
  try {
    const existingUser = await db.query.users.findFirst({
      where: or(eq(users.email, email), eq(users.memberCode, finalMemberCode)),
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return {
          fieldErrors: { email: ["An account with this email address already exists."] },
        };
      }
      if (existingUser.memberCode === finalMemberCode) {
        return {
          fieldErrors: { memberCode: ["This Member Code / Student ID is already registered."] },
        };
      }
    }
  } catch (dbErr) {
    console.error("Database pre-check error:", dbErr);
    return {
      error: "An unexpected system error occurred. Please try again.",
    };
  }

  // 3. Register user with Supabase Auth
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError || !authData.user) {
    return {
      error: authError?.message || "Registration failed. Please check your details and try again.",
    };
  }

  // Handle case where user identity already exists in Supabase
  if (authData.user.identities && authData.user.identities.length === 0) {
    return {
      fieldErrors: { email: ["An account with this email address is already registered."] },
    };
  }

  // 4. Create application user profile in PostgreSQL (Server-authoritative)
  try {
    await db.insert(users).values({
      supabaseAuthId: authData.user.id,
      memberCode: finalMemberCode,
      fullName: fullName,
      email: email,
      role: "student",
      status: "active",
    });
  } catch (profileErr) {
    console.error("PostgreSQL profile creation failed:", profileErr);

    // Rollback: Attempt targeted deletion of ONLY the exact Supabase Auth user created in this request
    try {
      const adminSupabase = createAdminClient();
      if (adminSupabase) {
        const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
          authData.user.id
        );
        if (deleteError) {
          console.error(
            `Failed to delete orphaned Supabase Auth user (${authData.user.id}):`,
            deleteError.message
          );
        }
      }
    } catch (cleanupErr) {
      console.error("Error during orphaned Supabase Auth user cleanup:", cleanupErr);
    }

    // Sign out any transient session to clear cookies
    await supabase.auth.signOut();

    return {
      error: "Failed to create application profile. Registration aborted. Please try again.",
    };
  }

  // 5. Session & Email Confirmation Handling
  if (authData.session) {
    // Immediate active session (email confirmation disabled)
    shouldRedirectToDashboard = true;
  } else {
    // Email confirmation required by Supabase settings
    return {
      successMessage:
        "Registration successful! Please check your email inbox to confirm your account before signing in.",
    };
  }

  if (shouldRedirectToDashboard) {
    redirect("/dashboard");
  }

  return {};
}
