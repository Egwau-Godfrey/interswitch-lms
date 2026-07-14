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
  const autostrikeSuccessRate =
    summary.total_autostrike_attempts > 0
      ? summary.total_autostrike_successful / summary.total_autostrike_attempts
      : 0;

  const stats = [
    {
      label: "Overall Accuracy",
      value: `${(summary.overall_accuracy * 100).toFixed(1)}%`,
      sub: `${summary.total_loans_evaluated} loans evaluated`,
      help: "Percentage of predictions that matched the actual outcome. A prediction is 'correct' when low/medium-risk agents repay or high-risk agents default/overdue.",
      color: summary.overall_accuracy >= 0.75 ? "text-green-600" : "text-amber-600",
    },
    {
      label: "Precision",
      value: `${(summary.precision * 100).toFixed(1)}%`,
      sub: `of ${summary.total_defaults + summary.total_overdue} bad loans predicted`,
      help: "Of all loans predicted as high-risk, what percentage actually defaulted or went overdue. High precision means few false alarms.",
      color: summary.precision >= 0.60 ? "text-green-600" : "text-amber-600",
    },
    {
      label: "Recall",
      value: `${(summary.recall * 100).toFixed(1)}%`,
      sub: `of bad loans caught`,
      help: "Of all loans that actually defaulted or went overdue, what percentage the model predicted as high-risk. High recall means few missed risks.",
      color: summary.recall >= 0.60 ? "text-green-600" : "text-amber-600",
    },
    {
      label: "Default Rate",
      value: `${(summary.overall_default_rate * 100).toFixed(1)}%`,
      sub: `${summary.total_defaults} defaulted · ${summary.total_recovered_via_autostrike} recovered via auto-strike`,
      help: "The percentage of evaluated loans that resulted in default. 'Recovered via auto-strike' means the system recovered the money through forced deduction — the agent didn't repay voluntarily.",
      color: summary.overall_default_rate > 0.20 ? "text-red-600" : "text-green-600",
    },
    {
      label: "Overdue Rate",
      value: `${(summary.overall_overdue_rate * 100).toFixed(1)}%`,
      sub: `${summary.total_overdue} overdue · avg ${summary.avg_days_overdue.toFixed(0)} days`,
      help: "The percentage of evaluated loans currently overdue. Avg days overdue shows how long overdue loans have been outstanding.",
      color: summary.overall_overdue_rate > 0.25 ? "text-amber-600" : "text-green-600",
    },
    {
      label: "Auto-Strike Success",
      value: `${(autostrikeSuccessRate * 100).toFixed(1)}%`,
      sub: `${summary.total_autostrike_successful} of ${summary.total_autostrike_attempts} attempts`,
      help: "Shows what percentage of auto-strike attempts succeeded in recovering funds. A low success rate means agents don't have sufficient wallet balances when strikes are attempted.",
      color: autostrikeSuccessRate < 0.30 ? "text-red-600" : autostrikeSuccessRate >= 0.60 ? "text-green-600" : "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
