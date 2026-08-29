import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, desc, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { users, loans, books, bookCopies, reservations, fines } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type UserRole } from "@/config/roles";
import { DEFAULT_LIBRARY_POLICIES } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Shield,
  CreditCard,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertOctagon,
  UserX,
  Receipt,
  Bookmark,
  ShieldAlert,
} from "lucide-react";
import { EditMemberDialog } from "@/components/members/edit-member-dialog";
import { MemberStatusDialog } from "@/components/members/member-status-dialog";
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog";
import { MemberLoansTab } from "@/components/members/member-loans-tab";
import { MemberReservationsTab } from "@/components/members/member-reservations-tab";
import { MemberFinesTab } from "@/components/members/member-fines-tab";

interface MemberDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MemberDetailsPage({ params }: MemberDetailsPageProps) {
  const { appUser } = await requireAuthUser();
  const { id: memberId } = await params;

  // Role guard
  if (!hasPermission(appUser.role as UserRole, PERMISSIONS.VIEW_MEMBERS)) {
    redirect("/dashboard");
  }

  // 1. Fetch member profile
  const [member] = await db
    .select()
    .from(users)
    .where(eq(users.id, memberId));

  if (!member) {
    notFound();
  }

  // 2. Fetch Active Loans
  const activeLoansList = await db
    .select({
      id: loans.id,
      bookId: books.id,
      bookTitle: books.title,
      copyBarcode: bookCopies.barcode,
      issueDate: loans.issueDate,
      dueDate: loans.dueDate,
      returnDate: loans.returnDate,
      status: loans.status,
      renewalCount: loans.renewalCount,
    })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
    .where(and(eq(loans.userId, memberId), eq(loans.status, "active")))
    .orderBy(desc(loans.issueDate));

  // 3. Fetch Historical Returned Loans
  const loanHistoryList = await db
    .select({
      id: loans.id,
      bookId: books.id,
      bookTitle: books.title,
      copyBarcode: bookCopies.barcode,
      issueDate: loans.issueDate,
      dueDate: loans.dueDate,
      returnDate: loans.returnDate,
      status: loans.status,
      renewalCount: loans.renewalCount,
    })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .innerJoin(bookCopies, eq(loans.copyId, bookCopies.id))
    .where(and(eq(loans.userId, memberId), ne(loans.status, "active")))
    .orderBy(desc(loans.returnDate))
    .limit(20);

  // 4. Fetch Active Reservations
  const reservationsList = await db
    .select({
      id: reservations.id,
      bookId: books.id,
      bookTitle: books.title,
      reservationDate: reservations.reservationDate,
      expiryDate: reservations.expiryDate,
      status: reservations.status,
      queuePosition: reservations.queuePosition,
    })
    .from(reservations)
    .innerJoin(books, eq(reservations.bookId, books.id))
    .where(eq(reservations.userId, memberId))
    .orderBy(desc(reservations.reservationDate));

  // 5. Fetch Fines
  const finesList = await db
    .select({
      id: fines.id,
      amountCents: fines.amountCents,
      status: fines.status,
      reason: fines.reason,
      createdAt: fines.createdAt,
      paidAt: fines.paidAt,
    })
    .from(fines)
    .where(eq(fines.userId, memberId))
    .orderBy(desc(fines.createdAt));

