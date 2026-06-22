"use client";

import * as React from "react";
import { AlertTriangle, Zap, Ban, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { AgentBehavior } from "@/lib/types/scoring";

interface LoanBehaviorSummaryProps {
  behavior: AgentBehavior | undefined;
}

export function LoanBehaviorSummary({ behavior }: LoanBehaviorSummaryProps) {
  if (!behavior) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No loan behavior data available.
      </p>
    );
  }

  const onTimePct = Math.round((behavior.on_time_repayment_ratio ?? 0) * 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-md border p-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Overdue Loans</p>
            <p className="text-sm font-bold tabular-nums">
              {behavior.overdue_loan_count ?? 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border p-2">
          <Zap className="h-4 w-4 text-orange-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Auto-Strikes</p>
            <p className="text-sm font-bold tabular-nums">
              {behavior.autostrike_count ?? 0}
              {behavior.autostrike_successful
                ? ` (${behavior.autostrike_successful} success)`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border p-2">
          <Ban className="h-4 w-4 text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Defaults</p>
            <p className="text-sm font-bold tabular-nums">
              {behavior.default_count ?? 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-md border p-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Total Loans</p>
            <p className="text-sm font-bold tabular-nums">
              {behavior.total_loans_taken ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">On-Time Repayment Ratio</span>
          <span className="font-bold tabular-nums">{onTimePct}%</span>
        </div>
        <Progress value={onTimePct} className="h-2" />
      </div>
    </div>
  );
}
