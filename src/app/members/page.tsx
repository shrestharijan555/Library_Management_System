import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ilike,
  or,
  eq,
  and,
  desc,
  asc,
  count,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { users, loans, fines } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  Briefcase,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  UserX,
} from "lucide-react";
import { MembersSearch } from "@/components/members/members-search";
import { MembersFilters } from "@/components/members/members-filters";
import { MembersTable, type EnrichedMemberItem } from "@/components/members/members-table";
import { CreateMemberDialog } from "@/components/members/create-member-dialog";

interface MembersPageProps {
  searchParams: Promise<{
    query?: string;
    role?: string;
    status?: string;
    standing?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const { appUser } = await requireAuthUser();

  // Role guard: Only admin and librarian can access members directory
  if (!hasPermission(appUser.role as UserRole, PERMISSIONS.VIEW_MEMBERS)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = params.query?.trim() || "";
  const role = params.role || "all";
  const status = params.status || "all";
  const standing = params.standing || "all";
  const sort = params.sort || "newest";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 15;
  const offset = (page - 1) * limit;

  // 1. Build where conditions
  const conditions = [];

  if (query) {
    conditions.push(
      or(
        ilike(users.fullName, `%${query}%`),
        ilike(users.email, `%${query}%`),
        ilike(users.memberCode, `%${query}%`),
        ilike(users.department, `%${query}%`),
        ilike(users.gradeClass, `%${query}%`)
      )
    );
  }

  if (role !== "all") {
    conditions.push(eq(users.role, role as UserRole));
  }

  if (status !== "all") {
    conditions.push(eq(users.status, status as "active" | "suspended" | "inactive"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 2. Determine sorting
  let orderByClause;
  switch (sort) {
    case "oldest":
      orderByClause = asc(users.createdAt);
      break;
    case "name_asc":
      orderByClause = asc(users.fullName);
      break;
    case "name_desc":
      orderByClause = desc(users.fullName);
      break;
    case "code_asc":
      orderByClause = asc(users.memberCode);
      break;
    case "newest":
    default:
      orderByClause = desc(users.createdAt);
      break;
  }

  // 3. Count total matching members
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);

  const totalItems = totalCountResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  // 4. Query matching users
  const rawUsersList = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const userIds = rawUsersList.map((u) => u.id);

  // 5. Aggregate active loan counts and unpaid fines for current batch
  let activeLoansMap: Record<string, number> = {};
  let unpaidFinesMap: Record<string, number> = {};

  if (userIds.length > 0) {
    // Active loans count
    const loanCounts = await db
      .select({
        userId: loans.userId,
        count: count(),
      })
      .from(loans)
      .where(and(sql`${loans.userId} IN ${userIds}`, eq(loans.status, "active")))
      .groupBy(loans.userId);

    activeLoansMap = loanCounts.reduce((acc, curr) => {
      acc[curr.userId] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    // Unpaid fines sum
    const finesSums = await db
      .select({
        userId: fines.userId,
        sum: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)`,
      })
      .from(fines)
      .where(and(sql`${fines.userId} IN ${userIds}`, eq(fines.status, "unpaid")))
      .groupBy(fines.userId);

    unpaidFinesMap = finesSums.reduce((acc, curr) => {
      acc[curr.userId] = Number(curr.sum) || 0;
      return acc;
    }, {} as Record<string, number>);
  }

  let enrichedMembers: EnrichedMemberItem[] = rawUsersList.map((u) => ({
    ...u,
    activeLoansCount: activeLoansMap[u.id] || 0,
    unpaidFinesCents: unpaidFinesMap[u.id] || 0,
  }));

  // Filter by standing if requested
  if (standing === "active_borrowers") {
    enrichedMembers = enrichedMembers.filter((m) => m.activeLoansCount > 0);
  } else if (standing === "with_fines") {
    enrichedMembers = enrichedMembers.filter((m) => m.unpaidFinesCents > 0);
  }

  // 6. Overall KPI statistics
  const [totalMembersStat] = await db.select({ count: count() }).from(users);
  const [studentsStat] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "student"));
  const [staffStat] = await db
    .select({ count: count() })
    .from(users)
    .where(or(eq(users.role, "staff"), eq(users.role, "librarian")));
  const [suspendedStat] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.status, "suspended"));

  const canCreateMember = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.CREATE_MEMBER
  );
  const canEditMember = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.UPDATE_MEMBER
  );

  const createPageUrl = (pageNumber: number) => {
    const p = new URLSearchParams();
    if (query) p.set("query", query);
    if (role !== "all") p.set("role", role);
    if (status !== "all") p.set("status", status);
    if (standing !== "all") p.set("standing", standing);
    if (sort !== "newest") p.set("sort", sort);
    p.set("page", pageNumber.toString());
    return `/members?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 px-2.5 py-0.5 text-xs font-medium">
              <Users className="size-3 text-zinc-900" />
              Phase 8 Member Roster
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalItems} {totalItems === 1 ? "Member" : "Members"} Found
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Institutional Members Directory
          </h1>
          <p className="text-sm text-zinc-500">
            Search, manage borrowing privileges, review history, and maintain user accounts.
          </p>
        </div>

        {canCreateMember && <CreateMemberDialog />}
      </div>

      {/* KPI Counters Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
            <Users className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Total Accounts
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {totalMembersStat?.count ?? 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <GraduationCap className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Students
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {studentsStat?.count ?? 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
            <Briefcase className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Faculty & Staff
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {staffStat?.count ?? 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-800">
            <AlertOctagon className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Suspended
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {suspendedStat?.count ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <MembersSearch defaultValue={query} />
        </div>
        <MembersFilters />
      </div>

      {/* Members Table or Empty State */}
      {enrichedMembers.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <UserX className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-zinc-900">
            No member accounts found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">
            {query || role !== "all" || status !== "all" || standing !== "all"
              ? "No member profiles matched your active filters. Try adjusting your query or resetting filters."
              : "No institutional member records are registered in the database."}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {query || role !== "all" || status !== "all" || standing !== "all" ? (
              <Link href="/members">
                <Button variant="outline" size="sm">
                  Clear All Filters
                </Button>
              </Link>
            ) : canCreateMember ? (
              <CreateMemberDialog />
            ) : null}
          </div>
        </div>
      ) : (
        <MembersTable
          members={enrichedMembers}
          currentUser={appUser}
          canEdit={canEditMember}
        />
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xs sm:flex-row">
          <span className="text-xs text-zinc-500">
            Showing <strong className="text-zinc-900">{offset + 1}</strong> to{" "}
            <strong className="text-zinc-900">
              {Math.min(offset + limit, totalItems)}
            </strong>{" "}
            of <strong className="text-zinc-900">{totalItems}</strong> members
          </span>

          <div className="flex items-center gap-1.5">
            {page > 1 ? (
              <Link href={createPageUrl(page - 1)}>
                <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5 text-xs">
                  <ChevronLeft className="size-3.5" />
                  <span>Previous</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 gap-1 px-2.5 text-xs opacity-50"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>
            )}

            <div className="flex items-center gap-1 px-2 text-xs font-semibold text-zinc-700">
              Page {page} of {totalPages}
            </div>

            {page < totalPages ? (
              <Link href={createPageUrl(page + 1)}>
                <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5 text-xs">
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 gap-1 px-2.5 text-xs opacity-50"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
