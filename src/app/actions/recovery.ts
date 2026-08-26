"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from "@/lib/auth/validation";

export interface RecoveryActionResult {
  error?: string;
  successMessage?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Server Action: Resend Email Verification.
 * Uses Supabase Auth to resend the signup confirmation email.
 * Always returns a generic success message to prevent email enumeration.
 */
export async function resendVerificationAction(
  prevState: RecoveryActionResult | null,
  formData: FormData
): Promise<RecoveryActionResult> {
  const rawEmail = formData.get("email")?.toString() ?? "";

  // Validate email format
  const validation = resendVerificationSchema.safeParse({ email: rawEmail });

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email } = validation.data;

  try {
    const supabase = await createClient();
    await supabase.auth.resend({ type: "signup", email });
  } catch {
    // Silently absorb errors to prevent email enumeration
  }

  // Always return a generic success message regardless of outcome
  return {
    successMessage:
      "If an account exists with that email address, a new verification email has been sent. Please check your inbox and spam folder.",
  };
}

/**
 * Server Action: Request Password Reset.
 * Uses Supabase Auth to send a password recovery email.
 * Always returns a generic success message to prevent email enumeration.
 */
export async function forgotPasswordAction(
  prevState: RecoveryActionResult | null,
  formData: FormData
): Promise<RecoveryActionResult> {
  const rawEmail = formData.get("email")?.toString() ?? "";

  // Validate email format
  const validation = forgotPasswordSchema.safeParse({ email: rawEmail });

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { email } = validation.data;

  try {
    const supabase = await createClient();

    // Construct the callback URL for the password recovery flow.
    // Supabase will redirect the user to this URL after clicking the reset link.
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl && process.env.NEXT_PUBLIC_VERCEL_URL) {
      siteUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    if (!siteUrl) {
      siteUrl = "http://localhost:3000";
    }
    siteUrl = siteUrl.replace(/\/$/, "");

    const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`;

    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  } catch {
    // Silently absorb errors to prevent email enumeration
  }

  // Always return a generic success message regardless of outcome
  return {
    successMessage:
      "If an account exists with that email address, a password reset link has been sent. Please check your inbox and spam folder.",
  };
}

/**
 * Server Action: Reset Password.
 * Updates the authenticated user's password using the normal Supabase client.
 * The user must have an active recovery session (from clicking the reset link).
 * Never uses the service-role key.
 */
export async function resetPasswordAction(
  prevState: RecoveryActionResult | null,
  formData: FormData
): Promise<RecoveryActionResult> {
  let shouldRedirectToLogin = false;

  const rawPassword = formData.get("password")?.toString() ?? "";
  const rawConfirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  // Validate password fields
  const validation = resetPasswordSchema.safeParse({
    password: rawPassword,
    confirmPassword: rawConfirmPassword,
  });

  if (!validation.success) {
    return {
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { password } = validation.data;

  const supabase = await createClient();

  // Verify the user has a valid recovery session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error:
        "Your password reset session has expired or is invalid. Please request a new reset link.",
    };
  }

  // Update the user's password using the authenticated Supabase client
  const { error: updateError } = await supabase.auth.updateUser({
    password,
  });

  if (updateError) {
    // Handle common error cases without exposing Supabase internals
    if (updateError.message?.toLowerCase().includes("same password")) {
      return {
        error: "New password must be different from your current password.",
      };
    }
    return {
      error:
        "Unable to update your password. Please request a new reset link and try again.",
    };
  }

  // Sign out so the user logs in fresh with the new password
  await supabase.auth.signOut();

  shouldRedirectToLogin = true;

  if (shouldRedirectToLogin) {
    redirect("/login?reset=success");
  }

  return {};
}
