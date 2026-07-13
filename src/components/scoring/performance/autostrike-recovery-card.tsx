"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Zap, CheckCircle2, XCircle } from "lucide-react";
import type { AutostrikeRecoveryMetrics } from "@/lib/types/scoring";

interface Props {
  data: AutostrikeRecoveryMetrics;
}

export function AutostrikeRecoveryCard({ data }: Props) {
  if (!data || data.total_loans_with_autostrike === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Auto-Strike Recovery</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  Shows how effectively the auto-strike system is recovering
                  funds from overdue and defaulted loans. Includes success rate,
                  total recovered, and breakdown by loan outcome.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">No auto-strike attempts in the evaluated period.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-purple-500" />
        <h4 className="text-sm font-medium">Auto-Strike Recovery</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Shows how effectively the auto-strike system is recovering
                funds from overdue and defaulted loans. Success rate measures
                what percentage of attempts successfully deducted money.
                Recovery rate shows what fraction of outstanding balance was
                recovered. Breakdown by outcome shows where auto-strikes are
                being used most.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Loans with Auto-Strike</p>
          <p className="text-lg font-bold tabular-nums">{data.total_loans_with_autostrike}</p>
          <p className="text-[10px] text-muted-foreground">{data.total_autostrike_attempts} total attempts</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Success Rate</p>
          <p className={`text-lg font-bold tabular-nums ${data.success_rate < 0.30 ? "text-red-600" : "text-green-600"}`}>
            {(data.success_rate * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">{data.successful_autostrikes} succeeded · {data.failed_autostrikes} failed</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Total Recovered</p>
          <p className="text-lg font-bold tabular-nums text-purple-600">
            {data.total_recovered_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground">UGX recovered via auto-strike</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Recovery Rate</p>
          <p className="text-lg font-bold tabular-nums">
            {(data.recovery_rate_of_outstanding * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">of outstanding balance</p>
        </div>
      </div>

      {/* Breakdown by outcome */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Auto-Strike Breakdown by Loan Outcome</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-sm font-bold tabular-nums text-amber-600">{data.autostrike_on_overdue}</p>
            <p className="text-[10px] text-muted-foreground">on overdue loans</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-sm font-bold tabular-nums text-red-600">{data.autostrike_on_defaulted}</p>
            <p className="text-[10px] text-muted-foreground">on defaulted loans</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-sm font-bold tabular-nums text-green-600">{data.autostrike_on_cleared}</p>
            <p className="text-[10px] text-muted-foreground">on cleared loans</p>
          </div>
        </div>
      </div>

      {data.avg_recovery_per_successful > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Avg recovery per successful strike:{" "}
          <span className="font-medium tabular-nums">
            {data.avg_recovery_per_successful.toLocaleString(undefined, { maximumFractionDigits: 0 })} UGX
          </span>
        </div>
      )}
    </Card>
  );
}
