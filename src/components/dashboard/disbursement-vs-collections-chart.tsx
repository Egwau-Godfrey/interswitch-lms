"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/components/shared/stat-card";
import type { DashboardTrendBucket } from "@/lib/types";

interface DisbursementVsCollectionsChartProps {
  data: DashboardTrendBucket[] | undefined;
  isLoading: boolean;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-medium">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatCurrency(entry.value, "UGX", true)}</span>
        </div>
      ))}
    </div>
  );
}

export function DisbursementVsCollectionsChart({
  data,
  isLoading,
}: DisbursementVsCollectionsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data || []).map((bucket) => ({
    ...bucket,
    disbursedM: Number((bucket.disbursed / 1000000).toFixed(2)),
    collectedM: Number((bucket.collected / 1000000).toFixed(2)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disbursement vs Collections</CardTitle>
        <CardDescription>Period comparison of disbursed amounts vs collections</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] min-w-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="bucket" className="text-xs" />
              <YAxis
                tickFormatter={(v) => `${v}M`}
                className="text-xs"
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="disbursedM" name="Disbursed (M UGX)" fill="#004B91" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collectedM" name="Collected (M UGX)" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            No trend data available for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
