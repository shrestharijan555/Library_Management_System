// src/components/reports/reports-dashboard.tsx
"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Calendar,
  Clock,
  BookmarkCheck,
  Users,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CsvExportButton } from "@/components/reports/csv-export-button";

export interface ReportStats {
  currentRange: string;
  // Circulation
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  periodIssuedLoans: number;
  periodReturnedLoans: number;
  periodRenewals: number;
  // Books & Copies
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  reservedCopies: number;
  maintenanceCopies: number;
  lostCopies: number;
  // Financials
  totalFinesAssessedCents: number;
  totalFinesCollectedCents: number;
  totalFinesWaivedCents: number;
  totalFinesUnpaidCents: number;
  unpaidFinesCount: number;
  paidFinesCount: number;
  waivedFinesCount: number;
  // Reservations
  totalReservations: number;
  pendingReservations: number;
  fulfilledReservations: number;
  cancelledReservations: number;
  expiredReservations: number;
  // Members
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  inactiveMembers: number;
  roleDistribution: Array<{ role: string; count: number }>;
  topBorrowers: Array<{
    id: string;
    name: string;
    email: string;
    memberCode: string;
    role: string;
    loanCount: number;
  }>;
  // Book Ranking & Categories
  topBooks: Array<{
    id: string;
    title: string;
    coverImageUrl: string | null;
    circulationCount: number;
    categoryName: string;
  }>;
  categoryStats: Array<{
    name: string;
    bookCount: number;
    percentage: number;
  }>;
  // Datasets for CSV export
  exportableLoans: Array<Record<string, unknown>>;
  exportableInventory: Array<Record<string, unknown>>;
  exportableFines: Array<Record<string, unknown>>;
  exportableReservations: Array<Record<string, unknown>>;
  exportableMembers: Array<Record<string, unknown>>;
}

interface ReportsDashboardProps {
  stats: ReportStats;
}

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all", label: "All Time" },
];

