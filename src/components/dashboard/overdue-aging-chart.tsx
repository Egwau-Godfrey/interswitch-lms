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
  Cell,
} from "recharts";
import { formatCurrency } from "@/components/shared/stat-card";
import type { DashboardOverdueAgingBucket } from "@/lib/types";

interface OverdueAgingChartProps {
  data: DashboardOverdueAgingBucket[] | undefined;
  isLoading: boolean;
}

export function OverdueAgingChart({ data, isLoading }: OverdueAgingChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue Aging</CardTitle>
        <CardDescription>Outstanding by days past due</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] min-w-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tickFormatter={(v) => formatCurrency(v, "UGX", true)}
                className="text-xs"
              />
              <YAxis dataKey="range" type="category" className="text-xs" width={80} />
              <Tooltip
                formatter={(value: unknown) =>
                  formatCurrency(value !== undefined && value !== null ? Number(value) : 0, "UGX")
                }
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index > 2 ? "#EF4444" : "#F59E0B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No overdue loans in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
