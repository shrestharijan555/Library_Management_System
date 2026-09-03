// src/components/reports/csv-export-button.tsx
"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvExportButtonProps {
  filename: string;
  getData: () => Promise<Array<Record<string, unknown>>> | Array<Record<string, unknown>>;
  label?: string;
}

export function CsvExportButton({
  filename,
  getData,
  label = "Export CSV",
}: CsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const rows = await getData();
      if (!rows || rows.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Generate CSV content
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((header) => {
              const val = row[header];
              if (val === null || val === undefined) return '""';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ];

      const csvBlob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="text-xs h-8 border-zinc-300 dark:border-zinc-700"
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
      ) : (
        <Download className="w-3.5 h-3.5 mr-1.5" />
      )}
      {label}
    </Button>
  );
}
