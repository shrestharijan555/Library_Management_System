import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth PKCE Callback Route Handler.
 *
 * Handles the server-side code exchange for:
 * - Email confirmation (signup verification)
 * - Password recovery (magic link redirect)
 *
 * The `next` query parameter controls where the user is redirected after
 * successful code exchange. Defaults to `/dashboard`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    // Missing or invalid code — redirect to login with error indicator
    return NextResponse.redirect(
      new URL("/login?error=invalid_callback", origin)
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Code exchange failed (expired, already used, etc.)
      return NextResponse.redirect(
        new URL("/login?error=callback_failed", origin)
      );
    }

    // Successful code exchange — redirect to the intended destination.
    // Ensure we only redirect to safe internal relative paths to prevent open redirect attacks.
    const isSafeRedirect =
      next.startsWith("/") &&
      !next.startsWith("//") &&
      !next.startsWith("/\\");
    const redirectPath = isSafeRedirect ? next : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, origin));
  } catch {
    // Unexpected error — redirect to login safely without exposing internals
    return NextResponse.redirect(
      new URL("/login?error=callback_failed", origin)
    );
  }
}
