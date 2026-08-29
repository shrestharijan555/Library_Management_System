"use client";

import React, { useState, useTransition } from "react";
import { Edit2, Loader2, AlertCircle, Barcode, MapPin } from "lucide-react";
import { updateBookCopyAction, type InventoryActionResult } from "@/app/actions/inventory";
import type { BookCopy, CopyStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditCopyDialogProps {
  copy: BookCopy;
  bookTitle: string;
}

export function EditCopyDialog({ copy, bookTitle }: EditCopyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [barcode, setBarcode] = useState(copy.barcode);
  const [shelfLocation, setShelfLocation] = useState(copy.shelfLocation);
  const [status, setStatus] = useState<CopyStatus>(copy.status);
  const [conditionNotes, setConditionNotes] = useState(copy.conditionNotes || "");
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<InventoryActionResult | null>(null);

  const handleOpen = () => {
    setBarcode(copy.barcode);
    setShelfLocation(copy.shelfLocation);
    setStatus(copy.status);
    setConditionNotes(copy.conditionNotes || "");
    setState(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState(null);

    const formData = new FormData();
    formData.set("bookId", copy.bookId);
    formData.set("barcode", barcode);
    formData.set("shelfLocation", shelfLocation);
    formData.set("status", status);
    formData.set("conditionNotes", conditionNotes);

    startTransition(async () => {
      const res = await updateBookCopyAction(copy.id, null, formData);
      if (res?.error || res?.fieldErrors) {
        setState(res);
      } else {
        setIsOpen(false);
      }
    });
  };

  const isBorrowed = copy.status === "borrowed";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Edit Copy ${copy.barcode}`}
        title="Edit Copy Details"
        className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
      >
        <Edit2 className="size-3" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-copy-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => !isPending && setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
                    <Edit2 className="size-3.5" />
                  </div>
                  <h3 id="edit-copy-title" className="text-base font-bold text-zinc-900">
                    Edit Physical Copy Metadata
                  </h3>
                </div>
                <p className="text-xs text-zinc-500">
                  Updating physical item <code className="font-mono text-zinc-800">{copy.barcode}</code> for{" "}
                  <strong className="text-zinc-800">&ldquo;{bookTitle}&rdquo;</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Global Error Banner */}
              {state?.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* Barcode */}
              <div className="space-y-1.5">
                <label htmlFor="barcode" className="text-xs font-semibold text-zinc-900">
                  Barcode Identifier <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Barcode className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="barcode"
                    name="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    disabled={isPending}
                    required
                    className="pl-8 font-mono text-xs"
                  />
                </div>
                {state?.fieldErrors?.barcode && (
                  <p className="text-xs text-red-600">{state.fieldErrors.barcode[0]}</p>
                )}
              </div>

              {/* Status & Shelf Location Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Status */}
                <div className="space-y-1.5">
                  <label htmlFor="status" className="text-xs font-semibold text-zinc-900">
                    Current Copy Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CopyStatus)}
                    disabled={isPending}
                    className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 shadow-sm focus:border-zinc-950 focus:outline-none cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="borrowed" disabled={!isBorrowed}>
                      Borrowed (Active Loan)
                    </option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance / Repair</option>
                    <option value="lost">Lost / Decommissioned</option>
                  </select>
                  {isBorrowed && (
                    <p className="text-[11px] text-amber-700">
                      Currently checked out. Use circulation desk to process returns.
                    </p>
                  )}
                </div>

                {/* Shelf Location */}
                <div className="space-y-1.5">
                  <label htmlFor="shelfLocation" className="text-xs font-semibold text-zinc-900">
                    Shelf Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                      id="shelfLocation"
                      name="shelfLocation"
                      value={shelfLocation}
                      onChange={(e) => setShelfLocation(e.target.value)}
                      disabled={isPending}
                      required
                      className="pl-8 text-xs"
                    />
                  </div>
                  {state?.fieldErrors?.shelfLocation && (
                    <p className="text-xs text-red-600">{state.fieldErrors.shelfLocation[0]}</p>
                  )}
                </div>
              </div>

              {/* Condition Notes */}
              <div className="space-y-1.5">
                <label htmlFor="conditionNotes" className="text-xs font-semibold text-zinc-900">
                  Condition Notes
                </label>
                <textarea
                  id="conditionNotes"
                  name="conditionNotes"
                  rows={3}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="e.g. Spine wear, missing dust jacket, repaired binding..."
                  disabled={isPending}
                  className="w-full rounded-md border border-zinc-300 bg-white p-2.5 text-xs placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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
