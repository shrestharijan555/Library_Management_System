// src/app/settings/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { DEFAULT_LIBRARY_POLICIES } from "@/config/site";
import { PolicySettingsForm } from "@/components/settings/policy-settings-form";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "System Settings & Policies | EduLibrary",
  description: "Configure library circulation rules, borrowing quotas, late fee policies, and institutional branding.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { appUser } = await requireAuthUser();

  if (!hasPermission(appUser.role, PERMISSIONS.MANAGE_SETTINGS)) {
    redirect("/dashboard");
  }

  // Fetch policies from DB or use defaults
  const policyRow = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "library_policies"),
  });

  let policies = {
    student: DEFAULT_LIBRARY_POLICIES.student,
    staff: DEFAULT_LIBRARY_POLICIES.staff,
  };

  if (policyRow?.value) {
    try {
      const parsed = JSON.parse(policyRow.value);
      if (parsed.student && parsed.staff) {
        policies = parsed;
      }
    } catch (e) {
      console.error("Error parsing policy JSON:", e);
    }
  }

  // Fetch general info
  const generalRow = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "general_info"),
  });

  let generalInfo = {
    institutionName: "EduLibrary",
    contactEmail: "library@school.edu",
    contactPhone: "+1 (555) 019-2834",
    operatingHours: "Mon - Fri: 8:00 AM - 6:00 PM",
    address: "100 Academic Way, Building C",
  };

  if (generalRow?.value) {
    try {
      const parsed = JSON.parse(generalRow.value);
      generalInfo = { ...generalInfo, ...parsed };
    } catch (e) {
      console.error("Error parsing general info JSON:", e);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Settings className="w-5 h-5" />
          </div>
          System Settings & Policies
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Fine-tune borrowing quotas, grace periods, overdue fee schedules, and institutional details.
        </p>
      </div>

      <div className="space-y-6">
        <PolicySettingsForm policies={policies} />
        <GeneralSettingsForm initialData={generalInfo} />
      </div>
    </div>
  );
}
