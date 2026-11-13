import React from "react";
import Link from "next/link";
import { count, eq, and, sql, lt, lte, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, books, loans, reservations, fines, bookCopies } from "@/db/schema";
import { requireAuthUser } from "@/lib/auth/session";
import { DEFAULT_LIBRARY_POLICIES } from "@/config/site";
import type { UserRole } from "@/config/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  ArrowRightLeft,
  Bookmark,
  CreditCard,
  Mail,
  Shield,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Plus,
  Search,
  Settings,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { appUser } = await requireAuthUser();

  const role = appUser.role as UserRole;
  const userPolicy =
    DEFAULT_LIBRARY_POLICIES[role] || DEFAULT_LIBRARY_POLICIES.student;

  // Retrieve global metric counts
  let realMemberCount = 0;
  let realBookCount = 0;
  let realActiveLoanCount = 0;
  let realOverdueCount = 0;
  let realReservationCount = 0;

  // Personal metrics for Student & Staff
  let personalActiveLoans: {
    id: string;
    bookTitle: string;
    dueDate: Date;
    status: string;
  }[] = [];
  let personalDueSoonCount = 0;
  let personalOverdueCount = 0;
  let personalReservationsCount = 0;
  let personalReadyPickupCount = 0;
  let personalUnpaidFinesCents = 0;

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    const [memberRes] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "active"));
    realMemberCount = memberRes?.count ?? 0;

    const [bookRes] = await db.select({ count: count() }).from(books);
    realBookCount = bookRes?.count ?? 0;

    const [loanRes] = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, "active"));
    realActiveLoanCount = loanRes?.count ?? 0;

    const [overdueRes] = await db
      .select({ count: count() })
      .from(loans)
      .where(and(eq(loans.status, "active"), lt(loans.dueDate, now)));
    realOverdueCount = overdueRes?.count ?? 0;

    const [resRes] = await db
      .select({ count: count() })
      .from(reservations)
      .where(eq(reservations.status, "pending"));
    realReservationCount = resRes?.count ?? 0;

    // Student & Staff specific queries
    if (role === "student" || role === "staff") {
      const studentLoans = await db
        .select({
          id: loans.id,
          bookTitle: books.title,
          dueDate: loans.dueDate,
          status: loans.status,
        })
        .from(loans)
        .innerJoin(books, eq(loans.bookId, books.id))
        .where(and(eq(loans.userId, appUser.id), eq(loans.status, "active")))
        .orderBy(loans.dueDate)
        .limit(5);

      personalActiveLoans = studentLoans;

      personalOverdueCount = studentLoans.filter((l) => new Date(l.dueDate) < now).length;
      personalDueSoonCount = studentLoans.filter(
        (l) => new Date(l.dueDate) >= now && new Date(l.dueDate) <= threeDaysFromNow
      ).length;

      const [resCountRes] = await db
        .select({ count: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.userId, appUser.id),
            eq(reservations.status, "pending")
          )
        );
      personalReservationsCount = resCountRes?.count ?? 0;

      const [readyRes] = await db
        .select({ count: count() })
        .from(reservations)
        .where(
          and(
            eq(reservations.userId, appUser.id),
            eq(reservations.status, "fulfilled")
          )
        );
      personalReadyPickupCount = readyRes?.count ?? 0;

      const [fineRes] = await db
        .select({ total: sql<number>`COALESCE(SUM(${fines.amountCents}), 0)` })
        .from(fines)
        .where(and(eq(fines.userId, appUser.id), eq(fines.status, "unpaid")));
      personalUnpaidFinesCents = Number(fineRes?.total ?? 0);
    }
  } catch (err) {
    console.error("Dashboard metric load error:", err);
  }

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "default" as const;
      case "librarian":
        return "secondary" as const;
      case "staff":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-colors sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant={getRoleBadgeVariant(appUser.role)}
              className="px-2.5 py-0.5 text-xs font-semibold capitalize"
            >
              <Shield className="mr-1 size-3 inline" />
              {appUser.role} Account
            </Badge>
            <Badge variant="success" className="px-2 py-0 text-[11px] font-medium capitalize">
              {appUser.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Welcome back, {appUser.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {role === "student" && "View your active borrowed titles, reservation holds, and library status."}
            {role === "staff" && "Institutional faculty portal for book discovery, holds, and account quota."}
            {role === "librarian" && "Manage circulation counters, inventory copies, patron hold queues, and catalogue titles."}
            {role === "admin" && "Institutional library operations overview, system configuration, and audit logs."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300">
            <CreditCard className="size-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="font-mono">ID: {appUser.memberCode}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ROLE-SPECIFIC WORKSPACE: STUDENT & STAFF                 */}
      {/* ======================================================== */}
      {(role === "student" || role === "staff") && (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Active Loans
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <BookOpen className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {personalActiveLoans.length}
                  <span className="text-xs font-normal text-zinc-400 ml-1.5">
                    / {userPolicy.maxActiveLoans} max
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Books currently in your possession
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Due Soon / Overdue
                </CardTitle>
                <div className={`flex size-8 items-center justify-center rounded-lg ${personalOverdueCount > 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"}`}>
                  <Clock className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${personalOverdueCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-50"}`}>
                    {personalOverdueCount} Overdue
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {personalDueSoonCount} title(s) due within 3 days
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Holds & Reservations
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <Bookmark className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {personalReservationsCount + personalReadyPickupCount}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {personalReadyPickupCount > 0 ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {personalReadyPickupCount} ready for pickup!
                    </span>
                  ) : (
                    "In queue or waiting fulfillment"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Fines & Dues
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <DollarSign className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${personalUnpaidFinesCents > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-50"}`}>
                  ${(personalUnpaidFinesCents / 100).toFixed(2)}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {personalUnpaidFinesCents === 0 ? "Account in good standing" : "Outstanding balance due"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/catalogue" className="group">
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                    <Search className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                      Browse Catalogue
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Search literature and check availability
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link href="/my-loans" className="group">
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                    <BookOpen className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                      My Active Loans
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Renew books and verify return dates
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link href="/fines" className="group">
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                    <DollarSign className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                      Account Dues
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Review settlement receipts and waivers
                    </p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* ROLE-SPECIFIC WORKSPACE: LIBRARIAN & ADMIN               */}
      {/* ======================================================== */}
      {(role === "librarian" || role === "admin") && (
        <>
          {/* Institution Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Active Members
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <Users className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {realMemberCount}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Active patron & staff accounts
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Catalogue Holdings
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <BookOpen className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {realBookCount}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Unique titles in database
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Circulation Loans
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <ArrowRightLeft className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {realActiveLoanCount}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {realOverdueCount > 0 ? (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {realOverdueCount} currently overdue
                    </span>
                  ) : (
                    "All active checkouts within due dates"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Reservation Queue
                </CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <Bookmark className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {realReservationCount}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Pending patron hold requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Desk Actions Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/circulation" className="group">
              <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <ArrowRightLeft className="size-4" />
                  </div>
                  <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                    Circulation Desk
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Issue loans, process returns, renew items & fulfill holds
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/catalogue/new" className="group">
              <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <Plus className="size-4" />
                  </div>
                  <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                    Add Book Title
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Register new bibliographic titles and ISBN data
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/members" className="group">
              <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <Users className="size-4" />
                  </div>
                  <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                    Members Directory
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Inspect patron profiles, privileges and active borrowings
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/reports" className="group">
              <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                    <FileText className="size-4" />
                  </div>
                  <ArrowRight className="size-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline">
                    Reports & Analytics
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Export circulation data and monitor inventory metrics
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* Profile Overview & Policy Matrix Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Details Card */}
        <Card className="transition-colors">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <CardTitle className="text-base font-semibold">
              Account Profile
            </CardTitle>
            <CardDescription>
              Institutional user credentials and contact information
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Full Name
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {appUser.fullName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Member ID
              </span>
              <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <CreditCard className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                {appUser.memberCode}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Email Address
              </span>
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <Mail className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                {appUser.email}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Assigned Role
              </span>
              <p className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                {appUser.role} Account
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Account Status
              </span>
              <p className="text-sm font-semibold capitalize text-emerald-600 dark:text-emerald-400">
                {appUser.status}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Department / Program
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {appUser.department || appUser.gradeClass || "General Institution"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Library Borrowing Policy Card */}
        <Card className="transition-colors">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <CardTitle className="text-base font-semibold">
              Borrowing Privileges & Policy
            </CardTitle>
            <CardDescription>
              Configured borrowing rules for your <strong className="capitalize">{appUser.role}</strong> tier
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Max Active Loans
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {userPolicy.maxActiveLoans} Books Allowed
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Loan Duration
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {userPolicy.loanDurationDays} Days per Checkout
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Max Renewals
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {userPolicy.maxRenewals} Times Allowed
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Overdue Fine Rate
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                ${(userPolicy.finePerDayCents / 100).toFixed(2)} / Day
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Overdue Grace Period
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {userPolicy.gracePeriodDays} Day Grace Period before penalty accrual
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
