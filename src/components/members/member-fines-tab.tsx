import React from "react";
import { Receipt, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface MemberFineItem {
  id: string;
  amountCents: number;
  status: "unpaid" | "paid" | "waived";
  reason: string;
  createdAt: Date;
  paidAt: Date | null;
}

interface MemberFinesTabProps {
  fines: MemberFineItem[];
}

export function MemberFinesTab({ fines }: MemberFinesTabProps) {
  const unpaidTotalCents = fines
    .filter((f) => f.status === "unpaid")
    .reduce((acc, f) => acc + f.amountCents, 0);

  const getFineBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="success" className="gap-1 text-[10px]">
            <CheckCircle2 className="size-3" />
            <span>Paid</span>
          </Badge>
        );
      case "waived":
        return (
          <Badge variant="info" className="gap-1 text-[10px]">
            <ShieldCheck className="size-3" />
            <span>Waived</span>
          </Badge>
        );
      case "unpaid":
      default:
        return (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <AlertTriangle className="size-3" />
            <span>Unpaid Due</span>
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-zinc-700" />
          <h3 className="text-sm font-bold text-zinc-900">
            Fines & Financial Ledger ({fines.length})
          </h3>
        </div>

        {unpaidTotalCents > 0 ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
            <span>Outstanding Balance:</span>
            <span>${(unpaidTotalCents / 100).toFixed(2)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="size-3.5" />
            <span>Zero Outstanding Dues</span>
          </div>
        )}
      </div>

      {fines.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-400">
          No fine records or financial penalties on account for this member.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="py-2.5 pl-3 pr-3">Assessment Date</th>
                <th className="px-3 py-2.5">Reason / Violation</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Payment / Resolution Date</th>
                <th className="py-2.5 pl-3 pr-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {fines.map((fine) => (
                <tr key={fine.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-2.5 pl-3 pr-3 text-zinc-500 whitespace-nowrap">
                    {new Date(fine.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-900">
                    {fine.reason}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-zinc-900">
                    ${(fine.amountCents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">
                    {fine.paidAt ? new Date(fine.paidAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2.5 pl-3 pr-3 text-right">
                    {getFineBadge(fine.status)}
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
