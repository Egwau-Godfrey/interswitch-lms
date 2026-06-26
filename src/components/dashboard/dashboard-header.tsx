"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { cn } from "@/lib/utils";
import type { ReportGranularity } from "@/lib/types";

const quickRanges = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "24h", value: "24h" },
  { label: "3d", value: "3d" },
  { label: "7d", value: "7d" },
  { label: "1m", value: "1m" },
  { label: "1q", value: "1q" },
  { label: "Custom", value: "custom" },
] as const;

export type QuickRange = (typeof quickRanges)[number]["value"];

const granularities: { label: string; value: ReportGranularity }[] = [
  { label: "Hourly", value: "hour" },
  { label: "Daily", value: "day" },
  { label: "3-Day", value: "3_day" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Quarterly", value: "quarter" },
];

interface DashboardHeaderProps {
  quickRange: QuickRange;
  onQuickRangeChange: (value: QuickRange) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  granularity: ReportGranularity;
  onGranularityChange: (value: ReportGranularity) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export function DashboardHeader({
  quickRange,
  onQuickRangeChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
  granularity,
  onGranularityChange,
  onRefresh,
  isRefreshing,
  onOpenFilters,
  activeFilterCount,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time portfolio metrics for Interswitch Loans.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick range buttons */}
        <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-1 overflow-x-auto">
          {quickRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onQuickRangeChange(range.value)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                quickRange === range.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Date range picker (visible when custom is selected) */}
        {quickRange === "custom" && (
          <DateRangePicker from={dateFrom} to={dateTo} onSelect={onDateRangeChange} />
        )}

        {/* Granularity selector */}
        <select
          value={granularity}
          onChange={(e) => onGranularityChange(e.target.value as ReportGranularity)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {granularities.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>

        {/* Filters button */}
        <Button variant="outline" size="sm" onClick={onOpenFilters} className="relative">
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Refresh */}
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
