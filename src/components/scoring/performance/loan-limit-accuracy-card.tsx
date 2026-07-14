"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { LoanLimitAccuracy as LoanLimitAccuracyType } from "@/lib/types/scoring";

interface Props {
  data: LoanLimitAccuracyType;
}

export function LoanLimitAccuracyCard({ data }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Loan Limit Accuracy</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Measures how well the recommended loan limits align with actual
                borrowing behavior. Utilization rate shows what percentage of
                the limit agents actually borrowed. Default rate by tier shows
                whether certain loan amounts have higher default rates.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Avg Utilization</p>
          <p className="text-lg font-bold tabular-nums">
            {(data.avg_utilization_rate * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            Of loan limit actually borrowed
          </p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Over-Limit Rate</p>
          <p className={`text-lg font-bold tabular-nums ${data.over_limit_rate > 0.10 ? "text-amber-600" : "text-green-600"}`}>
            {(data.over_limit_rate * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            Agents who borrowed above their limit
          </p>
        </div>
      </div>

      {data.default_rate_by_limit_tier.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Default Rate by Limit Tier</p>
          {data.default_rate_by_limit_tier.map((t) => (
            <div key={t.tier} className="flex items-center gap-2">
              <span className="text-xs w-20">{t.tier}</span>
              <div className="flex-1 h-4 rounded-md bg-muted overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${Math.min(t.default_rate * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums w-12 text-right">
                {(t.default_rate * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground mt-1">
            Note: Sample sizes per tier are not available in current data.
          </p>
        </div>
      )}
    </Card>
  );
}
