// src/components/circulation/quick-renew-dialog.tsx
"use client";

import React, { useState, useTransition } from "react";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renewLoanAction } from "@/app/actions/circulation";

interface QuickRenewDialogProps {
  loanId: string;
  bookTitle: string;
  currentDueDate: Date;
  renewalCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickRenewDialog({
  loanId,
  bookTitle,
  currentDueDate,
  renewalCount,
  isOpen,
  onClose,
  onSuccess,
}: QuickRenewDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleRenew = () => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("loanId", loanId);

      const res = await renewLoanAction(null, formData);
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
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Renew Loan
              </h3>
              <p className="text-xs text-zinc-500">Extend due date based on user role policy</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
            <div>
              <span className="text-zinc-500">Title:</span>{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">{bookTitle}</strong>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-500">Current Due:</span>{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {new Date(currentDueDate).toLocaleDateString()}
                </strong>
              </div>
              <div>
                <span className="text-zinc-500">Times Renewed:</span>{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">{renewalCount}</strong>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleRenew}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Renewing...
              </>
            ) : (
              "Confirm Renewal"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
