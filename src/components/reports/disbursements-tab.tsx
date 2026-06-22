"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDetailTable, type ReportColumn } from "@/components/reports/report-detail-table";
import { useReportDetail } from "@/components/reports/use-report-detail";
import { formatCurrency } from "@/components/shared/stat-card";
import { reportsApi } from "@/lib/api";
import type { DisbursementDetailRow, DisbursementsDetailResponse, ReportFilters } from "@/lib/types";

interface DisbursementsTabProps {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
  filters: ReportFilters;
  enabled: boolean;
}

const columns: ReportColumn<DisbursementDetailRow>[] = [
  { key: "loan_id", label: "Loan ID", sortable: true },
  { key: "agent_id", label: "Agent", sortable: true },
  { key: "loan_type", label: "Type", sortable: true },
  { key: "principal_amount", label: "Principal", format: "currency", sortable: true },
  { key: "disbursed_amount", label: "Disbursed", format: "currency", sortable: true },
  { key: "application_fee", label: "App Fee", format: "currency" },
  { key: "outstanding_balance", label: "Outstanding", format: "currency", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "disbursed_at", label: "Disbursed At", format: "date", sortable: true },
  { key: "due_date", label: "Due Date", format: "date" },
];

export function DisbursementsTab({ dateFrom, dateTo, granularity, filters, enabled }: DisbursementsTabProps) {
  const { data, isLoading, onPageChange, onPageSizeChange, pagination } =
    useReportDetail<DisbursementsDetailResponse>({
      endpoint: "disbursements",
      dateFrom,
      dateTo,
      granularity,
      filters,
      enabled,
    });

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    return reportsApi.exportDetail("disbursements", format, dateFrom, dateTo, "Africa/Kampala", (granularity as never) || "day", filters);
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Disbursed</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.total_disbursed || 0, "UGX", true)}</p>
            <p className="text-xs text-muted-foreground">{metrics?.disbursement_count || 0} loans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average Loan Size</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.average_loan_size || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Products</p>
            <p className="text-2xl font-bold">{data?.by_product?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {data && data.by_product.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Disbursements by Product</CardTitle>
            <CardDescription>Breakdown across loan products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Disbursed</th>
                    <th className="p-3">Active</th>
                    <th className="p-3">Overdue</th>
                    <th className="p-3">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_product.map((product) => (
                    <tr key={product.product_id} className="border-b">
                      <td className="p-3 font-medium">{product.product_name}</td>
                      <td className="p-3">{formatCurrency(product.total_disbursed, "UGX")}</td>
                      <td className="p-3">{product.active_count}</td>
                      <td className="p-3">{product.overdue_count}</td>
                      <td className="p-3">{formatCurrency(product.total_outstanding, "UGX")}</td>
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
          <CardTitle>Loan-Level Disbursement Detail</CardTitle>
          <CardDescription>Individual disbursed loans in the selected period</CardDescription>
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
            exportFilename="disbursements-report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
