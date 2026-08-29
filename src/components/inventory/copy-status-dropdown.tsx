"use client";

import React, { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  Bookmark,
  Wrench,
  AlertCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { updateCopyStatusAction } from "@/app/actions/inventory";
import type { CopyStatus } from "@/types";

interface CopyStatusDropdownProps {
  copyId: string;
  bookId: string;
  currentStatus: CopyStatus;
  canManage: boolean;
}

const STATUS_CONFIG: Record<
  CopyStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string; icon: React.ElementType }
> = {
  available: {
    label: "Available",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
    icon: CheckCircle2,
  },
  borrowed: {
    label: "Checked Out",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
    icon: Clock,
  },
  reserved: {
    label: "Reserved",
    bgClass: "bg-sky-50",
    textClass: "text-sky-700",
    borderClass: "border-sky-200",
    icon: Bookmark,
  },
  maintenance: {
    label: "Maintenance",
    bgClass: "bg-orange-50",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
    icon: Wrench,
  },
  lost: {
    label: "Lost / Missing",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
    borderClass: "border-red-200",
    icon: AlertCircle,
  },
};

export function CopyStatusDropdown({
  copyId,
  bookId,
  currentStatus,
  canManage,
}: CopyStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.available;
  const ActiveIcon = activeConfig.icon;

  const handleStatusChange = (newStatus: CopyStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateCopyStatusAction(copyId, bookId, newStatus);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setIsOpen(false);
      }
    });
  };

  // If user is not authorized to manage inventory, render a read-only badge
  if (!canManage) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${activeConfig.bgClass} ${activeConfig.textClass} ${activeConfig.borderClass}`}
      >
        <ActiveIcon className="size-3" />
        <span>{activeConfig.label}</span>
      </span>
    );
  }

  const isBorrowed = currentStatus === "borrowed";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-950/20 ${
          activeConfig.bgClass
        } ${activeConfig.textClass} ${activeConfig.borderClass} hover:opacity-90`}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <ActiveIcon className="size-3" />
        )}
        <span>{activeConfig.label}</span>
        <ChevronDown className="size-2.5 opacity-60" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 z-50 mt-1.5 w-44 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
              Change Status
            </div>

            {errorMsg && (
              <div className="mx-2 my-1 rounded bg-red-50 p-2 text-[10px] text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="py-1">
              {(
                [
                  "available",
                  "maintenance",
                  "lost",
                  "reserved",
                ] as CopyStatus[]
              ).map((status) => {
                const conf = STATUS_CONFIG[status];
                const Icon = conf.icon;
                const isCurrent = status === currentStatus;
                const disabled = isBorrowed && status === "available";

                return (
                  <button
                    key={status}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleStatusChange(status)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? "bg-zinc-100 font-bold text-zinc-900"
                        : disabled
                        ? "opacity-40 cursor-not-allowed text-zinc-400"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <Icon className={`size-3.5 ${conf.textClass}`} />
                    <span className="flex-1">{conf.label}</span>
                    {isCurrent && (
                      <span className="size-1.5 rounded-full bg-zinc-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
