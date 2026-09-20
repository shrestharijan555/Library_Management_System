// src/app/dashboard/error.tsx
"use client";

import React, { useEffect } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full border-rose-200 dark:border-rose-950/40 bg-white dark:bg-zinc-900 shadow-sm text-center">
        <CardContent className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Unable to Load Dashboard
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              An error occurred while loading the dashboard. Please try again.
            </p>
          </div>
          <Button onClick={() => reset()} className="gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
