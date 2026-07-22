"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardHeader, type QuickRange } from "@/components/dashboard/dashboard-header";
import { KpiCardsRow } from "@/components/dashboard/kpi-cards-row";
import { RevenueBalanceCard } from "@/components/dashboard/revenue-balance-card";
import { CollectionsBreakdownCard } from "@/components/dashboard/collections-breakdown-card";
import { RevenueSplitCard } from "@/components/dashboard/revenue-split-card";
import { DisbursementVsCollectionsChart } from "@/components/dashboard/disbursement-vs-collections-chart";
import { LoanStatusDistributionChart } from "@/components/dashboard/loan-status-distribution-chart";
import { OverdueAgingChart } from "@/components/dashboard/overdue-aging-chart";
import { ParMetricsCard } from "@/components/dashboard/par-metrics-card";
import { AtRiskAgentsWidget } from "@/components/dashboard/at-risk-agents-widget";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { ModelPerformanceWidget } from "@/components/dashboard/model-performance-widget";
import { useDashboardData } from "@/components/dashboard/use-dashboard-data";
import type { ReportFilters, ReportGranularity } from "@/lib/types";

interface DashboardOverviewProps {
  basePath: "/super-admin" | "/user";
}

const LOAN_TYPES = ["float", "pay_day"];
const LOAN_STATUSES = ["pending", "disbursed", "overdue", "cleared", "defaulted"];
const RISK_LEVELS = ["low", "medium", "high"];
const CHANNELS = ["wallet", "cash", "bank", "card", "unknown"];

function toIso(date: Date | undefined, endOfDay = false): string | undefined {
  if (!date) return undefined;
  const cloned = new Date(date);
  if (endOfDay) {
    cloned.setHours(23, 59, 59, 999);
  } else {
    cloned.setHours(0, 0, 0, 0);
  }
  return cloned.toISOString();
}

export function DashboardOverview({ basePath }: DashboardOverviewProps) {
  const [quickRange, setQuickRange] = React.useState<QuickRange>("all");
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);
  const [granularity, setGranularity] = React.useState<ReportGranularity>("day");
  const [filters, setFilters] = React.useState<ReportFilters>({});
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Update date range when quick range changes
  React.useEffect(() => {
    if (quickRange === "custom" || quickRange === "all") return;
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

  const effectiveDateTo = dateTo || (dateFrom ? new Date(dateFrom) : undefined);
  if (effectiveDateTo) {
    effectiveDateTo.setHours(23, 59, 59, 999);
  }

  // When "All Time" is selected, send no date params so the backend
  // defaults to its all-time range (epoch → now).
  const isAllTime = quickRange === "all";
  const isoFrom = isAllTime ? undefined : toIso(dateFrom);
  const isoTo = isAllTime ? undefined : toIso(effectiveDateTo, true);

  const { data, isLoading, error, refetch, isRefetching } = useDashboardData({
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
  });

  // Show error toast on API failure
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load dashboard data", {
        description: error.message || "Please try refreshing the page",
        duration: 5000,
      });
    }
  }, [error]);

  const handleRefresh = () => {
    refetch();
  };

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    setDateFrom(from);
    setDateTo(to);
    setQuickRange("custom");
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Failed to load dashboard data</h2>
        <p className="text-muted-foreground mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        quickRange={quickRange}
        onQuickRangeChange={setQuickRange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateRangeChange={handleDateRangeChange}
        granularity={granularity}
        onGranularityChange={setGranularity}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Dashboard Filters</SheetTitle>
          </SheetHeader>
          <DashboardFiltersContent
            filters={filters}
            onApply={(f) => {
              setFilters(f);
              setFiltersOpen(false);
            }}
            onClear={() => {
              setFilters({});
              setFiltersOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* KPI Cards (wallet loads independently) */}
      <KpiCardsRow kpis={data?.kpis} isLoading={isLoading} walletEnabled={true} />

      {/* Revenue Split Account Balance (loads independently) */}
      <RevenueBalanceCard />

      {/* Model Performance Widget */}
      <ModelPerformanceWidget basePath={basePath} />

      {/* Collections Breakdown + Revenue Split */}
      <div className="grid gap-4 md:grid-cols-2">
        <CollectionsBreakdownCard
          breakdown={data?.collections_breakdown}
          isLoading={isLoading}
        />
        <RevenueSplitCard revenue={data?.revenue_split} isLoading={isLoading} />
      </div>

      {/* Disbursement vs Collections + Loan Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <DisbursementVsCollectionsChart
            data={data?.disbursement_vs_collections}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-3">
          <LoanStatusDistributionChart
            data={data?.loan_status_distribution}
            isLoading={isLoading}
            basePath={basePath}
          />
        </div>
      </div>

      {/* Overdue Aging + PAR + At-Risk Agents */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <OverdueAgingChart data={data?.overdue_aging} isLoading={isLoading} />
        <ParMetricsCard metrics={data?.par_metrics} isLoading={isLoading} />
        <AtRiskAgentsWidget
          agents={data?.at_risk_agents}
          isLoading={isLoading}
          basePath={basePath}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivityFeed
        activities={data?.recent_activity}
        isLoading={isLoading}
        basePath={basePath}
      />
    </div>
  );
}

// Inline filters content component
interface DashboardFiltersContentProps {
  filters: ReportFilters;
  onApply: (filters: ReportFilters) => void;
  onClear: () => void;
}

function DashboardFiltersContent({ filters, onApply, onClear }: DashboardFiltersContentProps) {
  const [draft, setDraft] = React.useState<ReportFilters>(filters);

  React.useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const update = (key: keyof ReportFilters, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="space-y-4 px-4 pb-6">
      <div className="space-y-2">
        <Label htmlFor="agent_id">Agent ID</Label>
        <Input
          id="agent_id"
          value={draft.agent_id || ""}
          onChange={(e) => update("agent_id", e.target.value)}
          placeholder="e.g. 4QUL0002"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product_id">Product ID</Label>
        <Input
          id="product_id"
          value={draft.product_id || ""}
          onChange={(e) => update("product_id", e.target.value)}
          placeholder="Product UUID"
        />
      </div>
      <div className="space-y-2">
        <Label>Loan Type</Label>
        <div className="flex flex-wrap gap-2">
          {LOAN_TYPES.map((type) => (
            <Button
              key={type}
              variant={draft.loan_type === type ? "default" : "outline"}
              size="sm"
              onClick={() => update("loan_type", draft.loan_type === type ? "" : type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex flex-wrap gap-2">
          {LOAN_STATUSES.map((status) => (
            <Button
              key={status}
              variant={draft.status === status ? "default" : "outline"}
              size="sm"
              onClick={() => update("status", draft.status === status ? "" : status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Channel</Label>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((channel) => (
            <Button
              key={channel}
              variant={draft.channel === channel ? "default" : "outline"}
              size="sm"
              onClick={() => update("channel", draft.channel === channel ? "" : channel)}
            >
              {channel}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Risk Level</Label>
        <div className="flex flex-wrap gap-2">
          {RISK_LEVELS.map((level) => (
            <Button
              key={level}
              variant={draft.risk_level === level ? "default" : "outline"}
              size="sm"
              onClick={() => update("risk_level", draft.risk_level === level ? "" : level)}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClear}>
          Clear All
        </Button>
        <Button className="flex-1" onClick={() => onApply(draft)}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
