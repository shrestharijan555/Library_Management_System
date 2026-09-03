"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { loginSchema } from "@/lib/auth/validation";
import { DEMO_ACCOUNTS } from "@/config/demo-accounts";

export interface AuthActionResult {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  emailUnverified?: boolean;
}

/**
 * Server Action for User Login.
 * Authenticates with Supabase Auth, resolves application user profile, and enforces account status checks.
 */
export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawEmail = formData.get("email")?.toString() ?? "";
  const rawPassword = formData.get("password")?.toString() ?? "";

  // Validate form fields using loginSchema
  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validation.data;
  const supabase = await createClient();

  // Attempt Supabase authentication
  let { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  // If sign in fails and this is a recognized demo account, attempt auto-provisioning
  if (authError || !authData.user) {
    const isDemo = DEMO_ACCOUNTS.some(
      (acc) =>
        acc.email.toLowerCase() === email.toLowerCase() &&
        acc.password === password
    );

    if (isDemo) {
      try {
        const { seedDemoAccountsAction } = await import("@/app/actions/seed");
        await seedDemoAccountsAction();
        // Retry sign in
        const retryResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        authData = retryResult.data;
        authError = retryResult.error;
      } catch (seedErr) {
        console.error("Auto-provision demo error:", seedErr);
      }
    }
  }

  if (authError || !authData.user) {
    // Detect email-not-confirmed error from Supabase
    const errorMsg = authError?.message?.toLowerCase() ?? "";
    if (
      errorMsg.includes("email not confirmed") ||
      errorMsg.includes("email_not_confirmed")
    ) {
      return {
        error:
          "Your email address has not been verified. Please check your inbox for a verification link, or request a new one.",
        emailUnverified: true,
      };
    }

    return {
      error: "Invalid email or password. Please check your credentials.",
    };
  }

  // Resolve application user profile from PostgreSQL
  try {
    let appUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, authData.user.id),
    });

    // Fallback: If not matched by supabaseAuthId, match by email and link IDs
    if (!appUser) {
      const emailUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });
      if (emailUser) {
        await db
          .update(users)
          .set({ supabaseAuthId: authData.user.id, updatedAt: new Date() })
          .where(eq(users.id, emailUser.id));
        appUser = emailUser;
      }
    }

    if (!appUser) {
      // Supabase user exists but application profile is missing in PostgreSQL
      await supabase.auth.signOut();
      return {
        error: "Application profile not found. Please contact the administrator.",
      };
    }

    // Account status enforcement: Reject suspended or inactive accounts
    if (appUser.status !== "active") {
      await supabase.auth.signOut();
      return {
        error: `Your account is currently ${appUser.status}. Access denied.`,
      };
    }
  } catch (err) {
    console.error("Error resolving application user during login:", err);
    await supabase.auth.signOut();
    return {
      error: "An unexpected system error occurred. Please try again.",
    };
  }

  redirect("/dashboard");
}

/**
 * Server Action for User Logout.
 * Invalidates the Supabase session and redirects to the login page.
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
