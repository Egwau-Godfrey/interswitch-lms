"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/shared/stat-card";
import type { CollectionsBreakdown } from "@/lib/types";

interface CollectionsBreakdownCardProps {
  breakdown: CollectionsBreakdown | undefined;
  isLoading: boolean;
}

interface SplitBarProps {
  label: string;
  amount: number;
  total: number;
  color: string;
}

function SplitBar({ label, amount, total, color }: SplitBarProps) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatCurrency(amount, "UGX", true)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-right text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
    </div>
  );
}

export function CollectionsBreakdownCard({ breakdown, isLoading }: CollectionsBreakdownCardProps) {
  if (isLoading || !breakdown) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = breakdown.total_collected || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections Breakdown</CardTitle>
        <CardDescription>
          Waterfall split: Application Fee → Interest → Penalties → Principal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between border-b pb-3">
          <span className="text-sm font-medium text-muted-foreground">Total Collected</span>
          <span className="text-2xl font-bold">{formatCurrency(breakdown.total_collected, "UGX", true)}</span>
        </div>
        <SplitBar
          label="Principal Collected"
          amount={breakdown.principal_collected}
          total={total}
          color="bg-blue-500"
        />
        <SplitBar
          label="Interest Collected"
          amount={breakdown.interest_collected}
          total={total}
          color="bg-emerald-500"
        />
        <SplitBar
          label="Penalties Collected"
          amount={breakdown.penalty_collected}
          total={total}
          color="bg-amber-500"
        />
        <SplitBar
          label="Application Fees Collected"
          amount={breakdown.application_fee_collected}
          total={total}
          color="bg-violet-500"
        />
        {breakdown.overpayment_collected > 0 && (
          <SplitBar
            label="Overpayments"
            amount={breakdown.overpayment_collected}
            total={total}
            color="bg-rose-500"
          />
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t pt-3 text-sm">
          <div>
            <span className="text-muted-foreground">Collection Rate: </span>
            <span className="font-semibold">{breakdown.collection_rate.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Recovery Rate: </span>
            <span className="font-semibold">{breakdown.recovery_rate.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Payments: </span>
            <span className="font-semibold">{breakdown.collection_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
