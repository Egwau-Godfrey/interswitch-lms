"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { MethodComparisonRow } from "@/lib/types/scoring";

interface Props {
  data: MethodComparisonRow[];
}

const METHOD_LABELS: Record<string, string> = {
  rules: "Rules Only",
  ml: "ML Only",
  hybrid: "Hybrid",
};

export function MethodComparisonChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No method comparison data available.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Scoring Method Comparison</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Compares the performance of each scoring method (rule-based,
                ML model, and hybrid). Accuracy measures how often the
                prediction matched the outcome. Default rate shows what
                percentage of loans defaulted under each method.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        {data.map((m) => (
          <div key={m.scoring_method} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{METHOD_LABELS[m.scoring_method] ?? m.scoring_method}</span>
              <span className="tabular-nums">
                {(m.accuracy * 100).toFixed(0)}% accuracy · {(m.default_rate * 100).toFixed(1)}% default
              </span>
            </div>
            <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden">
              <div
                className="h-full bg-primary flex items-center justify-end pr-2"
                style={{ width: `${Math.max(m.accuracy * 100, 5)}%` }}
              >
                <span className="text-[10px] font-bold text-primary-foreground">
                  {(m.accuracy * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{m.total} loans · {m.defaults} defaults</span>
              <span>Avg confidence: {(m.avg_confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
