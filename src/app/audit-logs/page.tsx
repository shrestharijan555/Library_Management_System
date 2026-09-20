// src/app/audit-logs/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { getAuditLogsAction } from "@/app/actions/audit-logs";
import { AuditLogsTable } from "@/components/audit-logs/audit-logs-table";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "System Audit Logs | EduLibrary",
  description: "Comprehensive immutable audit trail of authentication, circulation, inventory, and system operations.",
};

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const { appUser } = await requireAuthUser();

  // Server-side authorization check
  if (!hasPermission(appUser.role, PERMISSIONS.VIEW_AUDIT_LOGS)) {
    redirect("/dashboard");
  }

  // Fetch initial audit log dataset
  const res = await getAuditLogsAction({ page: 1, pageSize: 25 });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          Institutional Audit Logs
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Complete, chronological, and immutable audit trail for security compliance, user actions, inventory transitions, and circulation events.
        </p>
      </div>

      <AuditLogsTable
        initialLogs={res.logs}
        initialTotalCount={res.totalCount}
        initialTotalPages={res.totalPages}
        initialPage={res.currentPage}
        initialPageSize={res.pageSize}
      />
    </div>
  );
}
