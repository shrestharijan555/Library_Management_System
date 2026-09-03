// src/components/circulation/loans-live-table.tsx
"use client";

import React, { useState, useTransition } from "react";
import {
  Search,
  RotateCcw,
  RefreshCw,
  AlertOctagon,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { returnLoanAction } from "@/app/actions/circulation";
import { QuickRenewDialog } from "@/components/circulation/quick-renew-dialog";
import { MarkLostDialog } from "@/components/circulation/mark-lost-dialog";

export interface CirculationLoanItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  copyId: string;
  barcode: string;
  shelfLocation: string | null;
  userId: string;
  borrowerName: string;
  borrowerEmail: string;
  memberCode: string;
  borrowerRole: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  returnDate: string | null;
  status: "active" | "returned" | "overdue" | "lost";
  renewalCount: number;
}

interface LoansLiveTableProps {
  initialLoans: CirculationLoanItem[];
}

export function LoansLiveTable({ initialLoans }: LoansLiveTableProps) {
  const [loansList, setLoansList] = useState<CirculationLoanItem[]>(initialLoans);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog states
  const [renewTarget, setRenewTarget] = useState<CirculationLoanItem | null>(null);
  const [lostTarget, setLostTarget] = useState<CirculationLoanItem | null>(null);

  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isReturningId, setIsReturningId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Filtered loans
  const filteredLoans = loansList.filter((item) => {
    const matchesSearch =
      item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "active") return item.status === "active";
    if (statusFilter === "overdue") return item.status === "overdue";
    if (statusFilter === "returned") return item.status === "returned";
    if (statusFilter === "lost") return item.status === "lost";
    return true;
  });

  const handleReturnDirect = (loanId: string) => {
    setIsReturningId(loanId);
    setActionMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("loanId", loanId);

      const res = await returnLoanAction(null, formData);
      setIsReturningId(null);

      if (res.error) {
        setActionMessage({ text: res.error, type: "error" });
      } else {
        setActionMessage({ text: res.message || "Loan returned successfully!", type: "success" });
        // Update local state
        setLoansList((prev) =>
          prev.map((l) => (l.id === loanId ? { ...l, status: "returned", returnDate: new Date().toISOString() } : l))
        );
      }
    });
  };

  const getDueBadge = (dueDateStr: string, status: string) => {
    if (status === "returned") {
      return <Badge variant="secondary">Returned</Badge>;
    }
    if (status === "lost") {
      return <Badge variant="destructive">Marked Lost</Badge>;
    }

    const now = new Date();
    const due = new Date(dueDateStr);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          {Math.abs(diffDays)}d Overdue
        </Badge>
      );
    } else if (diffDays === 0) {
      return <Badge variant="warning">Due Today</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="warning">Due in {diffDays}d</Badge>;
    } else {
      return <Badge variant="success">Due in {diffDays}d</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl text-sm flex items-center gap-2.5 animate-in fade-in ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search by book, member name, card code, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "overdue", "returned", "lost"] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? "default" : "outline"}
              onClick={() => setStatusFilter(st)}
              className="text-xs capitalize h-8 shrink-0"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Loans Table Card */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-4">Book Title & Barcode</th>
                <th className="p-3.5">Borrower</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5">Due Date & Status</th>
                <th className="p-3.5 text-center">Renewals</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    No circulation loans match your current filters.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* Book */}
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        {loan.bookCoverUrl ? (
                          <img
                            src={loan.bookCoverUrl}
                            alt={loan.bookTitle}
                            className="w-9 h-12 object-cover rounded shadow-xs shrink-0 border border-zinc-200 dark:border-zinc-700"
                          />
                        ) : (
                          <div className="w-9 h-12 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/catalogue/${loan.bookId}`}
                            className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 group truncate max-w-[200px] sm:max-w-xs"
                          >
                            <span className="truncate">{loan.bookTitle}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                              {loan.barcode}
                            </span>
                            {loan.shelfLocation && <span>Rack: {loan.shelfLocation}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Borrower */}
                    <td className="p-3.5">
                      <div className="min-w-0">
                        <Link
                          href={`/members/${loan.userId}`}
                          className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline truncate block"
                        >
                          {loan.borrowerName}
                        </Link>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{loan.memberCode}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{loan.borrowerRole}</span>
                        </div>
                      </div>
                    </td>

                    {/* Issue Date */}
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400 text-xs">
                      {new Date(loan.issueDate).toLocaleDateString()}
                    </td>

                    {/* Due Date & Badge */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </div>
                        {getDueBadge(loan.dueDate, loan.status)}
                      </div>
                    </td>

                    {/* Renewals */}
                    <td className="p-3.5 text-center font-mono text-xs">
                      {loan.renewalCount}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-4 text-right">
                      {loan.status === "active" || loan.status === "overdue" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/30"
                            onClick={() => handleReturnDirect(loan.id)}
                            disabled={isReturningId === loan.id}
                          >
                            {isReturningId === loan.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 mr-1 text-emerald-600" />
                                Return
                              </>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-950/30"
                            onClick={() => setRenewTarget(loan)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1 text-indigo-600" />
                            Renew
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => setLostTarget(loan)}
                            title="Mark Lost"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Renew Dialog */}
      {renewTarget && (
        <QuickRenewDialog
          isOpen={!!renewTarget}
          onClose={() => setRenewTarget(null)}
          loanId={renewTarget.id}
          bookTitle={renewTarget.bookTitle}
          currentDueDate={new Date(renewTarget.dueDate)}
          renewalCount={renewTarget.renewalCount}
          onSuccess={() => {
            setActionMessage({ text: "Loan renewed successfully!", type: "success" });
            setLoansList((prev) =>
              prev.map((l) =>
                l.id === renewTarget.id
                  ? {
                      ...l,
                      renewalCount: l.renewalCount + 1,
                      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
                    }
                  : l
              )
            );
          }}
        />
      )}

      {/* Mark Lost Dialog */}
      {lostTarget && (
        <MarkLostDialog
          isOpen={!!lostTarget}
          onClose={() => setLostTarget(null)}
          loanId={lostTarget.id}
          bookTitle={lostTarget.bookTitle}
          barcode={lostTarget.barcode}
          borrowerName={lostTarget.borrowerName}
          onSuccess={() => {
            setActionMessage({ text: "Book copy marked as lost and fine assessed.", type: "success" });
            setLoansList((prev) =>
              prev.map((l) => (l.id === lostTarget.id ? { ...l, status: "lost" } : l))
            );
          }}
        />
      )}
    </div>
  );
}
