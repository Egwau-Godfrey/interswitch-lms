"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ExportButton } from "@/components/shared/export-button";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import type { ReportPagination } from "@/lib/types";

export interface ReportColumn<T> {
  key: keyof T & string;
  label: string;
  format?: "currency" | "date" | "text" | "boolean";
  sortable?: boolean;
}

interface ReportDetailTableProps<T> {
  columns: ReportColumn<T>[];
  rows: T[];
  pagination?: ReportPagination;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
  onExportCsv?: () => Promise<Blob>;
  onExportExcel?: () => Promise<Blob>;
  onExportPdf?: () => Promise<Blob>;
  exportFilename?: string;
  emptyMessage?: string;
}

function formatCell(value: unknown, format?: ReportColumn<unknown>["format"]): string {
  if (value === null || value === undefined) return "-";
  switch (format) {
    case "currency":
      return formatCurrency(Number(value), "UGX");
    case "date":
      return value ? formatDate(String(value), "long") : "-";
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

export function ReportDetailTable<T>({
  columns,
  rows,
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading,
  onExportCsv,
  onExportExcel,
  onExportPdf,
  exportFilename = "report-detail",
  emptyMessage = "No data for the selected period.",
}: ReportDetailTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const sortedRows = React.useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const hasExport = Boolean(onExportCsv || onExportExcel || onExportPdf);

  return (
    <div className="space-y-4">
      {hasExport && (
        <div className="flex justify-end">
          <ExportButton
            filename={exportFilename}
            onExportCsv={onExportCsv}
            onExportExcel={onExportExcel}
            onExportPdf={onExportPdf}
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="p-3 font-medium">
                  {col.sortable ? (
                    <button
                      className="flex items-center gap-1 hover:text-primary"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => (
                <tr key={index} className="border-b hover:bg-muted/30">
                  {columns.map((col) => (
                    <td key={col.key} className="p-3">
                      {formatCell((row as Record<string, unknown>)[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && onPageChange && onPageSizeChange && (
        <DataTablePagination
          page={pagination.page}
          pageSize={pagination.page_size}
          totalItems={pagination.total}
          totalPages={pagination.total_pages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
