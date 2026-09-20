// src/app/dashboard/loading.tsx
import React from "react";
import { LayoutDashboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-800/60 rounded mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-5 space-y-2">
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-7 w-20 bg-zinc-300 dark:bg-zinc-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
        <div className="lg:col-span-1 h-80 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
      </div>
    </div>
  );
}
