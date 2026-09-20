// src/app/catalogue/loading.tsx
import React from "react";
import { Library } from "lucide-react";

export default function CatalogueLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-800/60 rounded mt-2" />
          </div>
        </div>
      </div>

      <div className="h-12 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800" />

      {/* Book Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-80 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <div className="h-44 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-5 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded" />
            <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
