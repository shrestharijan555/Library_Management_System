// src/components/fines/create-fine-dialog.tsx
"use client";

import React, { useState, useTransition } from "react";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createManualFineAction } from "@/app/actions/fines";

interface CreateFineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateFineDialog({ isOpen, onClose, onSuccess }: CreateFineDialogProps) {
  const [memberCode, setMemberCode] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dollars = parseFloat(amountDollars);
    if (isNaN(dollars) || dollars <= 0) {
      setError("Please enter a valid fine amount (e.g. 5.00).");
      return;
    }

    const amountCents = Math.round(dollars * 100);

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("memberCode", memberCode.trim());
      formData.set("amountCents", amountCents.toString());
      formData.set("reason", reason.trim());

      const res = await createManualFineAction(null, formData);
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
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Assess Manual Fine
                </h3>
                <p className="text-xs text-zinc-500">
                  Charge fine for lost library card, book damage, or incident
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Member Card Code *
                </label>
                <Input
                  placeholder="e.g. STU-1001"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Fine Amount (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.50"
                    max="500.00"
                    placeholder="5.00"
                    value={amountDollars}
                    onChange={(e) => setAmountDollars(e.target.value)}
                    className="pl-7 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Reason / Description *
                </label>
                <Input
                  placeholder="e.g. Book cover water damage, Lost ID card replacement..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Assessing...
                </>
              ) : (
                "Assess Fine"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
