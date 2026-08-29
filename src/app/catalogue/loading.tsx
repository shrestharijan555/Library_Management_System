import React from "react";

export default function CatalogueLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-zinc-200" />
          <div className="h-7 w-64 rounded bg-zinc-200" />
          <div className="h-4 w-80 rounded bg-zinc-200" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-zinc-200" />
      </div>

      {/* Stats Summary Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm"
          >
            <div className="size-9 rounded-lg bg-zinc-200" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-16 rounded bg-zinc-200" />
              <div className="h-5 w-10 rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="h-9 flex-1 rounded-md bg-zinc-200" />
        <div className="h-9 w-40 rounded-md bg-zinc-200" />
        <div className="h-9 w-32 rounded-md bg-zinc-200" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="h-36 w-full bg-zinc-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-zinc-200" />
              <div className="h-3 w-1/2 rounded bg-zinc-200" />
              <div className="mt-4 h-3 w-full rounded bg-zinc-200" />
            </div>
            <div className="mt-auto border-t border-zinc-100 p-3 flex justify-between">
              <div className="h-4 w-12 rounded bg-zinc-200" />
              <div className="h-4 w-8 rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
