"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FACTOR_LABELS } from "@/lib/types/scoring";
import type { ScoringConfigEntry } from "@/lib/types/scoring";

/** Factor weight keys in the scoring config. */
const WEIGHT_KEYS = [
  "weight_income_stability",
  "weight_credit_debit",
  "weight_balance_trend",
  "weight_transaction_frequency",
  "weight_avg_balance",
  "weight_max_transaction",
  "weight_consistency",
] as const;

interface ScoringWeightsEditorProps {
  /** Current values keyed by config key (0–1 floats as strings). */
  values: Record<string, string>;
  /** Callback when a value changes. */
  onChange: (key: string, value: string) => void;
  /** Whether editing is disabled. */
  disabled?: boolean;
  /** Full config entries for help text lookup. */
  configEntries?: ScoringConfigEntry[];
}

export function ScoringWeightsEditor({
  values,
  onChange,
  disabled,
  configEntries,
}: ScoringWeightsEditorProps) {
  const helpMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    if (configEntries) {
      for (const e of configEntries) {
        if (e.help_text) m[e.key] = e.help_text;
      }
    }
    return m;
  }, [configEntries]);
  const parsed = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const key of WEIGHT_KEYS) {
      map[key] = parseFloat(values[key] ?? "0") || 0;
    }
    return map;
  }, [values]);

  const total = React.useMemo(
    () => Object.values(parsed).reduce((a, b) => a + b, 0),
    [parsed]
  );
  const totalPercent = Math.round(total * 100);
  const isValid = Math.abs(total - 1.0) < 0.001;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Adjust the weight each factor contributes to the overall score.
          Weights must sum to 100%.
        </p>
        <span
          className={`text-sm font-bold tabular-nums ${
            isValid ? "text-green-600" : "text-red-600"
          }`}
        >
          {totalPercent}%
        </span>
      </div>

      {!isValid && (
        <Alert variant="destructive">
          <AlertDescription>
            Weights must sum to 100%. Currently at {totalPercent}%.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-5">
        {WEIGHT_KEYS.map((key) => {
          const label =
            FACTOR_LABELS[key.replace("weight_", "")] ?? key;
          const val = parsed[key];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={val.toFixed(2)}
                  onChange={(e) => onChange(key, e.target.value)}
                  disabled={disabled}
                  className="w-20 h-8 text-right tabular-nums"
                />
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[val]}
                onValueChange={([v]) => onChange(key, v.toFixed(2))}
                disabled={disabled}
              />
              {helpMap[key] && (
                <p className="text-xs text-muted-foreground">{helpMap[key]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
