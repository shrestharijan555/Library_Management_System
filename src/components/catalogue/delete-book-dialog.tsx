"use client";

import React, { useState, useTransition } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteBookAction } from "@/app/actions/catalogue";
import { Button } from "@/components/ui/button";

interface DeleteBookDialogProps {
  bookId: string;
  bookTitle: string;
  variant?: "icon" | "button";
}

export function DeleteBookDialog({
  bookId,
  bookTitle,
  variant = "icon",
}: DeleteBookDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteBookAction(bookId);
      if (result?.error) {
        setErrorMessage(result.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setIsOpen(true);
          }}
          aria-label={`Delete ${bookTitle}`}
          title="Delete Title"
          className="flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
        >
          <Trash2 className="size-3" />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setErrorMessage(null);
            setIsOpen(true);
          }}
          className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
        >
          <Trash2 className="size-3.5" />
          <span>Delete Book</span>
        </Button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
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
                <h3
                  id="delete-dialog-title"
                  className="text-base font-bold text-zinc-900"
                >
                  Delete Catalogue Title
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="text-zinc-900">&ldquo;{bookTitle}&rdquo;</strong>?
                  This action cannot be undone and will remove all physical copy records.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
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
                disabled={isPending}
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
