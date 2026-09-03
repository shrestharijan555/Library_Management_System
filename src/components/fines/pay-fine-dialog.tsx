// src/components/fines/pay-fine-dialog.tsx
"use client";

import React, { useState, useTransition } from "react";
import { DollarSign, Loader2, AlertCircle, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { payFineAction } from "@/app/actions/fines";

interface PayFineDialogProps {
  fineId: string;
  borrowerName: string;
  memberCode: string;
  amountCents: number;
  reason: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PayFineDialog({
  fineId,
  borrowerName,
  memberCode,
  amountCents,
  reason,
  isOpen,
  onClose,
  onSuccess,
}: PayFineDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("fineId", fineId);
      formData.set("paymentMethod", paymentMethod);
      formData.set("receiptNotes", receiptNotes);

      const res = await payFineAction(null, formData);
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
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Record Fine Payment
                </h3>
                <p className="text-xs text-zinc-500">Collect fine and generate payment receipt</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Borrower:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {borrowerName} ({memberCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Reason:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{reason}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 text-sm">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Amount Due:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ${(amountCents / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "card", label: "Card / POS", icon: CreditCard },
                  { id: "online", label: "Online", icon: DollarSign },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as "cash" | "card" | "online")}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Receipt Note / Reference (Optional)
              </label>
              <Input
                placeholder="e.g. Cash received at desk, Transaction #4928..."
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Recording...
                </>
              ) : (
                `Mark as Paid ($${(amountCents / 100).toFixed(2)})`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
