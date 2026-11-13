"use client";

import React, { useState, useTransition } from "react";
import { Bookmark, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { reserveBookAction } from "@/app/actions/circulation";
import { Button } from "@/components/ui/button";

interface ReserveBookDialogProps {
  bookId: string;
  bookTitle: string;
  userMemberCode: string;
  isAvailable: boolean;
}

export function ReserveBookDialog({
  bookId,
  bookTitle,
  userMemberCode,
  isAvailable,
}: ReserveBookDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("bookId", bookId);
    formData.append("memberCode", userMemberCode);

    startTransition(async () => {
      const res = await reserveBookAction(null, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.fieldErrors) {
        const first = Object.values(res.fieldErrors)[0]?.[0];
        setError(first || "Validation error placing hold.");
      } else {
        setSuccess(res.message || "Book hold placed successfully!");
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(null);
        }, 2000);
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccess(null);
        }}
        size="sm"
        className="gap-2 shadow-xs"
      >
        <Bookmark className="size-3.5" />
        <span>{isAvailable ? "Request Book / Place Hold" : "Join Hold Queue"}</span>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => !isPending && setIsOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <Bookmark className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Place Book Hold Request
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {bookTitle}
                </p>
              </div>
            </div>

            <form onSubmit={handleReserve} className="mt-4 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Member ID:</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{userMemberCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Availability:</span>
                  <span className={isAvailable ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-amber-600 dark:text-amber-400"}>
                    {isAvailable ? "Copies on shelf" : "All copies checked out"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1 leading-relaxed">
                  When fulfilled, the circulation desk will set aside a copy for you and you will receive an in-app pickup notification.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Placing Hold...</span>
                    </>
                  ) : (
                    <span>Confirm Hold Request</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

