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
    disbursed: Number(bucket.disbursed),
    collected: Number(bucket.collected),
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
                tickFormatter={(v) => `UGX ${(v / 1_000_000).toFixed(1)}M`}
                className="text-xs"
                width={80}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value), "UGX", true),
                  String(name),
                ]}
              />
              <Legend />
              <Bar dataKey="disbursed" name="Disbursed" fill="#004B91" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
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
