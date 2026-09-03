// src/components/circulation/reservations-desk-tab.tsx
"use client";

import React, { useState, useTransition } from "react";
import {
  BookOpen,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cancelReservationAction } from "@/app/actions/circulation";

export interface ReservationQueueItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  availableCopies: number;
  totalCopies: number;
  userId: string;
  userName: string;
  userEmail: string;
  memberCode: string;
  userRole: string;
  reservationDate: string;
  queuePosition: number;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
}

interface ReservationsDeskTabProps {
  initialReservations: ReservationQueueItem[];
}

export function ReservationsDeskTab({ initialReservations }: ReservationsDeskTabProps) {
  const [list, setList] = useState<ReservationQueueItem[]>(initialReservations);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [, startTransition] = useTransition();

  const handleCancel = (reservationId: string) => {
    setCancellingId(reservationId);
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("reservationId", reservationId);

      const res = await cancelReservationAction(null, formData);
      setCancellingId(null);

      if (res.error) {
        setMessage({ text: res.error, type: "error" });
      } else {
        setMessage({ text: res.message || "Reservation cancelled.", type: "success" });
        setList((prev) => prev.filter((r) => r.id !== reservationId));
      }
    });
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-3.5 rounded-xl text-sm flex items-center gap-2.5 animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-4 text-center w-16">Queue</th>
                <th className="p-3.5">Book Title & Availability</th>
                <th className="p-3.5">Reserving Member</th>
                <th className="p-3.5">Hold Placed</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    No active hold reservations currently in queue.
                  </td>
                </tr>
              ) : (
                list.map((res) => (
                  <tr
                    key={res.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* Position */}
                    <td className="p-3.5 pl-4 text-center">
                      <span className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-xs flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                        #{res.queuePosition}
                      </span>
                    </td>

                    {/* Book */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {res.bookCoverUrl ? (
                          <img
                            src={res.bookCoverUrl}
                            alt={res.bookTitle}
                            className="w-9 h-12 object-cover rounded shadow-xs shrink-0 border border-zinc-200 dark:border-zinc-700"
                          />
                        ) : (
                          <div className="w-9 h-12 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/catalogue/${res.bookId}`}
                            className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 truncate block max-w-[200px] sm:max-w-xs"
                          >
                            {res.bookTitle}
                          </Link>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            Available:{" "}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                              {res.availableCopies} / {res.totalCopies}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Member */}
                    <td className="p-3.5">
                      <div className="min-w-0">
                        <Link
                          href={`/members/${res.userId}`}
                          className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline truncate block"
                        >
                          {res.userName}
                        </Link>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{res.memberCode}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{res.userRole}</span>
                        </div>
                      </div>
                    </td>

                    {/* Hold Date */}
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400 text-xs">
                      {new Date(res.reservationDate).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <Badge
                        variant={
                          res.status === "pending"
                            ? "warning"
                            : res.status === "fulfilled"
                            ? "success"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {res.status}
                      </Badge>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 pr-4 text-right">
                      {res.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                          onClick={() => handleCancel(res.id)}
                          disabled={cancellingId === res.id}
                        >
                          {cancellingId === res.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Cancel Hold
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
