"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/components/shared/stat-card";
import type { LoanStatusBreakdown } from "@/lib/types";

interface LoanStatusDistributionChartProps {
  data: LoanStatusBreakdown[] | undefined;
  isLoading: boolean;
  basePath: "/super-admin" | "/user";
}

const statusColors: Record<string, string> = {
  disbursed: "#004B91",
  cleared: "#10B981",
  overdue: "#F59E0B",
  defaulted: "#EF4444",
  pending: "#FFD700",
  approved: "#3B82F6",
  failed: "#6B7280",
};

interface StatusTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: LoanStatusBreakdown }>;
}

function StatusTooltip({ active, payload }: StatusTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-1 text-sm font-medium capitalize">{item.status}</p>
      <p className="text-sm text-muted-foreground">Count: {item.count} ({item.percentage.toFixed(1)}%)</p>
      <p className="text-sm text-muted-foreground">Principal: {formatCurrency(item.principal_amount, "UGX", true)}</p>
      <p className="text-sm text-muted-foreground">Outstanding: {formatCurrency(item.outstanding_amount, "UGX", true)}</p>
    </div>
  );
}

export function LoanStatusDistributionChart({
  data,
  isLoading,
  basePath,
}: LoanStatusDistributionChartProps) {
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

  const chartData = (data || []).map((item) => ({
    ...item,
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    color: statusColors[item.status] || "#6B7280",
  }));

  const totalLoans = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Status Distribution</CardTitle>
        <CardDescription>
          {totalLoans} loans total · Click a slice to view loans
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] min-w-0">
        {chartData.length > 0 && totalLoans > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                label={({ name, percent }: { name?: string; percent?: number }) => {
                  const p = percent || 0;
                  return p > 0.03 ? `${name} (${(p * 100).toFixed(0)}%)` : null;
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<StatusTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                formatter={(value: string) => {
                  const item = chartData.find((d) => d.name === value);
                  return item ? `${value}: ${item.count} (${formatCurrency(item.outstanding_amount, "UGX", true)})` : value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            No loan data available for this period
          </div>
        )}
        <div className="mt-2 text-right">
          <Link
            href={`${basePath}/loans`}
            className="text-xs text-primary hover:underline"
          >
            View all loans →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
