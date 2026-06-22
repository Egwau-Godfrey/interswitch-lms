"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportDetailTable, type ReportColumn } from "@/components/reports/report-detail-table";
import { useReportDetail } from "@/components/reports/use-report-detail";
import { formatCurrency } from "@/components/shared/stat-card";
import { reportsApi } from "@/lib/api";
import type { CollectionDetailRow, CollectionsDetailResponse, ReportFilters } from "@/lib/types";

interface CollectionsTabProps {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
  filters: ReportFilters;
  enabled: boolean;
}

const columns: ReportColumn<CollectionDetailRow>[] = [
  { key: "payment_reference", label: "Reference", sortable: true },
  { key: "loan_id", label: "Loan ID", sortable: true },
  { key: "agent_id", label: "Agent", sortable: true },
  { key: "amount", label: "Amount", format: "currency", sortable: true },
  { key: "channel", label: "Channel", sortable: true },
  { key: "principal", label: "Principal", format: "currency" },
  { key: "application_fee", label: "App Fee", format: "currency" },
  { key: "interest", label: "Interest", format: "currency" },
  { key: "penalty", label: "Penalty", format: "currency" },
  { key: "surcharge", label: "Surcharge", format: "currency" },
  { key: "payment_date", label: "Date", format: "date", sortable: true },
];

export function CollectionsTab({ dateFrom, dateTo, granularity, filters, enabled }: CollectionsTabProps) {
  const { data, isLoading, pagination, onPageChange, onPageSizeChange } =
    useReportDetail<CollectionsDetailResponse>({
      endpoint: "collections",
      dateFrom,
      dateTo,
      granularity,
      filters,
      enabled,
    });

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    return reportsApi.exportDetail("collections", format, dateFrom, dateTo, "Africa/Kampala", (granularity as never) || "day", filters);
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.total_collected || 0, "UGX", true)}</p>
            <p className="text-xs text-muted-foreground">{metrics?.collection_count || 0} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Principal Collected</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics?.total_principal_collected || 0, "UGX", true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Collection Rate</p>
            <p className="text-2xl font-bold">{metrics?.collection_rate || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Recovery Rate</p>
            <p className="text-2xl font-bold">{metrics?.recovery_rate || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {data && data.by_channel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Collections by Channel</CardTitle>
            <CardDescription>Payment channel breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Count</th>
                    <th className="p-3">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_channel.map((item) => (
                    <tr key={item.channel} className="border-b">
                      <td className="p-3 font-medium capitalize">{item.channel}</td>
                      <td className="p-3">{formatCurrency(item.amount, "UGX")}</td>
                      <td className="p-3">{item.count}</td>
                      <td className="p-3">{item.percentage}%</td>
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
          <CardTitle>Payment-Level Collection Detail</CardTitle>
          <CardDescription>Individual payments with allocation breakdown</CardDescription>
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
            exportFilename="collections-report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
