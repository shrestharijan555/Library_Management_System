import { count, eq } from "drizzle-orm";
import { requireAuthUser } from "@/lib/auth/session";
import { db } from "@/db";
import { users, books, loans, reservations } from "@/db/schema";
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
  BookOpen,
  CheckCircle2,
  Users,
  BookCopy,
  Bookmark,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { DEFAULT_LIBRARY_POLICIES, siteConfig } from "@/config/site";
import type { UserRole } from "@/config/roles";

export default async function DashboardPage() {
  // Server-side route protection: redirects to /login if unauthenticated or non-active
  const { appUser } = await requireAuthUser();

  // Helper for role badge variants
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

  // Fetch REAL database metrics if tables exist (with graceful fallback if unmigrated)
  let realMemberCount = 0;
  let realBookCount = 0;
  let realActiveLoanCount = 0;
  let realReservationCount = 0;

  try {
    const userRes = await db.select({ count: count() }).from(users);
    realMemberCount = userRes[0]?.count ?? 0;
  } catch {
    realMemberCount = 0;
  }

  try {
    const bookRes = await db.select({ count: count() }).from(books);
    realBookCount = bookRes[0]?.count ?? 0;
  } catch {
    realBookCount = 0;
  }

  try {
    const loanRes = await db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, "active"));
    realActiveLoanCount = loanRes[0]?.count ?? 0;
  } catch {
    realActiveLoanCount = 0;
  }

  try {
    const resRes = await db.select({ count: count() }).from(reservations);
    realReservationCount = resRes[0]?.count ?? 0;
  } catch {
    realReservationCount = 0;
  }

  // Retrieve role policy limits from system configuration
  const userPolicy =
    DEFAULT_LIBRARY_POLICIES[appUser.role as UserRole] ||
    DEFAULT_LIBRARY_POLICIES.student;

  return (
    <div className="space-y-8">
      {/* Welcome Banner Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 px-2.5 py-0.5 text-xs font-medium">
              <Sparkles className="size-3 text-amber-600" />
              Phase 4 Application Shell
            </Badge>
            <Badge
              variant={getRoleBadgeVariant(appUser.role)}
              className="px-2.5 py-0.5 text-xs font-semibold capitalize"
            >
              <Shield className="mr-1 size-3 inline" />
              {appUser.role}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Welcome back, {appUser.fullName}
          </h1>
          <p className="text-sm text-zinc-500">
            Authenticated session and profile resolved from PostgreSQL via Drizzle ORM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
            <CreditCard className="size-3.5 text-zinc-400" />
            <span>ID: {appUser.memberCode}</span>
          </div>
          <Badge variant="success" className="px-2.5 py-1 text-xs font-semibold capitalize">
            <CheckCircle2 className="mr-1 size-3.5 inline" />
            {appUser.status}
          </Badge>
        </div>
      </div>

      {/* System Overview Real Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Members */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Members
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {realMemberCount}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Registered account records in PostgreSQL
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Catalogue Titles */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Catalogue Titles
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <BookOpen className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-zinc-900">
                {realBookCount}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Phase 5
              </Badge>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Book catalog items in database
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Active Loans */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Active Loans
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <BookCopy className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-zinc-900">
                {realActiveLoanCount}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Phase 6
              </Badge>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Currently issued circulation loans
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Pending Reservations */}
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Reservations
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <Bookmark className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-zinc-900">
                {realReservationCount}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Phase 6
              </Badge>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Pending hold queue requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Overview & Policy Matrix Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="size-4 text-zinc-700" />
              Application User Profile
            </CardTitle>
            <CardDescription>
              Verified identity details from Drizzle ORM schema
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Full Name
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                {appUser.fullName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Member Code / ID
              </span>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                <CreditCard className="size-3.5 text-zinc-400" />
                {appUser.memberCode}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Email Address
              </span>
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-zinc-900">
                <Mail className="size-3.5 text-zinc-400" />
                {appUser.email}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Assigned Role
              </span>
              <p className="text-sm font-semibold capitalize text-zinc-900">
                {appUser.role} Account
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Account Status
              </span>
              <p className="text-sm font-semibold capitalize text-emerald-700">
                {appUser.status}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Department / Class
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                {appUser.department || appUser.gradeClass || "General Institution"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Library Policy Matrix Card */}
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldAlert className="size-4 text-zinc-700" />
              Role Borrowing Policy Matrix
            </CardTitle>
            <CardDescription>
              Configured borrowing rules for your <strong className="capitalize">{appUser.role}</strong> account
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Max Active Loans
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                {userPolicy.maxActiveLoans} Books Allowed
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Loan Duration
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                {userPolicy.loanDurationDays} Days per Checkout
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Max Renewals
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                {userPolicy.maxRenewals} Times Allowed
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Overdue Fine Rate
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                ${(userPolicy.finePerDayCents / 100).toFixed(2)} / Day
              </p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Overdue Grace Period
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                {userPolicy.gracePeriodDays} Day Grace Period before fine accrual
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planned System Roadmap Navigation */}
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="size-4 text-zinc-700" />
            {siteConfig.shortName} Roadmap & Module Status
          </CardTitle>
          <CardDescription>
            System modules will unlock as upcoming build phases complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-900">Auth & Shell</span>
                <p className="text-[11px] text-emerald-700">Phases 1 - 4</p>
              </div>
              <Badge variant="success" className="text-[10px]">Active</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900">Book Catalogue</span>
                <p className="text-[11px] text-zinc-500">Phase 5</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">Next</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900">Circulation Desk</span>
                <p className="text-[11px] text-zinc-500">Phase 6</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">Upcoming</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900">Member Directory</span>
                <p className="text-[11px] text-zinc-500">Phase 7</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">Upcoming</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