  const canEdit = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.UPDATE_MEMBER
  );
  const canDelete = hasPermission(
    appUser.role as UserRole,
    PERMISSIONS.DELETE_MEMBER
  );

  const isSelf = member.id === appUser.id;

  const policy =
    DEFAULT_LIBRARY_POLICIES[member.role as UserRole] ||
    DEFAULT_LIBRARY_POLICIES.student;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive" as const;
      case "librarian":
        return "default" as const;
      case "staff":
        return "info" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle2 className="size-3" />
            <span>Active Account</span>
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <AlertOctagon className="size-3" />
            <span>Suspended</span>
          </Badge>
        );
      case "inactive":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <UserX className="size-3" />
            <span>Inactive / Archived</span>
          </Badge>
        );
    }
  };

  const unpaidFinesCents = finesList
    .filter((f) => f.status === "unpaid")
    .reduce((acc, f) => acc + f.amountCents, 0);

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/members"
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Member Profile
              </Badge>
              <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize text-xs font-semibold">
                <Shield className="mr-1 size-3 inline" />
                {member.role}
              </Badge>
              {getStatusBadge(member.status)}
            </div>
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              {member.fullName}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <EditMemberDialog member={member} variant="button" />
              <MemberStatusDialog
                memberId={member.id}
                memberName={member.fullName}
                currentStatus={member.status}
                isSelf={isSelf}
              />
            </>
          )}

          {canDelete && (
            <DeleteMemberDialog
              memberId={member.id}
              memberName={member.fullName}
              memberCode={member.memberCode}
              isSelf={isSelf}
            />
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
            <BookOpen className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Active Checkouts
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {activeLoansList.length} / {policy.maxActiveLoans}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <Calendar className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Total Lifetime Loans
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {activeLoansList.length + loanHistoryList.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
            <Bookmark className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Active Holds
            </span>
            <div className="text-lg font-bold text-zinc-900">
              {reservationsList.filter((r) => r.status === "pending").length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Receipt className="size-4.5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Outstanding Dues
            </span>
            <div className="text-lg font-bold text-zinc-900">
              ${(unpaidFinesCents / 100).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Member Profile & Borrowing Policies */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <User className="size-4 text-zinc-700" />
                Membership Record
              </CardTitle>
              <CardDescription>
                Verified identity details and institutional affiliation
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Full Name
                </span>
                <p className="text-sm font-semibold text-zinc-900">
                  {member.fullName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Member ID / Code
                </span>
                <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-zinc-900">
                  <CreditCard className="size-3.5 text-zinc-400" />
                  {member.memberCode}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Email Address
                </span>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 truncate">
                  <Mail className="size-3.5 text-zinc-400 shrink-0" />
                  <span>{member.email}</span>
                </p>
              </div>

              {member.phone && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Phone Number
                  </span>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <Phone className="size-3.5 text-zinc-400" />
                    <span>{member.phone}</span>
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Department / Section
                </span>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                  <Building className="size-3.5 text-zinc-400" />
                  <span>{member.department || "General"}</span>
                </p>
              </div>

              {member.gradeClass && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Grade / Class
                  </span>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                    <GraduationCap className="size-3.5 text-zinc-400" />
                    <span>{member.gradeClass}</span>
                  </p>
                </div>
              )}

              <div className="space-y-1 border-t border-zinc-100 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Joined Institution
                </span>
                <p className="text-xs text-zinc-500">
                  {new Date(member.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Borrowing Policy Matrix Card */}
          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ShieldAlert className="size-4 text-zinc-700" />
                Borrowing Privileges Matrix
              </CardTitle>
              <CardDescription>
                Policy limits based on <strong className="capitalize">{member.role}</strong> standing
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-5 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Maximum Active Checkouts</span>
                <span className="font-bold text-zinc-900">{policy.maxActiveLoans} Books</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Checkout Duration</span>
                <span className="font-bold text-zinc-900">{policy.loanDurationDays} Days</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Max Renewal Extensions</span>
                <span className="font-bold text-zinc-900">{policy.maxRenewals} Times</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500">Overdue Fine Rate</span>
                <span className="font-bold text-zinc-900">
                  ${(policy.finePerDayCents / 100).toFixed(2)} / Day
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Overdue Grace Period</span>
                <span className="font-bold text-zinc-900">{policy.gracePeriodDays} Days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Columns: Activity Tabs */}
        <div className="space-y-6 lg:col-span-2">
          {/* Loans Tab */}
          <MemberLoansTab
            activeLoans={activeLoansList}
            loanHistory={loanHistoryList}
          />

          {/* Reservations Tab */}
          <MemberReservationsTab reservations={reservationsList} />

          {/* Fines Tab */}
          <MemberFinesTab fines={finesList} />
        </div>
      </div>
    </div>
  );
}
