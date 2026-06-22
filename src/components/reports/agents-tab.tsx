"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDetailTable, type ReportColumn } from "@/components/reports/report-detail-table";
import { useReportDetail } from "@/components/reports/use-report-detail";
import { formatCurrency } from "@/components/shared/stat-card";
import { reportsApi } from "@/lib/api";
import type { AgentsDetailResponse, ReportFilters } from "@/lib/types";

interface AgentsTabProps {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
  filters: ReportFilters;
  enabled: boolean;
}

type AgentRow = AgentsDetailResponse["detail"][number];

const columns: ReportColumn<AgentRow>[] = [
  { key: "agent_id", label: "Agent ID", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "loan_count", label: "Loans", sortable: true },
  { key: "total_disbursed", label: "Disbursed", format: "currency", sortable: true },
  { key: "total_collected", label: "Collected", format: "currency", sortable: true },
  { key: "outstanding_balance", label: "Outstanding", format: "currency", sortable: true },
  { key: "risk_level", label: "Risk", sortable: true },
  { key: "loan_limit", label: "Loan Limit", format: "currency" },
];

export function AgentsTab({ dateFrom, dateTo, granularity, filters, enabled }: AgentsTabProps) {
  const { data, isLoading, pagination, onPageChange, onPageSizeChange } =
    useReportDetail<AgentsDetailResponse>({
      endpoint: "agents",
      dateFrom,
      dateTo,
      granularity,
      filters,
      enabled,
    });

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    return reportsApi.exportDetail("agents", format, dateFrom, dateTo, "Africa/Kampala", (granularity as never) || "day", filters);
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Agents</p>
            <p className="text-2xl font-bold">{metrics?.agent_count || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Disbursed</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.total_disbursed || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.total_collected || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.total_outstanding || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Top agents by outstanding balance</CardDescription>
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
            exportFilename="agent-performance-report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
