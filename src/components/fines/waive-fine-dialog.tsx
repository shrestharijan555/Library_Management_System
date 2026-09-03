// src/components/fines/waive-fine-dialog.tsx
"use client";

import React, { useState, useTransition } from "react";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { waiveFineAction } from "@/app/actions/fines";

interface WaiveFineDialogProps {
  fineId: string;
  borrowerName: string;
  amountCents: number;
  reason: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WaiveFineDialog({
  fineId,
  borrowerName,
  amountCents,
  reason,
  isOpen,
  onClose,
  onSuccess,
}: WaiveFineDialogProps) {
  const [waiveReason, setWaiveReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiveReason.trim()) {
      setError("Please provide a legitimate reason for waiving this fine.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("fineId", fineId);
      formData.set("waiveReason", waiveReason);

      const res = await waiveFineAction(null, formData);
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
            <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Waive Fine
                </h3>
                <p className="text-xs text-zinc-500">
                  Administrative forgiveness with audit log record
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Borrower:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{borrowerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Original Reason:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Waived Amount:</span>
                <span className="font-bold text-sky-600 font-mono">
                  ${(amountCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Waive Justification / Administrative Reason *
              </label>
              <Input
                placeholder="e.g. Medical leave exemption, First-time courtesy waiver..."
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                required
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
              disabled={isPending || !waiveReason.trim()}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Waiving...
                </>
              ) : (
                "Confirm & Waive Fine"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
