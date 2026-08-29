"use client";

import React, { useState, useTransition } from "react";
import { Plus, Layers, Loader2, AlertCircle, Barcode, MapPin, CheckCircle2 } from "lucide-react";
import { addBookCopiesAction, type InventoryActionResult } from "@/app/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddCopyDialogProps {
  bookId: string;
  bookTitle: string;
  isbn: string;
  defaultShelfLocation?: string;
}

export function AddCopyDialog({
  bookId,
  bookTitle,
  isbn,
  defaultShelfLocation = "General Stacks",
}: AddCopyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customBarcode, setCustomBarcode] = useState("");
  const [shelfLocation, setShelfLocation] = useState(defaultShelfLocation);
  const [conditionNotes, setConditionNotes] = useState("");
  const [status, setStatus] = useState<"available" | "maintenance" | "lost">("available");
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<InventoryActionResult | null>(null);

  const handleOpen = () => {
    setQuantity(1);
    setCustomBarcode("");
    setShelfLocation(defaultShelfLocation);
    setConditionNotes("");
    setStatus("available");
    setState(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState(null);

    const formData = new FormData();
    formData.set("bookId", bookId);
    formData.set("quantity", quantity.toString());
    formData.set("shelfLocation", shelfLocation);
    formData.set("conditionNotes", conditionNotes);
    formData.set("customBarcode", customBarcode);
    formData.set("status", status);

    startTransition(async () => {
      const res = await addBookCopiesAction(null, formData);
      if (res?.error || res?.fieldErrors) {
        setState(res);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={handleOpen}
        className="gap-1.5 shadow-xs"
      >
        <Plus className="size-3.5" />
        <span>Add Physical Copy</span>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-copy-title"
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
                    <Layers className="size-4" />
                  </div>
                  <h3 id="add-copy-title" className="text-base font-bold text-zinc-900">
                    Add Physical Inventory Copies
                  </h3>
                </div>
                <p className="text-xs text-zinc-500">
                  Register new copies into inventory for{" "}
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

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label htmlFor="quantity" className="text-xs font-semibold text-zinc-900">
                    Number of Copies <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    disabled={isPending}
                    required
                    className="text-xs"
                  />
                  {state?.fieldErrors?.quantity && (
                    <p className="text-xs text-red-600">{state.fieldErrors.quantity[0]}</p>
                  )}
                </div>

                {/* Initial Status */}
                <div className="space-y-1.5">
                  <label htmlFor="status" className="text-xs font-semibold text-zinc-900">
                    Initial Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "available" | "maintenance" | "lost")}
                    disabled={isPending}
                    className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs text-zinc-800 shadow-sm focus:border-zinc-950 focus:outline-none cursor-pointer"
                  >
                    <option value="available">Available (Ready for Loan)</option>
                    <option value="maintenance">Maintenance / Inspection</option>
                    <option value="lost">Lost / Missing</option>
                  </select>
                </div>
              </div>

              {/* Shelf Location */}
              <div className="space-y-1.5">
                <label htmlFor="shelfLocation" className="text-xs font-semibold text-zinc-900">
                  Shelf / Storage Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                  <Input
                    id="shelfLocation"
                    name="shelfLocation"
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    placeholder="e.g. Science Stacks - Shelf B3"
                    disabled={isPending}
                    required
                    className="pl-8 text-xs"
                  />
                </div>
                {state?.fieldErrors?.shelfLocation && (
                  <p className="text-xs text-red-600">{state.fieldErrors.shelfLocation[0]}</p>
                )}
              </div>

              {/* Custom Barcode or Auto-generation notice */}
              {quantity === 1 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="customBarcode" className="text-xs font-semibold text-zinc-900">
                      Custom Barcode (Optional)
                    </label>
                    <span className="text-[11px] text-zinc-400">Leave blank to auto-generate</span>
                  </div>
                  <div className="relative">
                    <Barcode className="absolute left-2.5 top-2.5 size-4 text-zinc-400" />
                    <Input
                      id="customBarcode"
                      name="customBarcode"
                      value={customBarcode}
                      onChange={(e) => setCustomBarcode(e.target.value.toUpperCase())}
                      placeholder={`e.g. BC-${isbn.replace(/[^A-Za-z0-9]/g, "")}-1-XYZ`}
                      disabled={isPending}
                      className="pl-8 font-mono text-xs"
                    />
                  </div>
                  {state?.fieldErrors?.customBarcode && (
                    <p className="text-xs text-red-600">{state.fieldErrors.customBarcode[0]}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Auto-Generated Barcode Batch</span>
                  </div>
                  <p>
                    All {quantity} copies will be assigned unique tracked barcodes like{" "}
                    <code className="font-mono text-zinc-800">
                      BC-{isbn.replace(/[^A-Za-z0-9]/g, "").slice(0, 10)}-#
                    </code>.
                  </p>
                </div>
              )}

              {/* Condition Notes */}
              <div className="space-y-1.5">
                <label htmlFor="conditionNotes" className="text-xs font-semibold text-zinc-900">
                  Condition Notes (Optional)
                </label>
                <textarea
                  id="conditionNotes"
                  name="conditionNotes"
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="e.g. Brand new acquisition, hardcover in excellent condition..."
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
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>
                        {quantity === 1 ? "Add 1 Copy" : `Add ${quantity} Copies`}
                      </span>
                    </>
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
