"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { ModelPerformanceSummary } from "@/lib/types/scoring";

interface Props {
  summary: ModelPerformanceSummary;
}

export function PerformanceSummaryCards({ summary }: Props) {
  const stats = [
    {
      label: "Overall Accuracy",
      value: `${(summary.overall_accuracy * 100).toFixed(0)}%`,
      sub: `${summary.total_loans_evaluated} loans evaluated`,
      help: "Percentage of predictions that matched the actual outcome. A prediction is 'correct' when low/medium-risk agents repay or high-risk agents default/overdue.",
      color: summary.overall_accuracy >= 0.75 ? "text-green-600" : "text-amber-600",
    },
    {
      label: "Default Rate",
      value: `${(summary.overall_default_rate * 100).toFixed(1)}%`,
      sub: `${summary.total_defaults} of ${summary.total_loans_evaluated} defaulted`,
      help: "The percentage of evaluated loans that resulted in default. This includes all risk tiers combined.",
      color: summary.overall_default_rate > 0.20 ? "text-red-600" : "text-green-600",
    },
    {
      label: "Repaid",
      value: `${summary.total_repaid}`,
      sub: "loans fully repaid",
      help: "Loans that were cleared without ever going overdue. These are the 'good outcomes'.",
      color: "text-green-600",
    },
    {
      label: "Overdue",
      value: `${summary.total_overdue}`,
      sub: "loans currently overdue",
      help: "Loans that are currently overdue or were overdue at some point but have not yet defaulted.",
      color: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{s.help}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-muted-foreground">{s.sub}</p>
        </Card>
      ))}
    </div>
  );
}
