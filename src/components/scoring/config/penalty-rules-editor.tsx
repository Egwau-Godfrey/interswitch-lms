"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PENALTY_KEYS = [
  {
    key: "overdue_penalty_per_loan",
    label: "Overdue Penalty (per loan)",
    help: "Score reduction for each overdue loan.",
  },
  {
    key: "max_overdue_penalty",
    label: "Max Overdue Penalty",
    help: "Cap for total overdue penalty.",
  },
  {
    key: "autostrike_penalty_per_attempt",
    label: "Autostrike Penalty (per attempt)",
    help: "Score reduction for each successful auto-strike.",
  },
  {
    key: "max_autostrike_penalty",
    label: "Max Autostrike Penalty",
    help: "Cap for total autostrike penalty.",
  },
  {
    key: "default_penalty",
    label: "Default Penalty",
    help: "Flat score reduction for a defaulted loan.",
  },
  {
    key: "negative_balance_penalty_per_occurrence",
    label: "Negative Balance Penalty (per occurrence)",
    help: "Score reduction for each negative balance occurrence.",
  },
  {
    key: "max_negative_balance_penalty",
    label: "Max Negative Balance Penalty",
    help: "Cap for total negative balance penalty.",
  },
  {
    key: "low_c2d_ratio_penalty",
    label: "Low Credit-to-Debit Ratio Penalty",
    help: "Score reduction when C2D ratio is too low.",
  },
  {
    key: "large_debit_penalty_per_occurrence",
    label: "Large Debit Penalty (per occurrence)",
    help: "Score reduction for each abnormally large debit.",
  },
  {
    key: "max_large_debit_penalty",
    label: "Max Large Debit Penalty",
    help: "Cap for total large debit penalty.",
  },
] as const;

interface PenaltyRulesEditorProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function PenaltyRulesEditor({
  values,
  onChange,
  disabled,
}: PenaltyRulesEditorProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Penalties are subtracted from the base score (rule + ML blend).
          Each penalty reduces the agent&apos;s credit score, which may lower
          their risk level and loan limit.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PENALTY_KEYS.map(({ key, label, help }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm">{label}</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values[key] ?? "0"}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={disabled}
              className="tabular-nums"
            />
            <p className="text-xs text-muted-foreground">{help}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
