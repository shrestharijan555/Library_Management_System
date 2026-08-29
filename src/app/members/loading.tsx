import React from "react";
import { Users } from "lucide-react";

export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-zinc-200" />
          <div className="h-7 w-64 rounded bg-zinc-200" />
          <div className="h-4 w-96 rounded bg-zinc-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-zinc-200" />
      </div>

      {/* KPI Counters Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs" />
        ))}
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="h-24 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs" />

      {/* Table Skeleton */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-center py-16 text-zinc-300">
          <Users className="size-8 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
