// src/app/reports/loading.tsx
import React from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 animate-spin" />
            </div>
            <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-800/60 rounded mt-2" />
        </div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />

      {/* Tab bar Skeleton */}
      <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-5 space-y-3">
              <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-7 w-20 bg-zinc-300 dark:bg-zinc-700 rounded" />
              <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
        <div className="h-72 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
      </div>
    </div>
  );
}
