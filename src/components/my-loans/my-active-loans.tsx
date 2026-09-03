// src/components/my-loans/my-active-loans.tsx
"use client";

import React, { useState } from "react";
import {
  BookOpen,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickRenewDialog } from "@/components/circulation/quick-renew-dialog";

export interface MyLoanItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  authors: string[];
  barcode: string;
  shelfLocation: string | null;
  issueDate: string;
  dueDate: string;
  renewalCount: number;
  maxRenewals: number;
  isOverdue: boolean;
  daysRemaining: number;
}

interface MyActiveLoansProps {
  loans: MyLoanItem[];
}

export function MyActiveLoans({ loans: initialLoans }: MyActiveLoansProps) {
  const [loans, setLoans] = useState<MyLoanItem[]>(initialLoans);
  const [renewTarget, setRenewTarget] = useState<MyLoanItem | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {loans.length === 0 ? (
        <Card className="border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No Active Loans</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            You currently have no books checked out from the library. Browse the catalogue to discover your next read!
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center justify-center mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md px-3 h-8 shadow-xs transition-colors"
          >
            Explore Book Catalogue
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loans.map((loan) => {
            const renewalsLeft = Math.max(0, loan.maxRenewals - loan.renewalCount);
            const canRenew = renewalsLeft > 0 && !loan.isOverdue;

            return (
              <Card
                key={loan.id}
                className="border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5 flex gap-4">
                  {/* Book Cover */}
                  {loan.bookCoverUrl ? (
                    <img
                      src={loan.bookCoverUrl}
                      alt={loan.bookTitle}
                      className="w-20 h-28 object-cover rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/catalogue/${loan.bookId}`}
                          className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 transition-colors text-sm line-clamp-2"
                        >
                          {loan.bookTitle}
                        </Link>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {loan.authors.join(", ") || "Unknown Author"}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Due:</span>
                        <span
                          className={`font-semibold ${
                            loan.isOverdue
                              ? "text-rose-600 dark:text-rose-400"
                              : loan.daysRemaining <= 3
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Status:</span>
                        {loan.isOverdue ? (
                          <Badge variant="destructive" className="animate-pulse text-[10px] px-1.5 py-0">
                            {Math.abs(loan.daysRemaining)}d Overdue
                          </Badge>
                        ) : loan.daysRemaining === 0 ? (
                          <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                            Due Today
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">
                            {loan.daysRemaining} days left
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {renewalsLeft} renewals left
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canRenew}
                        onClick={() => setRenewTarget(loan)}
                        className="h-7 text-xs px-2.5 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-950/40"
                      >
                        <RefreshCw className="w-3 h-3 mr-1.5" />
                        Renew
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {renewTarget && (
        <QuickRenewDialog
          isOpen={!!renewTarget}
          onClose={() => setRenewTarget(null)}
          loanId={renewTarget.id}
          bookTitle={renewTarget.bookTitle}
          currentDueDate={new Date(renewTarget.dueDate)}
          renewalCount={renewTarget.renewalCount}
          onSuccess={() => {
            setSuccessNotice("Your loan was extended successfully!");
            setLoans((prev) =>
              prev.map((l) =>
                l.id === renewTarget.id
                  ? {
                      ...l,
                      renewalCount: l.renewalCount + 1,
                      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
                      daysRemaining: 14,
                      isOverdue: false,
                    }
                  : l
              )
            );
          }}
        />
      )}
    </div>
  );
}
