// src/components/my-loans/my-reservations.tsx
"use client";

import React, { useState, useTransition } from "react";
import {
  ListOrdered,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cancelReservationAction } from "@/app/actions/circulation";

export interface MyReservationItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  authors: string[];
  reservationDate: string;
  queuePosition: number;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
}

interface MyReservationsProps {
  reservations: MyReservationItem[];
}

export function MyReservations({ reservations: initial }: MyReservationsProps) {
  const [list, setList] = useState<MyReservationItem[]>(initial);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [, startTransition] = useTransition();

  const handleCancel = (resId: string) => {
    setCancellingId(resId);
    setNotice(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("reservationId", resId);

      const res = await cancelReservationAction(null, formData);
      setCancellingId(null);

      if (res.error) {
        setNotice({ text: res.error, type: "error" });
      } else {
        setNotice({ text: "Reservation cancelled.", type: "success" });
        setList((prev) => prev.filter((r) => r.id !== resId));
      }
    });
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={`p-3.5 rounded-xl text-sm flex items-center gap-2 animate-in fade-in ${
            notice.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {list.length === 0 ? (
        <Card className="border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <ListOrdered className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">No Active Holds</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            You don&apos;t have any books on reserve. When all copies of a popular book are checked out, you can reserve it from the catalogue.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((res) => (
            <Card
              key={res.id}
              className="border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="p-4 flex gap-4">
                {res.bookCoverUrl ? (
                  <img
                    src={res.bookCoverUrl}
                    alt={res.bookTitle}
                    className="w-16 h-24 object-cover rounded-md shadow-xs border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-zinc-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/catalogue/${res.bookId}`}
                        className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 text-sm line-clamp-1"
                      >
                        {res.bookTitle}
                      </Link>
                      <Badge
                        variant={res.status === "pending" ? "warning" : "success"}
                        className="capitalize text-[10px]"
                      >
                        {res.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {res.authors.join(", ") || "Unknown Author"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-zinc-500">Waitlist Position:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      #{res.queuePosition} in queue
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      Reserved: {new Date(res.reservationDate).toLocaleDateString()}
                    </span>

                    {res.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(res.id)}
                        disabled={cancellingId === res.id}
                        className="h-6 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2"
                      >
                        {cancellingId === res.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Cancel Hold"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
