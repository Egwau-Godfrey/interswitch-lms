"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import type { ScoreDriftMetrics } from "@/lib/types/scoring";

interface Props {
  data: ScoreDriftMetrics;
}

export function ScoreDriftCard({ data }: Props) {
  const driftsDown = data.avg_drift_before_default < -0.05;
  const driftsUp = data.avg_drift_before_clearance > 0.03;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Score Drift & Stability</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Tracks how credit scores change over time and whether score
                changes correlate with loan outcomes. If scores consistently
                drop before defaults, more frequent rescoring may help catch
                at-risk agents earlier.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Avg 30-Day Change</p>
          <p className={`text-lg font-bold tabular-nums ${data.avg_score_change_30d >= 0 ? "text-green-600" : "text-red-600"}`}>
            {data.avg_score_change_30d >= 0 ? "+" : ""}{data.avg_score_change_30d.toFixed(3)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Average score change over 30 days
          </p>
        </div>

        <div className="rounded-lg border p-2.5">
          <p className="text-xs text-muted-foreground">Volatility</p>
          <p className="text-lg font-bold tabular-nums">
            {data.score_volatility.toFixed(3)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Std dev of score changes
          </p>
        </div>

        <div className="rounded-lg border p-2.5">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Before Default</p>
            {driftsDown && <TrendingDown className="h-3 w-3 text-red-500" />}
          </div>
          <p className={`text-lg font-bold tabular-nums ${data.avg_drift_before_default < 0 ? "text-red-600" : "text-muted-foreground"}`}>
            {data.avg_drift_before_default >= 0 ? "+" : ""}{data.avg_drift_before_default.toFixed(3)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Avg score drift before agents defaulted
          </p>
        </div>

        <div className="rounded-lg border p-2.5">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Before Clearance</p>
            {driftsUp && <TrendingUp className="h-3 w-3 text-green-500" />}
          </div>
          <p className={`text-lg font-bold tabular-nums ${data.avg_drift_before_clearance > 0 ? "text-green-600" : "text-muted-foreground"}`}>
            {data.avg_drift_before_clearance >= 0 ? "+" : ""}{data.avg_drift_before_clearance.toFixed(3)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Avg score drift before agents repaid
          </p>
        </div>
      </div>
    </Card>
  );
}