export function ReportsDashboard({ stats }: ReportsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleRangeChange = (rangeValue: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", rangeValue);
      router.push(`/reports?${params.toString()}`);
    });
  };

  const returnRate =
    stats.totalLoans > 0
      ? Math.round((stats.returnedLoans / stats.totalLoans) * 100)
      : 100;

  const overdueRate =
    stats.activeLoans > 0
      ? Math.round((stats.overdueLoans / stats.activeLoans) * 100)
      : 0;

  const maxTopCirculation = stats.topBooks[0]?.circulationCount || 1;

  return (
    <div className="space-y-6">
      {/* Top Filter & CSV Export Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mr-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Time Window:</span>
          </div>
          {DATE_RANGE_OPTIONS.map((opt) => {
            const isActive = stats.currentRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleRangeChange(opt.value)}
                disabled={isPending}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* 5 CSV Export Streams */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mr-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV:</span>
          </div>
          <CsvExportButton
            filename="circulation_loans_report"
            getData={() => stats.exportableLoans}
            label="Loans"
          />
          <CsvExportButton
            filename="inventory_copies_report"
            getData={() => stats.exportableInventory}
            label="Inventory"
          />
          <CsvExportButton
            filename="financial_fines_report"
            getData={() => stats.exportableFines}
            label="Fines"
          />
          <CsvExportButton
            filename="reservations_queue_report"
            getData={() => stats.exportableReservations}
            label="Reservations"
          />
          <CsvExportButton
            filename="registered_members_report"
            getData={() => stats.exportableMembers}
            label="Members"
          />
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview & KPIs</TabsTrigger>
          <TabsTrigger value="circulation">Circulation & Loans</TabsTrigger>
          <TabsTrigger value="financials">Financials & Fines</TabsTrigger>
          <TabsTrigger value="reservations">Reservations & Demand</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Health</TabsTrigger>
          <TabsTrigger value="members">Member Demographics</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Checkouts
                  </span>
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
                  {stats.totalLoans.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {stats.activeLoans} active &bull; {stats.returnedLoans} returned
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Return Reliability
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {returnRate}%
                </div>
                <p className="text-xs text-zinc-500 mt-1">All-time loan fulfillment rate</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Active Reservations
                  </span>
                  <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                  {stats.pendingReservations}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {stats.totalReservations} total reservation requests
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Fine Revenue Collected
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  ${(stats.totalFinesCollectedCents / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  ${(stats.totalFinesUnpaidCents / 100).toFixed(2)} currently outstanding
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Circulated Titles */}
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Most Borrowed Book Titles
                </CardTitle>
                <CardDescription>Highest circulating books across the institutional catalogue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.topBooks.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">No circulation history yet.</p>
                ) : (
                  stats.topBooks.map((book, idx) => (
                    <div key={book.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate max-w-xs sm:max-w-sm">
                          <span className="font-bold text-zinc-400 w-4">#{idx + 1}</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {book.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {book.categoryName}
                          </Badge>
                        </div>
                        <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
                          {book.circulationCount} checkouts
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (book.circulationCount / maxTopCirculation) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Physical Inventory Health Breakdown */}
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Physical Copy Inventory Health
                </CardTitle>
                <CardDescription>
                  Status distribution across all {stats.totalCopies} registered physical items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500"
                    style={{
                      width: `${(stats.availableCopies / (stats.totalCopies || 1)) * 100}%`,
                    }}
                    title={`Available: ${stats.availableCopies}`}
                  />
                  <div
                    className="bg-indigo-500"
                    style={{
                      width: `${(stats.borrowedCopies / (stats.totalCopies || 1)) * 100}%`,
                    }}
                    title={`Borrowed: ${stats.borrowedCopies}`}
                  />
                  <div
                    className="bg-blue-500"
                    style={{
                      width: `${(stats.reservedCopies / (stats.totalCopies || 1)) * 100}%`,
                    }}
                    title={`Reserved: ${stats.reservedCopies}`}
                  />
                  <div
                    className="bg-amber-500"
                    style={{
                      width: `${(stats.maintenanceCopies / (stats.totalCopies || 1)) * 100}%`,
                    }}
                    title={`Maintenance: ${stats.maintenanceCopies}`}
                  />
                  <div
                    className="bg-rose-500"
                    style={{
                      width: `${(stats.lostCopies / (stats.totalCopies || 1)) * 100}%`,
                    }}
                    title={`Lost: ${stats.lostCopies}`}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center">
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                      Available
                    </span>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {stats.availableCopies}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-center">
                    <span className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium">
                      Borrowed
                    </span>
                    <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
                      {stats.borrowedCopies}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-center">
                    <span className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                      Reserved
                    </span>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                      {stats.reservedCopies}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center">
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      Maintenance
                    </span>
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                      {stats.maintenanceCopies}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center">
                    <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                      Lost
                    </span>
                    <div className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                      {stats.lostCopies}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Distribution */}
          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Collection by Category Breakdown
              </CardTitle>
              <CardDescription>
                Catalogue representation across genres and academic subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {stats.categoryStats.map((cat) => (
                  <div
                    key={cat.name}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cat.name}</span>
                      <span className="font-mono text-zinc-500">{cat.bookCount} titles</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CIRCULATION & LOANS */}
        <TabsContent value="circulation" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Loans Issued (Period)
                  </span>
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
                  {stats.periodIssuedLoans}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Filtered by active date window</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Loans Returned (Period)
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {stats.periodReturnedLoans}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Items returned within period</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Renewals Processed
                  </span>
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                  {stats.periodRenewals}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Loan extension events</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Currently Overdue
                  </span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                  {stats.overdueLoans}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{overdueRate}% of active checkouts</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Borrowers Table */}
          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Most Active Borrowers
              </CardTitle>
              <CardDescription>Members with the highest circulation volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                    <tr>
                      <th className="p-3 font-semibold">Member</th>
                      <th className="p-3 font-semibold">Member Code</th>
                      <th className="p-3 font-semibold">Role</th>
                      <th className="p-3 font-semibold text-right">Total Checkouts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {stats.topBorrowers.map((borrower) => (
                      <tr key={borrower.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                        <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {borrower.name}
                          <span className="block text-[11px] text-zinc-500 font-normal">
                            {borrower.email}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{borrower.memberCode}</td>
                        <td className="p-3 capitalize">
                          <Badge variant="outline" className="text-[10px]">
                            {borrower.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-bold font-mono text-indigo-600">
                          {borrower.loanCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FINANCIALS & FINES */}
        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Assessed
                  </span>
                  <DollarSign className="w-4 h-4 text-zinc-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
                  ${(stats.totalFinesAssessedCents / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">All fines generated by overdues</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Collected / Paid
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  ${(stats.totalFinesCollectedCents / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{stats.paidFinesCount} settled fine entries</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Waived by Staff
                  </span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                  ${(stats.totalFinesWaivedCents / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{stats.waivedFinesCount} excused fees</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Outstanding / Unpaid
                  </span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                  ${(stats.totalFinesUnpaidCents / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{stats.unpaidFinesCount} pending fines</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: RESERVATIONS & DEMAND */}
        <TabsContent value="reservations" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Queue Requests
                  </span>
                  <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
                  {stats.totalReservations}
                </div>
                <p className="text-xs text-zinc-500 mt-1">All reservation history</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Pending In Queue
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                  {stats.pendingReservations}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Awaiting returned copies</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Fulfilled
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {stats.fulfilledReservations}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Converted to active loans</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Cancelled / Expired
                  </span>
                  <AlertTriangle className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="text-2xl font-black text-zinc-700 dark:text-zinc-300 mt-2">
                  {stats.cancelledReservations + stats.expiredReservations}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {stats.cancelledReservations} cancelled &bull; {stats.expiredReservations} expired
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: INVENTORY HEALTH */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Unique Titles
                  </span>
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
                  {stats.totalBooks}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Catalogued titles</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Physical Items
                  </span>
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
                  {stats.totalCopies}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Average {(stats.totalCopies / (stats.totalBooks || 1)).toFixed(1)} copies per title
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Circulating Availability
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {stats.totalCopies > 0
                    ? Math.round((stats.availableCopies / stats.totalCopies) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {stats.availableCopies} available on shelf
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 6: MEMBER DEMOGRAPHICS */}
        <TabsContent value="members" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Registered
                  </span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
                  {stats.totalMembers}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Registered patron accounts</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Active Status
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {stats.activeMembers}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Eligible for checkout</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Suspended
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                  {stats.suspendedMembers}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Account restricted</p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Inactive
                  </span>
                  <Users className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="text-2xl font-black text-zinc-700 dark:text-zinc-300 mt-2">
                  {stats.inactiveMembers}
                </div>
                <p className="text-xs text-zinc-500 mt-1">Deactivated profiles</p>
              </CardContent>
            </Card>
          </div>

          {/* Role Distribution */}
          <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Membership Role Distribution
              </CardTitle>
              <CardDescription>Breakdown by access level and institutional authorization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.roleDistribution.map((r) => (
                  <div
                    key={r.role}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-center"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 capitalize">
                      {r.role}s
                    </span>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {r.count}
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {stats.totalMembers > 0
                        ? Math.round((r.count / stats.totalMembers) * 100)
                        : 0}
                      % of patrons
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
