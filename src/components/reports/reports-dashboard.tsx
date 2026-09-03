// src/components/reports/reports-dashboard.tsx
"use client";

import React from "react";
import {
  TrendingUp,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CsvExportButton } from "@/components/reports/csv-export-button";

export interface ReportStats {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  maintenanceCopies: number;
  lostCopies: number;
  totalMembers: number;
  totalFinesAssessedCents: number;
  totalFinesCollectedCents: number;
  totalFinesWaivedCents: number;
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
  exportableLoans: Array<Record<string, unknown>>;
  exportableInventory: Array<Record<string, unknown>>;
  exportableFines: Array<Record<string, unknown>>;
}

interface ReportsDashboardProps {
  stats: ReportStats;
}

export function ReportsDashboard({ stats }: ReportsDashboardProps) {
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
      {/* Top CSV Export Controls Bar */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Export Institutional Reports (CSV):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CsvExportButton
              filename="circulation_loans_report"
              getData={() => stats.exportableLoans}
              label="Export Loans"
            />
            <CsvExportButton
              filename="inventory_copies_report"
              getData={() => stats.exportableInventory}
              label="Export Inventory"
            />
            <CsvExportButton
              filename="financial_fines_report"
              getData={() => stats.exportableFines}
              label="Export Fines"
            />
          </div>
        </div>
      </Card>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
              {stats.activeLoans} currently active &bull; {stats.returnedLoans} returned
            </p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
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

        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Overdue Rate
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
              {overdueRate}%
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {stats.overdueLoans} of {stats.activeLoans} active checkouts
            </p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
              ${(stats.totalFinesAssessedCents / 100).toFixed(2)} total assessed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Circulated Titles */}
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Most Borrowed Book Titles
            </CardTitle>
            <CardDescription>Highest circulating books in the library system</CardDescription>
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
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
            {/* Health Bar Stack */}
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center">
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  Available
                </span>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {stats.availableCopies}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-center">
                <span className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium">
                  Borrowed
                </span>
                <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
                  {stats.borrowedCopies}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center">
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  Maintenance
                </span>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                  {stats.maintenanceCopies}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center">
                <span className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                  Lost
                </span>
                <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                  {stats.lostCopies}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
    </div>
  );
}
