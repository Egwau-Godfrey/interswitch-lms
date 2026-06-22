"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/shared/stat-card";
import type { DashboardPARMetrics } from "@/lib/types";

interface ParMetricsCardProps {
  metrics: DashboardPARMetrics | undefined;
  isLoading: boolean;
}

function parColor(percent: number): string {
  if (percent < 5) return "text-emerald-600";
  if (percent < 10) return "text-amber-600";
  return "text-red-600";
}

function parBg(percent: number): string {
  if (percent < 5) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (percent < 10) return "bg-amber-100 dark:bg-amber-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

export function ParMetricsCard({ metrics, isLoading }: ParMetricsCardProps) {
  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const items = [
    { label: "PAR 30", amount: metrics.par_30, percent: metrics.par_30_percent },
    { label: "PAR 60", amount: metrics.par_60, percent: metrics.par_60_percent },
    { label: "PAR 90", amount: metrics.par_90, percent: metrics.par_90_percent },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio at Risk</CardTitle>
        <CardDescription>Outstanding by overdue threshold</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold">{formatCurrency(item.amount, "UGX", true)}</p>
            </div>
            <div className={cn("rounded-full px-3 py-1 text-sm font-bold", parBg(item.percent), parColor(item.percent))}>
              {item.percent.toFixed(1)}%
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
