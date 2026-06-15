"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

interface ScoreValueMeterProps {
  score: number;          // 0.0 to 1.0
  riskLevel: RiskLevel;
  showPercent?: boolean;  // default true
}

export function ScoreValueMeter({ score, riskLevel, showPercent = true }: ScoreValueMeterProps) {
  const percent = Math.round(score * 100 * 10) / 10; // 1 decimal

  const barColorClass = cn({
    "[&>div]:bg-green-500": riskLevel === "low",
    "[&>div]:bg-amber-500": riskLevel === "medium",
    "[&>div]:bg-red-500":   riskLevel === "high",
  });

  return (
    <div className="flex items-center gap-2">
      {showPercent && (
        <span className="font-mono text-sm font-semibold w-12 text-right">
          {percent.toFixed(1)}%
        </span>
      )}
      <Progress
        value={percent}
        className={cn("h-2 w-20", barColorClass)}
      />
    </div>
  );
}
