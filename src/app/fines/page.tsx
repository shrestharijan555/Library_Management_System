// src/app/fines/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { fines, users } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/config/roles";
import { FinesManagementTable, FineRecordItem } from "@/components/fines/fines-management-table";
import { DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Fines & Overdue Desk | EduLibrary",
  description: "Track unpaid dues, process fine payments, and manage fee waiving.",
};

export const dynamic = "force-dynamic";

export default async function FinesPage() {
  const { appUser } = await requireAuthUser();

  const isStaff =
    hasPermission(appUser.role, PERMISSIONS.COLLECT_FINE) ||
    hasPermission(appUser.role, PERMISSIONS.WAIVE_FINE);

  // If student or staff with no desk access, redirect to personal portal
  if (!isStaff) {
    redirect("/my-loans");
  }

  // Fetch all fine records
  const rawFines = await db
    .select({
      id: fines.id,
      userId: fines.userId,
      borrowerName: users.fullName,
      borrowerEmail: users.email,
      memberCode: users.memberCode,
      borrowerRole: users.role,
      loanId: fines.loanId,
      amountCents: fines.amountCents,
      status: fines.status,
      reason: fines.reason,
      createdAt: fines.createdAt,
      paidAt: fines.paidAt,
    })
    .from(fines)
    .innerJoin(users, eq(fines.userId, users.id))
    .orderBy(desc(fines.createdAt))
    .limit(200);

  const formattedFines: FineRecordItem[] = rawFines.map((f) => ({
    id: f.id,
    userId: f.userId,
    borrowerName: f.borrowerName,
    borrowerEmail: f.borrowerEmail,
    memberCode: f.memberCode,
    borrowerRole: f.borrowerRole,
    loanId: f.loanId,
    amountCents: f.amountCents,
    status: f.status as "unpaid" | "paid" | "waived",
    reason: f.reason,
    createdAt: f.createdAt.toISOString(),
    paidAt: f.paidAt ? f.paidAt.toISOString() : null,
  }));

  const canCollect = hasPermission(appUser.role, PERMISSIONS.COLLECT_FINE);
  const canWaive = hasPermission(appUser.role, PERMISSIONS.WAIVE_FINE);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <DollarSign className="w-5 h-5" />
          </div>
          Fines & Dues Management
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Monitor outstanding late return penalties, collect dues, issue waivers, and track revenue.
        </p>
      </div>

      <FinesManagementTable
        initialFines={formattedFines}
        canCollect={canCollect}
        canWaive={canWaive}
      />
    </div>
  );
}
