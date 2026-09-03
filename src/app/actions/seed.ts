// src/app/actions/seed.ts
"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ACCOUNTS, type DemoAccount } from "@/config/demo-accounts";

export interface SeedResult {
  success?: boolean;
  message?: string;
  error?: string;
  accounts?: DemoAccount[];
}

/**
 * Server Action: Provisions all 4 role demo accounts into Supabase Auth and PostgreSQL.
 */
export async function seedDemoAccountsAction(): Promise<SeedResult> {
  const adminClient = createAdminClient();
  const regularClient = await createClient();

  let createdCount = 0;

  for (const account of DEMO_ACCOUNTS) {
    let authUserId: string | null = null;

    if (adminClient) {
      // Use Admin API to create confirmed user directly without email verification requirement
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });

      if (authData?.user) {
        authUserId = authData.user.id;
      } else if (authError) {
        // Find existing user if already created
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email?.toLowerCase() === account.email.toLowerCase());
        if (existing) {
          authUserId = existing.id;
          // Ensure password and confirmation are updated
          await adminClient.auth.admin.updateUserById(existing.id, {
            password: account.password,
            email_confirm: true,
          });
        }
      }
    } else {
      // Regular client fallback signup
      const { data: authData } = await regularClient.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: account.fullName } },
      });
      if (authData?.user) {
        authUserId = authData.user.id;
      }
    }

    if (!authUserId) continue;

    // Insert or update application user profile in PostgreSQL
    const existingDbUser = await db.query.users.findFirst({
      where: eq(users.email, account.email),
    });

    if (!existingDbUser) {
      await db.insert(users).values({
        supabaseAuthId: authUserId,
        email: account.email,
        fullName: account.fullName,
        memberCode: account.memberCode,
        role: account.role,
        status: "active",
        department: "department" in account ? account.department : null,
        gradeLevel: "gradeLevel" in account ? account.gradeLevel : null,
      });
      createdCount++;
    } else {
      // Sync supabase auth id and role if needed
      await db
        .update(users)
        .set({
          supabaseAuthId: authUserId,
          role: account.role,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingDbUser.id));
      createdCount++;
    }
  }

  return {
    success: true,
    message: `Successfully provisioned / synchronized ${createdCount} demo accounts!`,
    accounts: DEMO_ACCOUNTS,
  };
}
