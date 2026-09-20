// src/app/circulation/loading.tsx
import React from "react";
import { BookCopy } from "lucide-react";

export default function CirculationLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
          <BookCopy className="w-5 h-5" />
        </div>
        <div>
          <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-800/60 rounded mt-2" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="h-10 w-full sm:w-96 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />

      {/* Desk Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-96 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
        <div className="lg:col-span-2 h-96 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />
      </div>
    </div>
  );
}
