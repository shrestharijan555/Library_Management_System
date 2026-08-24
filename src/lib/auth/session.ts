import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { User as AppUser } from "@/types";

export interface AppUserSession {
  authUser: SupabaseAuthUser;
  appUser: AppUser;
}

/**
 * Retrieves the current authenticated Supabase Auth user securely.
 */
export async function getAuthUser(): Promise<SupabaseAuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Resolves the authenticated Supabase user to the corresponding application user in PostgreSQL.
 * Enforces account status checks: rejects suspended and inactive users.
 */
export async function getAppUser(): Promise<AppUserSession | null> {
  const authUser = await getAuthUser();
  if (!authUser) {
    return null;
  }

  try {
    const appUser = await db.query.users.findFirst({
      where: eq(users.supabaseAuthId, authUser.id),
    });

    if (!appUser) {
      return null;
    }

    // Account status enforcement: Reject suspended or inactive accounts
    if (appUser.status !== "active") {
      return null;
    }

    return {
      authUser,
      appUser,
    };
  } catch {
    return null;
  }
}

/**
 * Enforces authenticated application access on server routes/actions.
 * Redirects unauthenticated or suspended/inactive users to the login page.
 */
export async function requireAuthUser(redirectTo = "/login"): Promise<AppUserSession> {
  const session = await getAppUser();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}
