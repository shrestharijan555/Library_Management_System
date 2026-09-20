// src/components/audit-logs/audit-logs-table.tsx
"use client";

import React, { useState, useTransition } from "react";
import {
  Search,
  History,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CsvExportButton } from "@/components/reports/csv-export-button";
import {
  getAuditLogsAction,
  getExportableAuditLogsAction,
  type AuditLogItem,
} from "@/app/actions/audit-logs";

interface AuditLogsTableProps {
  initialLogs: AuditLogItem[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialPage: number;
  initialPageSize: number;
}


export function AuditLogsTable({
  initialLogs,
  initialTotalCount,
  initialTotalPages,
  initialPage,
  initialPageSize,
}: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>(initialLogs);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const [, startTransition] = useTransition();

  const fetchLogs = (newPage = page, newCat = categoryFilter, newDate = dateRange, newSearch = search) => {
    startTransition(async () => {
      const res = await getAuditLogsAction({
        page: newPage,
        pageSize,
        entityType: newCat === "all" ? undefined : newCat,
        dateRange: newDate,
        search: newSearch,
      });

      setLogs(res.logs);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setPage(res.currentPage);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1, categoryFilter, dateRange, search);
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setPage(1);
    fetchLogs(1, cat, dateRange, search);
  };

  const handleDateChange = (range: string) => {
    setDateRange(range);
    setPage(1);
    fetchLogs(1, categoryFilter, range, search);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchLogs(newPage, categoryFilter, dateRange, search);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("return") || action.includes("paid") || action.includes("created")) {
      return "success" as const;
    }
    if (action.includes("waived") || action.includes("renewed") || action.includes("updated")) {
      return "info" as const;
    }
    if (action.includes("lost") || action.includes("deleted") || action.includes("rejected")) {
      return "destructive" as const;
    }
    if (action.includes("login") || action.includes("logout")) {
      return "default" as const;
    }
    return "secondary" as const;
  };

  const formatActionLabel = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Controls & Toolbar */}
      <Card className="border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search by actor, action, member code, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs sm:text-sm"
            />
          </form>

          {/* Date range filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Timeframe:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "7days", label: "Last 7 Days" },
                { id: "30days", label: "Last 30 Days" },
                { id: "this_month", label: "This Month" },
              ].map((dr) => (
                <Button
                  key={dr.id}
                  size="sm"
                  variant={dateRange === dr.id ? "default" : "outline"}
                  onClick={() => handleDateChange(dr.id)}
                  className="text-xs h-7.5 px-2.5"
                >
                  {dr.label}
                </Button>
              ))}
            </div>
          </div>

          {/* CSV Export */}
          <div>
            <CsvExportButton
              filename="institutional_audit_trail_report"
              getData={async () => {
                return await getExportableAuditLogsAction({
                  entityType: categoryFilter === "all" ? undefined : categoryFilter,
                  dateRange,
                });
              }}
              label="Export CSV"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 font-medium mr-1">Domain:</span>
          {[
            { id: "all", label: "All Events" },
            { id: "circulation", label: "Circulation & Loans" },
            { id: "fine", label: "Fines & Payments" },
            { id: "member", label: "Members" },
            { id: "catalogue", label: "Catalogue" },
            { id: "inventory", label: "Inventory" },
            { id: "auth", label: "Auth & Sessions" },
            { id: "system_settings", label: "System Config" },
          ].map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={categoryFilter === cat.id ? "default" : "secondary"}
              onClick={() => handleCategoryChange(cat.id)}
              className="text-xs h-7 px-2.5 capitalize"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                <th className="p-3.5 pl-4 w-40">Timestamp</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Context / Details</th>
                <th className="p-3.5 pr-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="p-3.5 pl-4 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3.5">
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-[11px] capitalize">
                        {formatActionLabel(log.action)}
                      </Badge>
                    </td>

                    {/* Actor */}
                    <td className="p-3.5">
                      {log.user ? (
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                            {log.user.fullName}
                          </span>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            {log.user.memberCode} &bull; <span className="capitalize">{log.user.role}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">System Automation</span>
                      )}
                    </td>

                    {/* Target Entity */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {log.entityType}
                        </Badge>
                        {log.entityId && (
                          <span className="font-mono text-xs text-zinc-500 truncate max-w-[120px]" title={log.entityId}>
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Details Snippet */}
                    <td className="p-3.5 text-xs text-zinc-600 dark:text-zinc-300 max-w-xs truncate font-mono">
                      {log.details || <span className="text-zinc-400 italic">No extra metadata</span>}
                    </td>

                    {/* Inspect Button */}
                    <td className="p-3.5 pr-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 text-xs px-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            Showing{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}
            </strong>{" "}
            to{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {Math.min(page * pageSize, totalCount)}
            </strong>{" "}
            of <strong className="text-zinc-900 dark:text-zinc-100">{totalCount}</strong> audit events
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="h-7 px-2.5 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="font-medium px-2">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-7 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Modal Drawer */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Audit Record Inspection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-900 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl">
                <div>
                  <span className="text-zinc-400 font-medium block">Action:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 font-medium block">Timestamp:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 font-medium block">Entity Type:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase">
                    {selectedLog.entityType}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 font-medium block">Entity ID:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {selectedLog.entityId || "N/A"}
                  </span>
                </div>
              </div>

              {selectedLog.user && (
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-400 font-medium block mb-1">Actor Profile:</span>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedLog.user.fullName} ({selectedLog.user.memberCode})
                  </div>
                  <div className="text-zinc-500 font-mono">
                    {selectedLog.user.email} &bull; Role: {selectedLog.user.role}
                  </div>
                </div>
              )}

              <div>
                <span className="text-zinc-400 font-medium block mb-1">Structured JSON Details:</span>
                <pre className="p-3 rounded-xl bg-zinc-900 text-zinc-100 text-[11px] overflow-x-auto max-h-48 font-mono">
                  {selectedLog.details
                    ? (() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                        } catch {
                          return selectedLog.details;
                        }
                      })()
                    : "{}"}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
