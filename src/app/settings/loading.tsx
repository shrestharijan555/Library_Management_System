// src/app/settings/loading.tsx
import React from "react";
import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800/60 rounded mt-2" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6 space-y-4">
              <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-10 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
