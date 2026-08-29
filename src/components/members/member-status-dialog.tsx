"use client";

import React, { useState, useTransition } from "react";
import { ShieldAlert, CheckCircle2, AlertOctagon, UserX, Loader2 } from "lucide-react";
import { updateMemberStatusAction } from "@/app/actions/members";
import type { UserStatus } from "@/types";
import { Button } from "@/components/ui/button";

interface MemberStatusDialogProps {
  memberId: string;
  memberName: string;
  currentStatus: UserStatus;
  isSelf: boolean;
}

export function MemberStatusDialog({
  memberId,
  memberName,
  currentStatus,
  isSelf,
}: MemberStatusDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<UserStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setTargetStatus(currentStatus);
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleUpdate = () => {
    if (targetStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateMemberStatusAction(memberId, targetStatus);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isSelf}
        onClick={handleOpen}
        className="gap-1.5 shadow-xs"
      >
        <ShieldAlert className="size-3.5 text-zinc-600" />
        <span>Manage Status</span>
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-status-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => !isPending && setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 border-b border-zinc-100 pb-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 shrink-0">
                <ShieldAlert className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h3 id="member-status-title" className="text-base font-bold text-zinc-900">
                  Account Standing & Status
                </h3>
                <p className="text-xs text-zinc-500">
                  Modify system access permissions for <strong className="text-zinc-800">{memberName}</strong>.
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

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTargetStatus("active")}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    targetStatus === "active"
                      ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">Active</span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                        Default
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Unrestricted access. Member can borrow books, hold reservations, and log in.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetStatus("suspended")}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    targetStatus === "suspended"
                      ? "border-red-600 bg-red-50/50 ring-1 ring-red-600"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <AlertOctagon className="size-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-900">Suspended</span>
                    <p className="text-[11px] text-zinc-500">
                      Access revoked due to overdue violations or manual discipline. Login is rejected.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetStatus("inactive")}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    targetStatus === "inactive"
                      ? "border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <UserX className="size-4 text-zinc-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-900">Inactive / Archived</span>
                    <p className="text-[11px] text-zinc-500">
                      Graduated or departed members. Historical loan and fine logs remain preserved.
                    </p>
                  </div>
                </button>
              </div>
            </div>

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

              <Button
                type="button"
                size="sm"
                disabled={isPending || targetStatus === currentStatus}
                onClick={handleUpdate}
                className="gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Apply Status</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
