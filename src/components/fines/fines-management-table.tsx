// src/components/fines/fines-management-table.tsx
"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle2,
  PlusCircle,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PayFineDialog } from "@/components/fines/pay-fine-dialog";
import { WaiveFineDialog } from "@/components/fines/waive-fine-dialog";
import { CreateFineDialog } from "@/components/fines/create-fine-dialog";

export interface FineRecordItem {
  id: string;
  userId: string;
  borrowerName: string;
  borrowerEmail: string;
  memberCode: string;
  borrowerRole: string;
  loanId: string | null;
  amountCents: number;
  status: "unpaid" | "paid" | "waived";
  reason: string;
  createdAt: string;
  paidAt: string | null;
}

interface FinesManagementTableProps {
  initialFines: FineRecordItem[];
  canCollect: boolean;
  canWaive: boolean;
}

export function FinesManagementTable({
  initialFines,
  canCollect,
  canWaive,
}: FinesManagementTableProps) {
  const [finesList, setFinesList] = useState<FineRecordItem[]>(initialFines);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialog states
  const [payTarget, setPayTarget] = useState<FineRecordItem | null>(null);
  const [waiveTarget, setWaiveTarget] = useState<FineRecordItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Metrics
  const totalUnpaidCents = finesList
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + f.amountCents, 0);

  const totalPaidCents = finesList
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + f.amountCents, 0);

  const totalWaivedCents = finesList
    .filter((f) => f.status === "waived")
    .reduce((sum, f) => sum + f.amountCents, 0);

  const unpaidCount = finesList.filter((f) => f.status === "unpaid").length;

  const filteredFines = finesList.filter((f) => {
    const matchesSearch =
      f.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      f.memberCode.toLowerCase().includes(search.toLowerCase()) ||
      f.reason.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return f.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Outstanding Unpaid
            </span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ${(totalUnpaidCents / 100).toFixed(2)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{unpaidCount} unpaid fine tickets</p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Collected
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ${(totalPaidCents / 100).toFixed(2)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Cleared fine revenue</p>
          </CardContent>
        </Card>

        <Card className="border border-sky-200 dark:border-sky-900/50 bg-sky-50/20 dark:bg-sky-950/20">
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Waived
            </span>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
              ${(totalWaivedCents / 100).toFixed(2)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Administrative waivers</p>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-5">
          {canCollect && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Assess Manual Fine
            </Button>
          )}
        </Card>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search by borrower name, card code, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "unpaid", "paid", "waived"] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={statusFilter === st ? "default" : "outline"}
              onClick={() => setStatusFilter(st)}
              className="text-xs capitalize h-8"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Fines Table */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-4">Borrower</th>
                <th className="p-3.5">Reason / Incident</th>
                <th className="p-3.5">Assessed Date</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredFines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No fine tickets match your search.
                  </td>
                </tr>
              ) : (
                filteredFines.map((fine) => (
                  <tr
                    key={fine.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="p-3.5 pl-4">
                      <Link
                        href={`/members/${fine.userId}`}
                        className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline block truncate max-w-[180px]"
                      >
                        {fine.borrowerName}
                      </Link>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {fine.memberCode} &bull; <span className="capitalize">{fine.borrowerRole}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                      {fine.reason}
                    </td>

                    <td className="p-3.5 text-zinc-500 text-xs">
                      {new Date(fine.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      ${(fine.amountCents / 100).toFixed(2)}
                    </td>

                    <td className="p-3.5">
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

                    <td className="p-3.5 pr-4 text-right">
                      {fine.status === "unpaid" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {canCollect && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPayTarget(fine)}
                              className="h-7 text-xs px-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/30"
                            >
                              <CreditCard className="w-3 h-3 mr-1 text-emerald-600" />
                              Pay
                            </Button>
                          )}

                          {canWaive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setWaiveTarget(fine)}
                              className="h-7 text-xs px-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Waive
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">
                          {fine.status === "paid" ? "Settled" : "Waived"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pay Dialog */}
      {payTarget && (
        <PayFineDialog
          isOpen={!!payTarget}
          onClose={() => setPayTarget(null)}
          fineId={payTarget.id}
          borrowerName={payTarget.borrowerName}
          memberCode={payTarget.memberCode}
          amountCents={payTarget.amountCents}
          reason={payTarget.reason}
          onSuccess={() => {
            setToastMessage("Fine payment recorded successfully!");
            setFinesList((prev) =>
              prev.map((f) => (f.id === payTarget.id ? { ...f, status: "paid", paidAt: new Date().toISOString() } : f))
            );
          }}
        />
      )}

      {/* Waive Dialog */}
      {waiveTarget && (
        <WaiveFineDialog
          isOpen={!!waiveTarget}
          onClose={() => setWaiveTarget(null)}
          fineId={waiveTarget.id}
          borrowerName={waiveTarget.borrowerName}
          amountCents={waiveTarget.amountCents}
          reason={waiveTarget.reason}
          onSuccess={() => {
            setToastMessage("Fine waived successfully!");
            setFinesList((prev) =>
              prev.map((f) => (f.id === waiveTarget.id ? { ...f, status: "waived" } : f))
            );
          }}
        />
      )}

      {/* Create Fine Dialog */}
      <CreateFineDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setToastMessage("Manual fine created.");
          window.location.reload();
        }}
      />
    </div>
  );
}
