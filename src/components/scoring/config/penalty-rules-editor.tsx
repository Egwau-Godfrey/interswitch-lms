"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ScoringConfigEntry } from "@/lib/types/scoring";

const PENALTY_KEYS = [
  {
    key: "overdue_penalty_per_loan",
    label: "Overdue Penalty (per loan)",
  },
  {
    key: "max_overdue_penalty",
    label: "Max Overdue Penalty",
  },
  {
    key: "autostrike_penalty_per_attempt",
    label: "Autostrike Penalty (per attempt)",
  },
  {
    key: "max_autostrike_penalty",
    label: "Max Autostrike Penalty",
  },
  {
    key: "default_penalty",
    label: "Default Penalty",
  },
  {
    key: "negative_balance_penalty_per_occurrence",
    label: "Negative Balance Penalty (per occurrence)",
  },
  {
    key: "max_negative_balance_penalty",
    label: "Max Negative Balance Penalty",
  },
  {
    key: "low_c2d_ratio_penalty",
    label: "Low Credit-to-Debit Ratio Penalty",
  },
  {
    key: "large_debit_penalty_per_occurrence",
    label: "Large Debit Penalty (per occurrence)",
  },
  {
    key: "max_large_debit_penalty",
    label: "Max Large Debit Penalty",
  },
] as const;

interface PenaltyRulesEditorProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  configEntries?: ScoringConfigEntry[];
}

export function PenaltyRulesEditor({
  values,
  onChange,
  disabled,
  configEntries,
}: PenaltyRulesEditorProps) {
  const helpMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    if (configEntries) {
      for (const e of configEntries) {
        if (e.help_text) m[e.key] = e.help_text;
      }
    }
    return m;
  }, [configEntries]);
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
        {PENALTY_KEYS.map(({ key, label }) => (
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
            <p className="text-xs text-muted-foreground">
              {helpMap[key] ?? ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
