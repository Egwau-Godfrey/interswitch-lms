"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDetailTable, type ReportColumn } from "@/components/reports/report-detail-table";
import { useReportDetail } from "@/components/reports/use-report-detail";
import { formatCurrency } from "@/components/shared/stat-card";
import { reportsApi } from "@/lib/api";
import type { ReportFilters, RiskDetailResponse, RiskDetailRow } from "@/lib/types";

interface RiskTabProps {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
  filters: ReportFilters;
  enabled: boolean;
}

const columns: ReportColumn<RiskDetailRow>[] = [
  { key: "loan_id", label: "Loan ID", sortable: true },
  { key: "agent_id", label: "Agent", sortable: true },
  { key: "loan_type", label: "Type", sortable: true },
  { key: "principal_amount", label: "Principal", format: "currency", sortable: true },
  { key: "outstanding_balance", label: "Outstanding", format: "currency", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "is_overdue", label: "Overdue", format: "boolean" },
  { key: "days_overdue", label: "Days Overdue", sortable: true },
  { key: "due_date", label: "Due Date", format: "date", sortable: true },
];

export function RiskTab({ dateFrom, dateTo, granularity, filters, enabled }: RiskTabProps) {
  const { data, isLoading, pagination, onPageChange, onPageSizeChange } =
    useReportDetail<RiskDetailResponse>({
      endpoint: "risk",
      dateFrom,
      dateTo,
      granularity,
      filters,
      enabled,
    });

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    return reportsApi.exportDetail("risk", format, dateFrom, dateTo, "Africa/Kampala", (granularity as never) || "day", filters);
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overdue Loans</p>
            <p className="text-2xl font-bold text-amber-600">{metrics?.overdue_loans_count || 0}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(metrics?.overdue_amount || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Defaulted Loans</p>
            <p className="text-2xl font-bold text-destructive">{metrics?.defaulted_loans_count || 0}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(metrics?.defaulted_amount || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">PAR 30</p>
            <p className="text-2xl font-bold">{metrics?.par_30_percent || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Default Rate</p>
            <p className="text-2xl font-bold">{metrics?.default_rate || 0}%</p>
            <p className="text-xs text-muted-foreground">Rule: {metrics?.default_days || 90} days</p>
          </CardContent>
        </Card>
      </div>

      {data && data.overdue_aging.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue Aging</CardTitle>
            <CardDescription>Outstanding by days overdue bucket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="p-3">Range</th>
                    <th className="p-3">Count</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.overdue_aging.map((bucket) => (
                    <tr key={bucket.range} className="border-b">
                      <td className="p-3 font-medium">{bucket.range}</td>
                      <td className="p-3">{bucket.count}</td>
                      <td className="p-3">{formatCurrency(bucket.amount, "UGX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Defaulter & Overdue Detail</CardTitle>
          <CardDescription>Loans that are overdue or written off</CardDescription>
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
            exportFilename="risk-defaulters-report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
