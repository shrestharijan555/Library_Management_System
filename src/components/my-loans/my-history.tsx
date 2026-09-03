// src/components/my-loans/my-history.tsx
"use client";

import React, { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface MyHistoryItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  authors: string[];
  barcode: string;
  issueDate: string;
  returnDate: string;
  renewals: number;
}

interface MyHistoryProps {
  history: MyHistoryItem[];
}

export function MyHistory({ history }: MyHistoryProps) {
  const [search, setSearch] = useState("");

  const filtered = history.filter((item) =>
    item.bookTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Search past returned books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-xs sm:text-sm"
        />
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-4">Book Title</th>
                <th className="p-3.5">Checked Out</th>
                <th className="p-3.5">Returned On</th>
                <th className="p-3.5 text-center">Renewals</th>
                <th className="p-3.5 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No borrowing history recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        {item.bookCoverUrl ? (
                          <img
                            src={item.bookCoverUrl}
                            alt={item.bookTitle}
                            className="w-8 h-11 object-cover rounded shadow-xs shrink-0 border border-zinc-200 dark:border-zinc-700"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/catalogue/${item.bookId}`}
                            className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 truncate max-w-xs block"
                          >
                            {item.bookTitle}
                          </Link>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {item.barcode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400 text-xs">
                      {new Date(item.issueDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400 text-xs">
                      {new Date(item.returnDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-center font-mono text-xs">{item.renewals}</td>
                    <td className="p-3.5 pr-4 text-right">
                      <Badge variant="secondary" className="text-[10px]">
                        Returned
                      </Badge>
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
