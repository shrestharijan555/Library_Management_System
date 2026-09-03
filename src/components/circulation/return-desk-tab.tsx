// src/components/circulation/return-desk-tab.tsx
"use client";

import React, { useState, useTransition } from "react";
import {
  ScanBarcode,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { lookupBarcodeAction, BarcodeLookupData } from "@/app/actions/inventory";
import { returnLoanAction } from "@/app/actions/circulation";

export function ReturnDeskTab() {
  const [barcode, setBarcode] = useState("");
  const [copyData, setCopyData] = useState<BarcodeLookupData | null>(null);

  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const handleLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcode.trim();
    if (!query) return;

    setSearchError(null);
    setActionError(null);
    setActionSuccess(null);

    startSearch(async () => {
      const res = await lookupBarcodeAction(query);
      if (res.error) {
        setSearchError(res.error);
        setCopyData(null);
      } else if (res.data) {
        setCopyData(res.data);
        if (!res.data.activeLoan) {
          setSearchError(
            `This copy is currently "${res.data.copy.status}" and has no active loan to check in.`
          );
        }
      }
    });
  };

  const handleProcessReturn = () => {
    if (!copyData?.activeLoan?.loanId) return;

    setActionError(null);
    setActionSuccess(null);

    startSubmitting(async () => {
      const formData = new FormData();
      formData.set("loanId", copyData.activeLoan!.loanId);

      const res = await returnLoanAction(null, formData);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(res.message || "Book returned successfully!");
        setBarcode("");
        setCopyData(null);
      }
    });
  };

  // Helper to calculate days overdue and status
  const getOverdueStatus = () => {
    if (!copyData?.activeLoan) return null;
    const now = new Date();
    const due = new Date(copyData.activeLoan.dueDate);
    const diffMs = now.getTime() - due.getTime();
    const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysOverdue > 0) {
      return {
        isOverdue: true,
        days: daysOverdue,
      };
    }
    return {
      isOverdue: false,
      days: 0,
    };
  };

  const overdueInfo = getOverdueStatus();

  return (
    <div className="space-y-6">
      {/* Top Banner Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-sm font-medium">{actionSuccess}</div>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="text-sm font-medium">{actionError}</div>
        </div>
      )}

      {/* Main Check-In Card */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Fast Check-In / Return Desk
          </CardTitle>
          <CardDescription>
            Scan or enter the book barcode to inspect checkout details and complete the return.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLookup} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Scan book barcode to return..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="pl-9 font-mono"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isSearching || !barcode.trim()}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup Return"}
            </Button>
          </form>

          {searchError && (
            <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 max-w-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {searchError}
            </div>
          )}

          {copyData && copyData.activeLoan && (
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-6">
              <div className="flex flex-col md:flex-row gap-5 items-start">
                {/* Book Cover */}
                {copyData.book.coverImageUrl ? (
                  <img
                    src={copyData.book.coverImageUrl}
                    alt={copyData.book.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen className="w-8 h-8 text-zinc-400" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                        {copyData.book.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {copyData.authors.map((a) => a.name).join(", ") || "Unknown Author"}
                      </p>
                    </div>

                    {overdueInfo?.isOverdue ? (
                      <Badge variant="destructive" className="animate-pulse">
                        Overdue by {overdueInfo.days} days
                      </Badge>
                    ) : (
                      <Badge variant="success">On Time</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="space-y-0.5">
                      <span className="text-zinc-500 dark:text-zinc-400">Borrower:</span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {copyData.activeLoan.userName}
                      </p>
                      <p className="font-mono text-[11px] text-zinc-500">
                        Card: {copyData.activeLoan.memberCode}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-zinc-500 dark:text-zinc-400">Issued On:</span>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {new Date(copyData.activeLoan.issueDate).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Renewals: {copyData.activeLoan.renewalCount}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-zinc-500 dark:text-zinc-400">Due Date:</span>
                      <p
                        className={`font-semibold ${
                          overdueInfo?.isOverdue
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {new Date(copyData.activeLoan.dueDate).toLocaleDateString()}
                      </p>
                      <p className="font-mono text-[11px] text-zinc-500">
                        Barcode: {copyData.copy.barcode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action footer inside card */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Returning will set copy status to Available and fulfill waiting reservations automatically.
                </div>

                <Button
                  onClick={handleProcessReturn}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing Return...
                    </>
                  ) : (
                    <>
                      Confirm & Process Return
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
