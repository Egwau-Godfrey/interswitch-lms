"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { FACTOR_LABELS } from "@/lib/types/scoring";
import type { FactorPredictivePower } from "@/lib/types/scoring";

interface Props {
  data: FactorPredictivePower[];
}

export function FactorPredictivePowerChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No factor predictive power data available.</p>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.discriminative_power - a.discriminative_power);
  const maxPower = Math.max(...sorted.map((f) => f.discriminative_power), 0.01);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Factor Predictive Power</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                For each rule-based factor, compares the average score between
                agents who repaid vs those who defaulted. A large gap
                (high discriminative power) means the factor is good at
                distinguishing good from bad borrowers. Factors with small gaps
                may need reweighting.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2.5">
        {sorted.map((f) => {
          const label = FACTOR_LABELS[f.factor] ?? f.factor;
          const isWeak = f.discriminative_power < 0.10;
          return (
            <div key={f.factor} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{label}</span>
                <span className={`tabular-nums ${isWeak ? "text-amber-600" : "text-green-600"}`}>
                  {f.discriminative_power.toFixed(2)}
                  {isWeak && " ⚠️"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Repaid bar (green, left) */}
                <div className="flex-1 h-4 rounded-l-md bg-muted overflow-hidden flex justify-end">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(f.avg_score_repaid / 1) * 100}%` }}
                  />
                </div>
                {/* Defaulted bar (red, right) */}
                <div className="flex-1 h-4 rounded-r-md bg-muted overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(f.avg_score_defaulted / 1) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="text-green-600">Repaid avg: {f.avg_score_repaid.toFixed(2)}</span>
                <span className="text-red-600">Defaulted avg: {f.avg_score_defaulted.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 bg-green-500 rounded" /> Repaid
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 bg-red-500 rounded" /> Defaulted
        </span>
        <span>⚠️ = low discriminative power (&lt; 0.10)</span>
      </div>
    </Card>
  );
}
