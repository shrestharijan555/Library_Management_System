// src/app/my-loans/loading.tsx
import React from "react";
import { BookMarked } from "lucide-react";

export default function MyLoansLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
          <BookMarked className="w-5 h-5" />
        </div>
        <div>
          <div className="h-8 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-72 bg-zinc-100 dark:bg-zinc-800/60 rounded mt-2" />
        </div>
      </div>

      <div className="h-10 w-full sm:w-80 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4" />
        ))}
      </div>
    </div>
  );
}
