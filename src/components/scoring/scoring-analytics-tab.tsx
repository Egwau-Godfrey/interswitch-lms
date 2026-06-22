"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import type { ScoringStats } from "@/lib/types";

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
  rejected: "#6b7280",
};

export function ScoringAnalyticsTab() {
  const { data: stats, isLoading } = useApi(
    () => scoringDashboardApi.getStats(),
    ["scoring-stats-analytics"],
    { cacheKey: "scoring-stats-analytics" }
  );

  const riskData = React.useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Low Risk", value: stats.low_risk_count, color: RISK_COLORS.low },
      { name: "Medium Risk", value: stats.medium_risk_count, color: RISK_COLORS.medium },
      { name: "High Risk", value: stats.high_risk_count, color: RISK_COLORS.high },
      { name: "Rejected", value: stats.rejected_count, color: RISK_COLORS.rejected },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const distributionData = React.useMemo(() => {
    if (!stats) return [];
    const total = stats.total_scored || 1;
    return [
      { range: "0–30%", count: stats.rejected_count, pct: (stats.rejected_count / total) * 100, color: RISK_COLORS.rejected, label: "Rejected" },
      { range: "30–60%", count: stats.high_risk_count, pct: (stats.high_risk_count / total) * 100, color: RISK_COLORS.high, label: "High Risk" },
      { range: "60–80%", count: stats.medium_risk_count, pct: (stats.medium_risk_count / total) * 100, color: RISK_COLORS.medium, label: "Medium Risk" },
      { range: "80–100%", count: stats.low_risk_count, pct: (stats.low_risk_count / total) * 100, color: RISK_COLORS.low, label: "Low Risk" },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Risk Distribution Donut */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {riskData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              No scored agents yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Score Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {distributionData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={distributionData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
                    formatter={(val: any, _name: any, props: any) => [
                      `${val} agents (${props?.payload?.pct?.toFixed(1)}%)`,
                      props?.payload?.label,
                    ]}
                  />
                  <Legend
                    content={() => (
                      <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, marginTop: 8 }}>
                        {distributionData.map((d) => (
                          <span key={d.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: d.color }} />
                            {d.label}
                          </span>
                        ))}
                      </div>
                    )}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              No data available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Scored</p>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.total_scored ?? "--"}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.avg_score != null
                  ? `${Math.round(stats.avg_score * 100)}%`
                  : "--"}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Avg Loan Limit</p>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.avg_loan_limit != null
                  ? `${Math.round(stats.avg_loan_limit).toLocaleString()}`
                  : "--"}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Exposure</p>
              <p className="text-2xl font-bold tabular-nums">
                {stats?.total_loan_exposure != null
                  ? `${Math.round(stats.total_loan_exposure).toLocaleString()}`
                  : "--"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
