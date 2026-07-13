"use client";

import * as React from "react";
import Link from "next/link";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/use-api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import type { ModelPerformanceResponse } from "@/lib/types/scoring";

interface ModelPerformanceWidgetProps {
  basePath: string;
}

export function ModelPerformanceWidget({ basePath }: ModelPerformanceWidgetProps) {
  const { data, isLoading } = useApi(
    () => scoringDashboardApi.getModelPerformance(),
    ["model-performance-widget"],
    { cacheKey: "model-performance-widget" }
  );

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!data || data.summary.total_loans_evaluated === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Model Performance</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No loan outcome data available yet. Predictions will be evaluated once
 loans are disbursed and repaid or defaulted.
        </p>
      </Card>
    );
  }

  const s = data.summary;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Model Performance</h3>
        </div>
        <Link
          href={`${basePath}/scoring`}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View Details →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Accuracy */}
        <div className="rounded-lg border p-2.5">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Accuracy</p>
            {s.overall_accuracy >= 0.75 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-amber-500" />
            )}
          </div>
          <p className="text-lg font-bold tabular-nums">
            {(s.overall_accuracy * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            {s.total_loans_evaluated} loans evaluated
          </p>
        </div>

        {/* Default Rate */}
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Default Rate</p>
          <p className="text-lg font-bold tabular-nums">
            {(s.overall_default_rate * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            {s.total_defaults} defaulted · {s.total_recovered_via_autostrike} recovered
          </p>
        </div>

        {/* Overdue Rate */}
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Overdue Rate</p>
          <p className="text-lg font-bold tabular-nums">
            {(s.overall_overdue_rate * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            {s.total_overdue} overdue · avg {s.avg_days_overdue.toFixed(0)}d
          </p>
        </div>

        {/* Auto-Strike Recovery */}
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Auto-Strike</p>
          <p className="text-lg font-bold tabular-nums text-purple-600">
            {s.total_autostrike_successful}/{s.total_autostrike_attempts}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {s.total_recovered_via_autostrike} loans recovered
          </p>
        </div>
      </div>

      {/* Recommendations preview */}
      {data.recommendations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.recommendations.slice(0, 2).map((r, i) => (
            <Badge
              key={i}
              variant="secondary"
              className={`text-[10px] ${
                r.severity === "critical"
                  ? "bg-red-100 text-red-700"
                  : r.severity === "warning"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {r.severity === "critical" ? "🔴" : r.severity === "warning" ? "🟡" : "🔵"}{" "}
              {r.title}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
