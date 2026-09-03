// src/components/circulation/mark-lost-dialog.tsx
"use client";

import React, { useState, useTransition } from "react";
import { AlertOctagon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markLoanLostAction } from "@/app/actions/circulation";

interface MarkLostDialogProps {
  loanId: string;
  bookTitle: string;
  barcode: string;
  borrowerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MarkLostDialog({
  loanId,
  bookTitle,
  barcode,
  borrowerName,
  isOpen,
  onClose,
  onSuccess,
}: MarkLostDialogProps) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await markLoanLostAction(loanId, notes);
      if (res.error) {
        setError(res.error);
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Mark Book as Lost
                </h3>
                <p className="text-xs text-zinc-500">
                  Decommissions copy and assesses replacement fee fine
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5 text-xs">
              <div>
                <span className="text-zinc-500">Book:</span>{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">{bookTitle}</strong>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-zinc-500">Barcode:</span>{" "}
                  <span className="font-mono">{barcode}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Borrower:</span>{" "}
                  <strong>{borrowerName}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Reason / Incident Notes (Optional)
              </label>
              <Input
                placeholder="e.g. Reported lost by borrower, damaged beyond repair..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Processing...
                </>
              ) : (
                "Mark as Lost"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
