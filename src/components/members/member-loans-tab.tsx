import React from "react";
import Link from "next/link";
import { BookOpen, Clock, CheckCircle2, AlertCircle, Barcode, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface MemberLoanItem {
  id: string;
  bookId: string;
  bookTitle: string;
  copyBarcode: string;
  issueDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: "active" | "returned" | "overdue";
  renewalCount: number;
}

interface MemberLoansTabProps {
  activeLoans: MemberLoanItem[];
  loanHistory: MemberLoanItem[];
}

export function MemberLoansTab({ activeLoans, loanHistory }: MemberLoansTabProps) {
  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Current Active Loans Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-900">
              Current Active Checkouts ({activeLoans.length})
            </h3>
          </div>
          {activeLoans.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeLoans.filter((l) => isOverdue(l.dueDate)).length > 0
                ? "Contains Overdue Item"
                : "All on schedule"}
            </Badge>
          )}
        </div>

        {activeLoans.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No active book loans currently checked out by this member.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2.5 pl-3 pr-3">Book Title</th>
                  <th className="px-3 py-2.5">Copy Barcode</th>
                  <th className="px-3 py-2.5">Issued Date</th>
                  <th className="px-3 py-2.5">Due Date</th>
                  <th className="px-3 py-2.5">Renewals</th>
                  <th className="py-2.5 pl-3 pr-3 text-right">Loan Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {activeLoans.map((loan) => {
                  const overdue = isOverdue(loan.dueDate);
                  return (
                    <tr key={loan.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-2.5 pl-3 pr-3 font-semibold text-zinc-900">
                        <Link
                          href={`/catalogue/${loan.bookId}`}
                          className="hover:underline hover:text-zinc-950 flex items-center gap-1.5"
                        >
                          <BookOpen className="size-3.5 text-zinc-400 shrink-0" />
                          <span>{loan.bookTitle}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-zinc-800">
                        <div className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px]">
                          <Barcode className="size-3 text-zinc-400" />
                          <span>{loan.copyBarcode}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">
                        {new Date(loan.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={overdue ? "font-bold text-red-600" : "font-medium text-zinc-800"}>
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {loan.renewalCount}x
                      </td>
                      <td className="py-2.5 pl-3 pr-3 text-right">
                        {overdue ? (
                          <Badge variant="destructive" className="gap-1 text-[10px]">
                            <AlertCircle className="size-3" />
                            <span>Overdue</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="gap-1 text-[10px]">
                            <Clock className="size-3" />
                            <span>Active</span>
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Circulation History Card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-900">
              Past Circulation History ({loanHistory.length})
            </h3>
          </div>
        </div>

        {loanHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No past returned loans on record for this member.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 bg-zinc-50/50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2.5 pl-3 pr-3">Book Title</th>
                  <th className="px-3 py-2.5">Barcode</th>
                  <th className="px-3 py-2.5">Issued Date</th>
                  <th className="px-3 py-2.5">Returned Date</th>
                  <th className="py-2.5 pl-3 pr-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {loanHistory.map((loan) => (
                  <tr key={loan.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-2.5 pl-3 pr-3 font-semibold text-zinc-900">
                      <Link
                        href={`/catalogue/${loan.bookId}`}
                        className="hover:underline hover:text-zinc-950 flex items-center gap-1.5"
                      >
                        <BookOpen className="size-3.5 text-zinc-400 shrink-0" />
                        <span>{loan.bookTitle}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-zinc-600">
                      {loan.copyBarcode}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">
                      {new Date(loan.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">
                      {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2.5 pl-3 pr-3 text-right">
                      <Badge variant="outline" className="gap-1 text-[10px] text-zinc-600">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        <span>Returned</span>
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
