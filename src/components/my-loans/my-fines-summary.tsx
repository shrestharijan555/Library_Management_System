// src/components/my-loans/my-fines-summary.tsx
"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface MyFineItem {
  id: string;
  amountCents: number;
  status: "unpaid" | "paid" | "waived";
  reason: string;
  createdAt: string;
  paidAt: string | null;
}

interface MyFinesSummaryProps {
  fines: MyFineItem[];
}

export function MyFinesSummary({ fines }: MyFinesSummaryProps) {
  const unpaidTotalCents = fines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + f.amountCents, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card
        className={`border ${
          unpaidTotalCents > 0
            ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20"
            : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  unpaidTotalCents > 0
                    ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {unpaidTotalCents > 0 ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  {unpaidTotalCents > 0 ? "Outstanding Dues" : "All Clear!"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {unpaidTotalCents > 0
                    ? "Please visit the circulation desk to settle your overdue fines."
                    : "You have no outstanding fines or overdue dues on your account."}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                Total Unpaid
              </span>
              <div
                className={`text-2xl font-black ${
                  unpaidTotalCents > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                ${(unpaidTotalCents / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fines Table */}
      <Card className="border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-4">Reason & Description</th>
                <th className="p-3.5">Assessed Date</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {fines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No fines or dues recorded on your account.
                  </td>
                </tr>
              ) : (
                fines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                    <td className="p-3.5 pl-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {fine.reason}
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400 text-xs">
                      {new Date(fine.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-bold font-mono">
                      ${(fine.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 pr-4 text-right">
                      <Badge
                        variant={
                          fine.status === "unpaid"
                            ? "destructive"
                            : fine.status === "paid"
                            ? "success"
                            : "secondary"
                        }
                        className="capitalize text-[10px]"
                      >
                        {fine.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
