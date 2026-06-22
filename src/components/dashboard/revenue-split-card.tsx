"use client";

import * as React from "react";
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
import type { DashboardRevenueSplit } from "@/lib/types";

interface RevenueSplitCardProps {
  revenue: DashboardRevenueSplit | undefined;
  isLoading: boolean;
}

export function RevenueSplitCard({ revenue, isLoading }: RevenueSplitCardProps) {
  if (isLoading || !revenue) {
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

  const partnerData = [
    { name: "Interswitch (30%)", value: revenue.interswitch_amount, color: "#004B91" },
    { name: "Qriscorp (70%)", value: revenue.qriscorp_amount, color: "#10B981" },
  ];

  const componentData = [
    { name: "Application Fee", value: revenue.application_fee_revenue, color: "#004B91" },
    { name: "Interest", value: revenue.interest_revenue, color: "#10B981" },
    { name: "Penalty", value: revenue.penalty_revenue, color: "#F59E0B" },
    { name: "Surcharge", value: revenue.surcharge_revenue, color: "#EF4444" },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Split</CardTitle>
        <CardDescription>
          Gross: {formatCurrency(revenue.gross_revenue, "UGX", true)} · Accrued:{" "}
          {formatCurrency(revenue.accrued_revenue, "UGX", true)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Partner split pie */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Partner Share</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={partnerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {partnerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => formatCurrency(Number(value) || 0, "UGX", true)} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Component breakdown */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">By Component</p>
            <div className="space-y-2">
              {componentData.length > 0 ? (
                componentData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value, "UGX", true)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No revenue in this period</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
