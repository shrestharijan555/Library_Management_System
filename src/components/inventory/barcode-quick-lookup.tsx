"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Barcode,
  Search,
  Loader2,
  BookOpen,
  MapPin,
  Clock,
  User,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { lookupBarcodeAction, type BarcodeLookupData } from "@/app/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function BarcodeQuickLookup() {
  const [isOpen, setIsOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BarcodeLookupData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;

    setErrorMsg(null);
    setResult(null);

    startTransition(async () => {
      const res = await lookupBarcodeAction(barcodeInput.trim());
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.data) {
        setResult(res.data);
      }
    });
  };

  const handleOpen = () => {
    setBarcodeInput("");
    setResult(null);
    setErrorMsg(null);
    setIsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="success">Available</Badge>;
      case "borrowed":
        return <Badge variant="destructive">Checked Out</Badge>;
      case "reserved":
        return <Badge variant="info">Reserved</Badge>;
      case "maintenance":
        return <Badge variant="warning">Maintenance</Badge>;
      case "lost":
      default:
        return <Badge variant="destructive">Lost / Missing</Badge>;
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 shadow-xs"
      >
        <Barcode className="size-3.5" />
        <span>Scan / Barcode Lookup</span>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="barcode-lookup-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
                    <Barcode className="size-4" />
                  </div>
                  <h3 id="barcode-lookup-title" className="text-base font-bold text-zinc-900">
                    Barcode Quick Scanner & Lookup
                  </h3>
                </div>
                <p className="text-xs text-zinc-500">
                  Scan or enter a physical copy barcode to resolve title, shelf placement, and loan status.
                </p>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleLookup} className="mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="barcodeSearchInput"
                    name="barcodeSearchInput"
                    autoFocus
                    placeholder="Enter or scan barcode (e.g. BC-9780262033848-1-XYZ)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                    disabled={isPending}
                    className="pl-9 font-mono text-xs"
                  />
                </div>

                <Button type="submit" size="sm" disabled={isPending || !barcodeInput.trim()} className="gap-1.5">
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Search className="size-3.5" />
                  )}
                  <span>Lookup</span>
                </Button>
              </div>
            </form>

            {/* Error Message */}
            {errorMsg && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Result Card */}
            {result && (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-4 animate-in fade-in">
                {/* Book & Copy Header */}
                <div className="flex gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shadow-xs">
                    <BookOpen className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-900 truncate">
                        {result.book.title}
                      </h4>
                      {getStatusBadge(result.copy.status)}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {result.authors.map((a) => a.name).join(", ") || "Unspecified Author"}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-400">
                      ISBN: {result.book.isbn} &bull; Call #: {result.book.callNumber || "—"}
                    </p>
                  </div>
                </div>

                {/* Copy Spec Grid */}
                <div className="grid gap-2 border-t border-zinc-200/80 pt-3 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2 border border-zinc-100">
                    <Barcode className="size-4 text-zinc-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                        Barcode
                      </span>
                      <span className="font-mono font-bold text-zinc-800">
                        {result.copy.barcode}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-white p-2 border border-zinc-100">
                    <MapPin className="size-4 text-zinc-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                        Location
                      </span>
                      <span className="font-semibold text-zinc-800 truncate">
                        {result.copy.shelfLocation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-white p-2 border border-zinc-100">
                    <RotateCcw className="size-4 text-zinc-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                        Circulation History
                      </span>
                      <span className="font-semibold text-zinc-800">
                        {result.totalCirculationCount} Lifetime Loans
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-white p-2 border border-zinc-100">
                    <Sparkles className="size-4 text-zinc-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                        Condition
                      </span>
                      <span className="font-semibold text-zinc-800 truncate">
                        {result.copy.conditionNotes || "Good Condition"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Loan Information Strip if Borrowed */}
                {result.activeLoan && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 space-y-1.5 text-xs text-amber-900">
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-amber-700" />
                        <span>Active Checkout Details</span>
                      </div>
                      <Badge variant="destructive" className="text-[10px]">
                        Loan Active
                      </Badge>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3 text-amber-600" />
                        <span>
                          <strong>{result.activeLoan.userName}</strong> ({result.activeLoan.memberCode})
                        </span>
                      </div>
                      <div>
                        <span>Due Date: </span>
                        <strong>{new Date(result.activeLoan.dueDate).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* View in Catalogue Button */}
                <div className="pt-2 flex justify-end">
                  <Link href={`/catalogue/${result.book.id}`} onClick={() => setIsOpen(false)}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <span>View Full Catalogue Record</span>
                      <ExternalLink className="size-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end border-t border-zinc-100 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
