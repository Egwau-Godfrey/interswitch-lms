"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDetailTable, type ReportColumn } from "@/components/reports/report-detail-table";
import { useReportDetail } from "@/components/reports/use-report-detail";
import { formatCurrency } from "@/components/shared/stat-card";
import { reportsApi } from "@/lib/api";
import type { ReportFilters, RevenueDetailResponse, RevenueDetailRow } from "@/lib/types";

interface RevenueTabProps {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
  filters: ReportFilters;
  enabled: boolean;
}

const columns: ReportColumn<RevenueDetailRow>[] = [
  { key: "payment_id", label: "Payment ID" },
  { key: "loan_id", label: "Loan ID", sortable: true },
  { key: "agent_id", label: "Agent", sortable: true },
  { key: "payment_date", label: "Date", format: "date", sortable: true },
  { key: "application_fee", label: "App Fee", format: "currency" },
  { key: "interest", label: "Interest", format: "currency" },
  { key: "penalty", label: "Penalty", format: "currency" },
  { key: "surcharge", label: "Surcharge", format: "currency" },
  { key: "gross_revenue", label: "Gross Revenue", format: "currency", sortable: true },
  { key: "interswitch_amount", label: "Interswitch 30%", format: "currency" },
  { key: "qriscorp_amount", label: "Qriscorp 70%", format: "currency" },
];

export function RevenueTab({ dateFrom, dateTo, granularity, filters, enabled }: RevenueTabProps) {
  const { data, isLoading, pagination, onPageChange, onPageSizeChange } =
    useReportDetail<RevenueDetailResponse>({
      endpoint: "revenue",
      dateFrom,
      dateTo,
      granularity,
      filters,
      enabled,
    });

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    return reportsApi.exportDetail("revenue", format, dateFrom, dateTo, "Africa/Kampala", (granularity as never) || "day", filters);
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Gross Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.gross_revenue || 0, "UGX", true)}</p>
            <p className="text-xs text-muted-foreground">Collected revenue only</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Interswitch Share (30%)</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.interswitch_amount || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Qriscorp Share (70%)</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics?.qriscorp_amount || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Accrued Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.accrued_revenue || 0, "UGX", true)}</p>
            <p className="text-xs text-muted-foreground">Potential (uncollected)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Split Detail</CardTitle>
          <CardDescription>Per-payment revenue breakdown with partner split</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportDetailTable
            columns={columns}
            rows={data?.detail || []}
            pagination={pagination || undefined}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            isLoading={isLoading}
            onExportCsv={() => handleExport("csv")}
            onExportExcel={() => handleExport("xlsx")}
            onExportPdf={() => handleExport("pdf")}
            exportFilename="revenue-split-report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
