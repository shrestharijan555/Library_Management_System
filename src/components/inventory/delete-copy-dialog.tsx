"use client";

import React, { useState, useTransition } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteBookCopyAction } from "@/app/actions/inventory";
import type { BookCopy } from "@/types";
import { Button } from "@/components/ui/button";

interface DeleteCopyDialogProps {
  copy: BookCopy;
  bookTitle: string;
}

export function DeleteCopyDialog({ copy, bookTitle }: DeleteCopyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBorrowed = copy.status === "borrowed";

  const handleDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteBookCopyAction(copy.id, copy.bookId);
      if (result?.error) {
        setErrorMessage(result.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage(null);
          setIsOpen(true);
        }}
        aria-label={`Delete Copy ${copy.barcode}`}
        title="Delete Copy"
        className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
      >
        <Trash2 className="size-3" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-copy-dialog-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => !isPending && setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Modal */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 id="delete-copy-dialog-title" className="text-base font-bold text-zinc-900">
                  Delete Physical Copy
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Are you sure you want to remove copy{" "}
                  <code className="font-mono font-bold text-zinc-800">{copy.barcode}</code> of{" "}
                  <strong className="text-zinc-800">&ldquo;{bookTitle}&rdquo;</strong> from inventory?
                </p>
              </div>
            </div>

            {isBorrowed && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1"
              >
                <div className="font-semibold">Copy is currently checked out</div>
                <p>
                  This copy has an active loan. You must process the book return at the circulation
                  desk before it can be removed.
                </p>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 leading-relaxed"
              >
                {errorMessage}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending || isBorrowed}
                onClick={handleDelete}
                className="gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
