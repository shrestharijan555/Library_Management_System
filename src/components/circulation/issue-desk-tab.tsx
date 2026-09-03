// src/components/circulation/issue-desk-tab.tsx
"use client";

import React, { useState, useTransition } from "react";
import {
  ScanBarcode,
  UserCheck,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { lookupBarcodeAction, BarcodeLookupData } from "@/app/actions/inventory";
import { lookupMemberAction, issueLoanAction } from "@/app/actions/circulation";

interface MemberData {
  id: string;
  fullName: string;
  email: string;
  memberCode: string;
  role: string;
  status: string;
  department?: string | null;
  gradeLevel?: string | null;
}

interface MemberLookupResult {
  user: MemberData;
  activeLoanCount: number;
  maxActiveLoans: number;
  loanDurationDays: number;
  unpaidFinesCents: number;
}

export function IssueDeskTab() {
  const [barcode, setBarcode] = useState("");
  const [memberCode, setMemberCode] = useState("");

  const [copyData, setCopyData] = useState<BarcodeLookupData | null>(null);
  const [memberData, setMemberData] = useState<MemberLookupResult | null>(null);

  const [copyError, setCopyError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [isSearchingBarcode, startSearchBarcode] = useTransition();
  const [isSearchingMember, startSearchMember] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  // Look up copy by barcode
  const handleBarcodeSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcode.trim();
    if (!query) return;

    setCopyError(null);
    setActionError(null);
    setActionSuccess(null);

    startSearchBarcode(async () => {
      const res = await lookupBarcodeAction(query);
      if (res.error) {
        setCopyError(res.error);
        setCopyData(null);
      } else if (res.data) {
        setCopyData(res.data);
        if (res.data.copy.status !== "available") {
          setCopyError(`Copy is currently "${res.data.copy.status}" and cannot be issued.`);
        }
      }
    });
  };

  // Look up member by card code
  const handleMemberSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = memberCode.trim();
    if (!query) return;

    setMemberError(null);
    setActionError(null);
    setActionSuccess(null);

    startSearchMember(async () => {
      const res = await lookupMemberAction(query);
      if (res.error) {
        setMemberError(res.error);
        setMemberData(null);
      } else if (res.data) {
        const m = res.data as MemberLookupResult;
        setMemberData(m);
        if (m.user.status !== "active") {
          setMemberError(`Member account is ${m.user.status}. Checkout disabled.`);
        } else if (m.activeLoanCount >= m.maxActiveLoans) {
          setMemberError(`Loan quota exceeded (${m.activeLoanCount}/${m.maxActiveLoans} active loans).`);
        }
      }
    });
  };

  // Issue loan action
  const handleIssueLoan = () => {
    if (!copyData?.copy.id || !memberData?.user.memberCode) return;

    setActionError(null);
    setActionSuccess(null);

    startSubmitting(async () => {
      const formData = new FormData();
      formData.set("copyId", copyData.copy.id);
      formData.set("memberCode", memberData.user.memberCode);

      const res = await issueLoanAction(null, formData);
      if (res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess(res.message || "Book checked out successfully!");
        // Reset copy state for next scan
        setBarcode("");
        setCopyData(null);
        // Refresh member data
        const updatedMember = await lookupMemberAction(memberData.user.memberCode);
        if (updatedMember.data) {
          setMemberData(updatedMember.data as MemberLookupResult);
        }
      }
    });
  };

  const calculateDueDate = () => {
    if (!memberData) return null;
    const date = new Date();
    date.setDate(date.getDate() + memberData.loanDurationDays);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isEligibleToIssue =
    copyData &&
    copyData.copy.status === "available" &&
    memberData &&
    memberData.user.status === "active" &&
    memberData.activeLoanCount < memberData.maxActiveLoans &&
    !copyError &&
    !memberError;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Member Lookup */}
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                Scan / Enter Member Card
              </CardTitle>
              {memberData && (
                <Badge variant={memberData.user.status === "active" ? "success" : "destructive"}>
                  {memberData.user.status}
                </Badge>
              )}
            </div>
            <CardDescription>
              Scan student or staff barcode ID (e.g., STU-1001, STF-2002)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleMemberSearch} className="flex gap-2">
              <div className="relative flex-1">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Enter member code..."
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  className="pl-9 font-mono"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={isSearchingMember || !memberCode.trim()}>
                {isSearchingMember ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Find Member"
                )}
              </Button>
            </form>

            {memberError && (
              <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {memberError}
              </div>
            )}

            {memberData && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {memberData.user.fullName}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {memberData.user.email} &bull; Code:{" "}
                      <span className="font-mono font-medium">{memberData.user.memberCode}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {memberData.user.role}
                  </Badge>
                </div>

                {/* Quota & Fine Indicator */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Active Loans:</span>{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {memberData.activeLoanCount} / {memberData.maxActiveLoans}
                    </span>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          memberData.activeLoanCount >= memberData.maxActiveLoans
                            ? "bg-rose-500"
                            : "bg-indigo-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (memberData.activeLoanCount / memberData.maxActiveLoans) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Unpaid Fines:</span>{" "}
                    <span
                      className={`font-semibold ${
                        memberData.unpaidFinesCents > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      ${(memberData.unpaidFinesCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Book Copy Lookup */}
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Scan / Enter Book Barcode
              </CardTitle>
              {copyData && (
                <Badge
                  variant={
                    copyData.copy.status === "available"
                      ? "success"
                      : copyData.copy.status === "borrowed"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {copyData.copy.status}
                </Badge>
              )}
            </div>
            <CardDescription>
              Scan physical barcode sticker on book (e.g., BC-9780132350884-1)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleBarcodeSearch} className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Scan copy barcode..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="pl-9 font-mono"
                />
              </div>
              <Button type="submit" disabled={isSearchingBarcode || !barcode.trim()}>
                {isSearchingBarcode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Lookup Copy"
                )}
              </Button>
            </form>

            {copyError && (
              <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {copyError}
              </div>
            )}

            {copyData && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex gap-4">
                {copyData.book.coverImageUrl ? (
                  <img
                    src={copyData.book.coverImageUrl}
                    alt={copyData.book.title}
                    className="w-14 h-20 object-cover rounded shadow-sm shrink-0 border border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-14 h-20 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-zinc-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm">
                    {copyData.book.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {copyData.authors.map((a) => a.name).join(", ") || "Unknown Author"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>
                      Rack: <strong className="text-zinc-700 dark:text-zinc-300">{copyData.copy.shelfLocation || "General"}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Barcode: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{copyData.copy.barcode}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Checkout Action Bar */}
      <Card className="border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-purple-950/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  Ready to Issue Loan
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {calculateDueDate() ? (
                    <>
                      Projected Return Due Date:{" "}
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {calculateDueDate()}
                      </span>
                    </>
                  ) : (
                    "Scan member and book copy to calculate due date"
                  )}
                </p>
              </div>
            </div>

            <Button
              onClick={handleIssueLoan}
              disabled={!isEligibleToIssue || isSubmitting}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Issuing Checkout...
                </>
              ) : (
                <>
                  Complete Issue Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
