"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Zap, CheckCircle2, XCircle } from "lucide-react";
import type { OverdueBreakdown as OverdueBreakdownType } from "@/lib/types/scoring";

interface Props {
  data: OverdueBreakdownType;
}

export function OverdueBreakdownCard({ data }: Props) {
  if (!data || data.total_overdue === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium">Overdue Breakdown</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  Detailed breakdown of all overdue loans, including how many
                  had auto-strike attempts, recovery progress, and distribution
                  by risk tier.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">No overdue loans in the evaluated period.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Overdue Breakdown</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Detailed breakdown of all overdue loans. Shows how many had
                auto-strike attempts (successful vs failed), average days
                overdue, outstanding amounts, and recovery progress. Use this
                to understand whether overdue loans are being recovered or
                escalating to defaults.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Total Overdue</p>
          <p className="text-lg font-bold tabular-nums">{data.total_overdue}</p>
          <p className="text-[10px] text-muted-foreground">loans currently overdue</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Avg Days Overdue</p>
          <p className="text-lg font-bold tabular-nums">{data.avg_days_overdue.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">max: {data.max_days_overdue} days</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Total Overdue Amount</p>
          <p className="text-lg font-bold tabular-nums">
            {data.total_overdue_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground">UGX outstanding</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Avg Outstanding</p>
          <p className="text-lg font-bold tabular-nums">
            {data.avg_outstanding_on_overdue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground">UGX per overdue loan</p>
        </div>
      </div>

      {/* Auto-strike on overdue */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-muted-foreground">Auto-Strike on Overdue Loans</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-lg border p-2 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-purple-500" />
            <div>
              <p className="text-sm font-bold tabular-nums">{data.overdue_with_autostrike}</p>
              <p className="text-[10px] text-muted-foreground">with auto-strike</p>
            </div>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-sm font-bold tabular-nums">{data.overdue_without_autostrike}</p>
            <p className="text-[10px] text-muted-foreground">no auto-strike</p>
          </div>
          <div className="rounded-lg border p-2 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <div>
              <p className="text-sm font-bold tabular-nums">{data.overdue_autostrike_successful}</p>
              <p className="text-[10px] text-muted-foreground">strike succeeded</p>
            </div>
          </div>
          <div className="rounded-lg border p-2 flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <div>
              <p className="text-sm font-bold tabular-nums">{data.overdue_autostrike_failed}</p>
              <p className="text-[10px] text-muted-foreground">strike failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery progress */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-muted-foreground">Recovery Progress</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-2">
            <p className="text-sm font-bold tabular-nums text-green-600">{data.overdue_fully_recovered}</p>
            <p className="text-[10px] text-muted-foreground">fully recovered via auto-strike</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-sm font-bold tabular-nums text-amber-600">{data.overdue_partially_recovered}</p>
            <p className="text-[10px] text-muted-foreground">partially recovered</p>
          </div>
        </div>
      </div>

      {/* By risk tier */}
      {data.overdue_by_risk_tier.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Overdue by Predicted Risk Tier</p>
          <div className="flex flex-wrap gap-2">
            {data.overdue_by_risk_tier.map((t) => (
              <Badge key={t.risk_level} variant="secondary" className="capitalize">
                {t.risk_level}: {t.total} ({(t.default_rate * 100).toFixed(0)}% of overdue)
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
