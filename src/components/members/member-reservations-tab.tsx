import React from "react";
import Link from "next/link";
import { Bookmark, Clock, CheckCircle2, XCircle, AlertCircle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface MemberReservationItem {
  id: string;
  bookId: string;
  bookTitle: string;
  reservationDate: Date;
  expiryDate: Date | null;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
  queuePosition: number;
}

interface MemberReservationsTabProps {
  reservations: MemberReservationItem[];
}

export function MemberReservationsTab({ reservations }: MemberReservationsTabProps) {
  const getReservationStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="info" className="gap-1 text-[10px]">
            <Clock className="size-3" />
            <span>Active Hold</span>
          </Badge>
        );
      case "fulfilled":
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle2 className="size-3" />
            <span>Fulfilled</span>
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] text-zinc-500">
            <XCircle className="size-3" />
            <span>Cancelled</span>
          </Badge>
        );
      case "expired":
      default:
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <AlertCircle className="size-3" />
            <span>Expired</span>
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="size-4 text-zinc-700" />
          <h3 className="text-sm font-bold text-zinc-900">
            Title Hold Requests & Reservations ({reservations.length})
          </h3>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-400">
          No hold reservations placed by this member.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="py-2.5 pl-3 pr-3">Reserved Title</th>
                <th className="px-3 py-2.5">Hold Placed</th>
                <th className="px-3 py-2.5">Expiry Date</th>
                <th className="px-3 py-2.5">Queue Position</th>
                <th className="py-2.5 pl-3 pr-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-2.5 pl-3 pr-3 font-semibold text-zinc-900">
                    <Link
                      href={`/catalogue/${res.bookId}`}
                      className="hover:underline hover:text-zinc-950 flex items-center gap-1.5"
                    >
                      <BookOpen className="size-3.5 text-zinc-400 shrink-0" />
                      <span>{res.bookTitle}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">
                    {new Date(res.reservationDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">
                    {res.expiryDate ? new Date(res.expiryDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-800">
                    #{res.queuePosition} in queue
                  </td>
                  <td className="py-2.5 pl-3 pr-3 text-right">
                    {getReservationStatusBadge(res.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
