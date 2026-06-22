"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { ExportButton } from "@/components/shared/export-button";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { useApi } from "@/hooks/use-api";
import { useApiAuth } from "@/hooks/use-api-auth";
import { reportsApi } from "@/lib/api";
import type { ReportExportRequest, ReportFilters, ReportGranularity, ReportSummaryResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReportFiltersSheet } from "@/components/reports/report-filters-sheet";
import { DisbursementsTab } from "@/components/reports/disbursements-tab";
import { CollectionsTab } from "@/components/reports/collections-tab";
import { RevenueTab } from "@/components/reports/revenue-tab";
import { RiskTab } from "@/components/reports/risk-tab";
import { AutostrikeTab } from "@/components/reports/autostrike-tab";
import { AgentsTab } from "@/components/reports/agents-tab";

const quickRanges = [
  { label: "Today", value: "today" },
  { label: "24h", value: "24h" },
  { label: "3d", value: "3d" },
  { label: "7d", value: "7d" },
  { label: "1m", value: "1m" },
  { label: "1q", value: "1q" },
  { label: "Custom", value: "custom" },
] as const;

type QuickRange = (typeof quickRanges)[number]["value"];

interface ReportSummaryPageProps {
  basePath: "/super-admin" | "/user";
}

function toIso(date: Date | undefined, endOfDay = false) {
  if (!date) return undefined;
  const cloned = new Date(date);
  if (endOfDay) {
    cloned.setHours(23, 59, 59, 999);
  } else {
    cloned.setHours(0, 0, 0, 0);
  }
  return cloned.toISOString();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildExportPayload(
  report: ReportSummaryResponse,
  exportFormat: "csv" | "xlsx" | "pdf",
  filters: ReportFilters,
): ReportExportRequest {
  return {
    report_type: "summary",
    export_format: exportFormat,
    date_from: report.period.date_from,
    date_to: report.period.date_to,
    timezone: report.period.timezone,
    granularity: report.period.granularity,
    filters,
  };
}

export function ReportSummaryPage({ basePath }: ReportSummaryPageProps) {
  const { status, isReady } = useApiAuth();
  const [quickRange, setQuickRange] = React.useState<QuickRange>("7d");
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [dateTo, setDateTo] = React.useState<Date | undefined>(() => new Date());
  const [granularity, setGranularity] = React.useState<ReportGranularity>("day");
  const [activeTab, setActiveTab] = React.useState("summary");
  const [filters, setFilters] = React.useState<ReportFilters>({});

  React.useEffect(() => {
    if (quickRange === "custom") return;
    const now = new Date();
    let from = new Date(now);
    if (quickRange === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (quickRange === "24h") {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (quickRange === "3d") {
      from = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    } else if (quickRange === "7d") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (quickRange === "1m") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (quickRange === "1q") {
      from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }
    setDateFrom(from);
    setDateTo(now);
  }, [quickRange]);

  const effectiveDateFrom = dateFrom;
  const effectiveDateTo = dateTo || (dateFrom ? new Date(dateFrom) : undefined);
  if (effectiveDateTo) {
    effectiveDateTo.setHours(23, 59, 59, 999);
  }

  const isoFrom = toIso(effectiveDateFrom);
  const isoTo = toIso(effectiveDateTo, true);

  const { data: report, isLoading, error, refetch } = useApi(
    () =>
      reportsApi.getSummary({
        date_from: isoFrom,
        date_to: isoTo,
        timezone: "Africa/Kampala",
        granularity,
        agent_id: filters.agent_id,
        product_id: filters.product_id,
        loan_type: filters.loan_type,
        status: filters.status,
        channel: filters.channel,
        risk_level: filters.risk_level,
      }),
    [dateFrom, dateTo, granularity, JSON.stringify(filters), isReady],
    {
      enabled: status === "authenticated" && isReady,
      cacheKey: `report-summary-${isoFrom}-${isoTo}-${granularity}-${JSON.stringify(filters)}`,
    }
  );

  const metrics = report?.metrics;
  const revenue = report?.revenue_split;

  const trendData = React.useMemo(
    () =>
      (report?.buckets || []).map((bucket) => ({
        ...bucket,
        disbursed: Number(bucket.disbursed),
        collected: Number(bucket.collected),
        revenue: Number(bucket.revenue),
      })),
    [report]
  );

  const revenueComponentData = React.useMemo(
    () => [
      { name: "Application Fee", value: revenue?.application_fee_revenue || 0, color: "#004B91" },
      { name: "Interest", value: revenue?.interest_revenue || 0, color: "#10B981" },
      { name: "Penalty", value: revenue?.penalty_revenue || 0, color: "#F59E0B" },
      { name: "Surcharge", value: revenue?.surcharge_revenue || 0, color: "#EF4444" },
    ],
    [revenue]
  );

  const partnerSplitData = React.useMemo(
    () => [
      { name: "Interswitch 30%", value: revenue?.interswitch_amount || 0, color: "#004B91" },
      { name: "Qriscorp 70%", value: revenue?.qriscorp_amount || 0, color: "#10B981" },
    ],
    [revenue]
  );

  const channelData = React.useMemo(
    () => (report?.collections.by_channel || []).map((item) => ({ ...item })),
    [report]
  );

  const overdueAgingData = React.useMemo(
    () => (report?.risk.overdue_aging || []).map((item) => ({ ...item })),
    [report]
  );

  const handleSummaryExport = async (exportFormat: "csv" | "xlsx" | "pdf"): Promise<Blob> => {
    if (!report) {
      toast.error("Report data is not ready");
      throw new Error("Report data is not ready");
    }
    try {
      const blob = await reportsApi.exportSummary(buildExportPayload(report, exportFormat, filters));
      const extension = exportFormat === "xlsx" ? "xlsx" : exportFormat;
      downloadBlob(blob, `report-summary_${report.period.date_from.slice(0, 10)}_${report.period.date_to.slice(0, 10)}.${extension}`);
      toast.success(`${extension.toUpperCase()} export generated`);
      return blob;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
      throw err instanceof Error ? err : new Error("Export failed");
    }
  };

  const kpis = [
    { label: "Total Disbursed", value: metrics?.total_disbursed || 0, description: `${metrics?.disbursement_count || 0} loans`, tone: "blue" },
    { label: "Total Collected", value: metrics?.total_collected || 0, description: `${metrics?.collection_count || 0} payments`, tone: "green" },
    { label: "Gross Revenue", value: metrics?.total_revenue || 0, description: "Collected revenue only", tone: "purple" },
    { label: "Interswitch Share", value: metrics?.interswitch_share || 0, description: "30% of collected revenue", tone: "blue" },
    { label: "Qriscorp Share", value: metrics?.qriscorp_share || 0, description: "70% of collected revenue", tone: "green" },
    { label: "Outstanding", value: metrics?.total_outstanding || 0, description: `${metrics?.active_loans_count || 0} active loans`, tone: "amber" },
    { label: "Overdue", value: metrics?.overdue_amount || 0, description: `${metrics?.overdue_loans_count || 0} overdue loans`, tone: "orange" },
    { label: "ISW Wallet", value: metrics?.isw_wallet_balance || 0, description: "Interswitch wallet balance", tone: "violet", icon: Wallet },
  ];

  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "disbursements", label: "Disbursements" },
    { id: "collections", label: "Collections" },
    { id: "revenue", label: "Revenue Split" },
    { id: "risk", label: "Risk & Defaulters" },
    { id: "autostrike", label: "Autostrike" },
    { id: "agents", label: "Agents" },
  ];

  const tabEnabled = status === "authenticated" && isReady && Boolean(isoFrom && isoTo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Portfolio, collections, revenue split, risk, autostrike, and agent performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {activeTab === "summary" && (
            <ExportButton
              filename="report-summary"
              disabled={!report || isLoading}
              onExportCsv={() => handleSummaryExport("csv")}
              onExportExcel={() => handleSummaryExport("xlsx")}
              onExportPdf={() => handleSummaryExport("pdf")}
            />
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.value}
                variant={quickRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setQuickRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
            <DateRangePicker from={dateFrom} to={dateTo} onSelect={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
              setQuickRange("custom");
            }} />
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Granularity</label>
              <select
                value={granularity}
                onChange={(event) => setGranularity(event.target.value as ReportGranularity)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="hour">Hour</option>
                <option value="day">Day</option>
                <option value="3_day">3 Days</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>
            <ReportFiltersSheet filters={filters} onApply={setFilters} disabled={!tabEnabled} />
          </div>
          {report && (
            <p className="text-xs text-muted-foreground">
              Showing {formatDate(report.period.date_from, "long")} to {formatDate(report.period.date_to, "long")} · {report.period.timezone}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button key={tab.id} variant={activeTab === tab.id ? "default" : "outline"} size="sm" onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "summary" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon || Download;
              const toneClasses: Record<string, string> = {
                blue: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
                green: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
                purple: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
                amber: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
                orange: "from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30",
                violet: "from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30",
              };
              return (
                <Card key={kpi.label} className={cn("relative overflow-hidden", toneClasses[kpi.tone])}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                    <div className="rounded-full bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpi.value, "UGX", true)}</div>
                    <p className="text-xs text-muted-foreground">{kpi.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Disbursement vs Collections</CardTitle>
                <CardDescription>Trend by selected granularity in UGX millions</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {isLoading ? <div className="flex h-full items-center justify-center text-muted-foreground">Loading report...</div> : (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bucket" />
                    <YAxis tickFormatter={(value) => `UGX ${(Number(value) / 1_000_000).toFixed(1)}M`} width={80} />
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value), "UGX", true), String(name)]} />
                    <Legend />
                    <Area type="monotone" dataKey="disbursed" name="Disbursed" stroke="#004B91" fill="#004B91" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collected Revenue Components</CardTitle>
                <CardDescription>Application fee, interest, penalty, and surcharge</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {isLoading ? <div className="flex h-full items-center justify-center text-muted-foreground">Loading report...</div> : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={revenueComponentData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(Number(value), "UGX", true)} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), "UGX")} />
                      <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                        {revenueComponentData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Partner Revenue Split</CardTitle>
                <CardDescription>Collected revenue split</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={partnerSplitData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {partnerSplitData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), "UGX")} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collections by Channel</CardTitle>
                <CardDescription>Payment channel breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="channel" />
                    <YAxis tickFormatter={(value) => formatCurrency(Number(value), "UGX", true)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), "UGX")} />
                    <Bar dataKey="amount" name="Collected" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overdue Aging</CardTitle>
                <CardDescription>Outstanding by days overdue</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overdueAgingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(Number(value), "UGX", true)} />
                    <YAxis dataKey="range" type="category" width={90} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), "UGX")} />
                    <Bar dataKey="amount" name="Amount" fill="#F59E0B" radius={[0, 6, 6, 0]}>
                      {overdueAgingData.map((entry, index) => <Cell key={index} fill={index > 2 ? "#EF4444" : "#F59E0B"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Period Buckets</CardTitle>
              <CardDescription>Trend summary by selected granularity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-left">
                    <tr>
                      <th className="p-3">Period</th>
                      <th className="p-3">Disbursed</th>
                      <th className="p-3">Collected</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Outstanding</th>
                      <th className="p-3">Active</th>
                      <th className="p-3">Overdue</th>
                      <th className="p-3">Defaulted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.buckets || []).map((bucket) => (
                      <tr key={bucket.bucket_start} className="border-b">
                        <td className="p-3">{bucket.bucket}</td>
                        <td className="p-3">{formatCurrency(bucket.disbursed, "UGX")}</td>
                        <td className="p-3">{formatCurrency(bucket.collected, "UGX")}</td>
                        <td className="p-3">{formatCurrency(bucket.revenue, "UGX")}</td>
                        <td className="p-3">{formatCurrency(bucket.outstanding, "UGX")}</td>
                        <td className="p-3">{bucket.active_loans}</td>
                        <td className="p-3">{bucket.overdue_loans}</td>
                        <td className="p-3">{bucket.defaulted_loans}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "disbursements" && (
        <DisbursementsTab dateFrom={isoFrom} dateTo={isoTo} granularity={granularity} filters={filters} enabled={tabEnabled} />
      )}
      {activeTab === "collections" && (
        <CollectionsTab dateFrom={isoFrom} dateTo={isoTo} granularity={granularity} filters={filters} enabled={tabEnabled} />
      )}
      {activeTab === "revenue" && (
        <RevenueTab dateFrom={isoFrom} dateTo={isoTo} granularity={granularity} filters={filters} enabled={tabEnabled} />
      )}
      {activeTab === "risk" && (
        <RiskTab dateFrom={isoFrom} dateTo={isoTo} granularity={granularity} filters={filters} enabled={tabEnabled} />
      )}
      {activeTab === "autostrike" && (
        <AutostrikeTab dateFrom={isoFrom} dateTo={isoTo} granularity={granularity} filters={filters} enabled={tabEnabled} />
      )}
      {activeTab === "agents" && (
        <AgentsTab dateFrom={isoFrom} dateTo={isoTo} granularity={granularity} filters={filters} enabled={tabEnabled} />
      )}
    </div>
  );
}
