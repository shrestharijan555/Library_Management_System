"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CatalogueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Catalogue Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="size-6" />
      </div>

      <h2 className="mt-4 text-lg font-bold text-zinc-900">
        Failed to load catalogue
      </h2>

      <p className="mt-1 max-w-md text-xs text-zinc-500">
        An error occurred while fetching books from the library database.
        {error.message && <span className="block mt-1 font-mono text-zinc-600">{error.message}</span>}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="size-3.5" />
            <span>Dashboard</span>
          </Button>
        </Link>

        <Button size="sm" onClick={() => reset()} className="gap-1.5">
          <RotateCcw className="size-3.5" />
          <span>Try Again</span>
        </Button>
      </div>
    </div>
  );
}
