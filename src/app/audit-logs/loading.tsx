// src/app/audit-logs/loading.tsx
import React from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AuditLogsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="h-8 w-60 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-4 w-80 bg-zinc-100 dark:bg-zinc-800/60 rounded mt-2" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />

      {/* Table Skeleton */}
      <Card className="border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
