"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { ConfusionMatrixRow } from "@/lib/types/scoring";

interface Props {
  matrix: Record<string, ConfusionMatrixRow>;
}

const RISK_LABELS: Record<string, string> = {
  low_risk: "Low Risk",
  medium_risk: "Medium Risk",
  high_risk: "High Risk",
};

const OUTCOME_COLORS: Record<string, string> = {
  repaid: "bg-green-100 text-green-700",
  overdue: "bg-amber-100 text-amber-700",
  defaulted: "bg-red-100 text-red-700",
  recovered_via_autostrike: "bg-purple-100 text-purple-700",
};

// Cells that represent critical model misses get a red ring
function isCriticalMiss(riskKey: string, outcome: string): boolean {
  return (riskKey === "low_risk" && outcome === "defaulted");
}

export function ConfusionMatrixCard({ matrix }: Props) {
  const rows = Object.entries(matrix).filter(
    ([k, v]) => v.total > 0 && k !== "rejected_risk"
  );

  if (rows.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No confusion matrix data available.</p>
      </Card>
    );
  }

  const outcomes = ["repaid", "overdue", "defaulted", "recovered_via_autostrike"] as const;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Confusion Matrix</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Shows how predicted risk levels compare to actual loan outcomes.
                Each row is a predicted risk level; columns are what actually happened.
                <strong> Critical Miss</strong>: Low-risk agent defaulted (red ring).
                <strong> Over-conservative</strong>: High-risk agent repaid.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Predicted</th>
              <th className="text-center px-3 py-2 font-medium text-green-600">Repaid</th>
              <th className="text-center px-3 py-2 font-medium text-amber-600">Overdue</th>
              <th className="text-center px-3 py-2 font-medium text-red-600">Defaulted</th>
              <th className="text-center px-3 py-2 font-medium text-purple-600">Recovered</th>
              <th className="text-center px-3 py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, row]) => (
              <tr key={key} className="border-t">
                <td className="px-3 py-2 font-medium">{RISK_LABELS[key] ?? key}</td>
                {outcomes.map((outcome) => {
                  const count = row[outcome] ?? 0;
                  const pct = row.total > 0 ? (count / row.total) * 100 : 0;
                  const critical = isCriticalMiss(key, outcome);
                  return (
                    <td key={outcome} className="text-center px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${OUTCOME_COLORS[outcome]} ${critical ? "ring-2 ring-red-500" : ""}`}
                      >
                        {count}
                        {count > 0 && (
                          <span className="text-[9px] opacity-70 ml-0.5">{pct.toFixed(0)}%</span>
                        )}
                      </span>
                    </td>
                  );
                })}
                <td className="text-center px-3 py-2 font-bold tabular-nums">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
