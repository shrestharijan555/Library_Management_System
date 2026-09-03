// src/app/actions/settings.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { systemSettings, auditLogs } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { DEFAULT_LIBRARY_POLICIES } from "@/config/site";

export interface SettingsActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

// Update Policy Configuration Action
export async function updatePoliciesAction(
  _prevState: unknown,
  formData: FormData
): Promise<SettingsActionResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.MANAGE_SETTINGS)) {
    return { error: "Unauthorized. Admin privileges required to update settings." };
  }

  try {
    const studentLoans = parseInt(formData.get("student_maxActiveLoans")?.toString() || "3", 10);
    const studentDuration = parseInt(formData.get("student_loanDurationDays")?.toString() || "14", 10);
    const studentRenewals = parseInt(formData.get("student_maxRenewals")?.toString() || "2", 10);
    const studentFine = Math.round(parseFloat(formData.get("student_finePerDay")?.toString() || "0.50") * 100);
    const studentGrace = parseInt(formData.get("student_gracePeriodDays")?.toString() || "1", 10);

    const staffLoans = parseInt(formData.get("staff_maxActiveLoans")?.toString() || "10", 10);
    const staffDuration = parseInt(formData.get("staff_loanDurationDays")?.toString() || "30", 10);
    const staffRenewals = parseInt(formData.get("staff_maxRenewals")?.toString() || "3", 10);
    const staffFine = Math.round(parseFloat(formData.get("staff_finePerDay")?.toString() || "0.25") * 100);
    const staffGrace = parseInt(formData.get("staff_gracePeriodDays")?.toString() || "3", 10);

    const updatedPolicies = {
      student: {
        maxActiveLoans: studentLoans,
        loanDurationDays: studentDuration,
        maxRenewals: studentRenewals,
        finePerDayCents: studentFine,
        gracePeriodDays: studentGrace,
      },
      staff: {
        maxActiveLoans: staffLoans,
        loanDurationDays: staffDuration,
        maxRenewals: staffRenewals,
        finePerDayCents: staffFine,
        gracePeriodDays: staffGrace,
      },
      librarian: DEFAULT_LIBRARY_POLICIES.librarian,
      admin: DEFAULT_LIBRARY_POLICIES.admin,
    };

    await db
      .insert(systemSettings)
      .values({
        key: "library_policies",
        value: JSON.stringify(updatedPolicies),
        description: "Configurable loan quotas, durations, fine rates, and grace periods per user role",
        updatedById: session.appUser.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: JSON.stringify(updatedPolicies),
          updatedById: session.appUser.id,
          updatedAt: new Date(),
        },
      });

    await db.insert(auditLogs).values({
      userId: session.appUser.id,
      action: "settings_updated",
      entityType: "system_settings",
      entityId: "library_policies",
      details: JSON.stringify(updatedPolicies),
    });

    revalidatePath("/settings");
    revalidatePath("/circulation");
    revalidatePath("/my-loans");

    return { success: true, message: "Library policies successfully updated!" };
  } catch (err) {
    console.error("Policy update error:", err);
    return { error: "Failed to update library policies." };
  }
}

// Update General Info Action
export async function updateGeneralSettingsAction(
  _prevState: unknown,
  formData: FormData
): Promise<SettingsActionResult> {
  const session = await requireAuthUser();
  if (!hasPermission(session.appUser.role, PERMISSIONS.MANAGE_SETTINGS)) {
    return { error: "Unauthorized. Admin privileges required." };
  }

  const general = {
    institutionName: formData.get("institutionName")?.toString().trim() || "EduLibrary",
    contactEmail: formData.get("contactEmail")?.toString().trim() || "library@school.edu",
    contactPhone: formData.get("contactPhone")?.toString().trim() || "+1 (555) 019-2834",
    operatingHours: formData.get("operatingHours")?.toString().trim() || "Mon - Fri: 8:00 AM - 6:00 PM",
    address: formData.get("address")?.toString().trim() || "100 Academic Way, Building C",
  };

  try {
    await db
      .insert(systemSettings)
      .values({
        key: "general_info",
        value: JSON.stringify(general),
        description: "General institutional library metadata and contact details",
        updatedById: session.appUser.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: JSON.stringify(general),
          updatedById: session.appUser.id,
          updatedAt: new Date(),
        },
      });

    await db.insert(auditLogs).values({
      userId: session.appUser.id,
      action: "settings_updated",
      entityType: "system_settings",
      entityId: "general_info",
      details: JSON.stringify(general),
    });

    revalidatePath("/settings");
    return { success: true, message: "General institutional settings saved!" };
  } catch (err) {
    console.error("Settings error:", err);
    return { error: "Failed to save settings." };
  }
}
