"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDetailTable, type ReportColumn } from "@/components/reports/report-detail-table";
import { useReportDetail } from "@/components/reports/use-report-detail";
import { formatCurrency } from "@/components/shared/stat-card";
import { reportsApi } from "@/lib/api";
import type { AutostrikeDetailResponse, AutostrikeDetailRow, ReportFilters } from "@/lib/types";

interface AutostrikeTabProps {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
  filters: ReportFilters;
  enabled: boolean;
}

const columns: ReportColumn<AutostrikeDetailRow>[] = [
  { key: "request_reference", label: "Reference", sortable: true },
  { key: "loan_id", label: "Loan ID", sortable: true },
  { key: "agent_id", label: "Agent", sortable: true },
  { key: "requested_principal", label: "Principal Req.", format: "currency", sortable: true },
  { key: "requested_surcharge", label: "Surcharge Req.", format: "currency" },
  { key: "external_response_code", label: "Resp. Code" },
  { key: "payment_recorded", label: "Payment?", format: "boolean" },
  { key: "status", label: "Status", sortable: true },
  { key: "error", label: "Error" },
  { key: "attempted_at", label: "Attempted At", format: "date", sortable: true },
];

export function AutostrikeTab({ dateFrom, dateTo, granularity, filters, enabled }: AutostrikeTabProps) {
  const { data, isLoading, pagination, onPageChange, onPageSizeChange } =
    useReportDetail<AutostrikeDetailResponse>({
      endpoint: "autostrike",
      dateFrom,
      dateTo,
      granularity,
      filters,
      enabled,
    });

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    return reportsApi.exportDetail("autostrike", format, dateFrom, dateTo, "Africa/Kampala", (granularity as never) || "day", filters);
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Attempts</p>
            <p className="text-2xl font-bold">{metrics?.attempts || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-emerald-600">{metrics?.successful_attempts || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-destructive">{metrics?.failed_attempts || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">{metrics?.success_rate || 0}%</p>
            <p className="text-xs text-muted-foreground">
              Recovered: {formatCurrency(metrics?.amount_recovered || 0, "UGX", true)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Autostrike Attempts</CardTitle>
          <CardDescription>All autostrike attempts in the selected period</CardDescription>
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
            exportFilename="autostrike-report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
