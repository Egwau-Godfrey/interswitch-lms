"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import type { PenaltyBreakdown } from "@/lib/types/scoring";

const PENALTY_LABELS: Record<string, string> = {
  overdue: "Overdue Loans",
  autostrike: "Auto-Strike",
  default: "Loan Default",
  negative_balance: "Negative Balance",
  large_debit: "Large Debit",
  low_c2d_ratio: "Low Credit-to-Debit Ratio",
};

interface PenaltyBreakdownProps {
  penalties: PenaltyBreakdown | undefined;
  penaltyTotal: number | undefined;
}

export function PenaltyBreakdown({
  penalties,
  penaltyTotal,
}: PenaltyBreakdownProps) {
  const entries = React.useMemo(() => {
    if (!penalties) return [];
    return Object.entries(penalties)
      .filter(([, v]) => v !== undefined && v !== 0)
      .map(([key, value]) => ({
        key,
        label: PENALTY_LABELS[key] ?? key.replace(/_/g, " "),
        value: value ?? 0,
      }))
      .sort((a, b) => a.value - b.value); // most negative first
  }, [penalties]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <AlertCircle className="h-4 w-4" />
        <span>No penalties applied to this score.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className="flex items-center justify-between rounded-md border p-2"
        >
          <span className="text-xs font-medium">{entry.label}</span>
          <span className="text-sm font-mono font-semibold text-red-600 tabular-nums">
            {entry.value.toFixed(3)}
          </span>
        </div>
      ))}
      {penaltyTotal !== undefined && penaltyTotal !== 0 && (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 p-2">
          <span className="text-xs font-bold">Total Penalty</span>
          <span className="text-sm font-mono font-bold text-red-600 tabular-nums">
            {penaltyTotal.toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
}
