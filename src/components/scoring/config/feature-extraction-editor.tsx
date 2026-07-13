"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FEATURE_EXTRACTION_KEYS } from "@/lib/types/scoring";

interface FeatureExtractionEditorProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function FeatureExtractionEditor({
  values,
  onChange,
  disabled,
}: FeatureExtractionEditorProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          These settings control how financial features are extracted from
          agent transaction history before scoring. Changes affect all future
          scoring runs.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURE_EXTRACTION_KEYS.map(({ key, label, help }) => {
          const isRatio = key === "min_avg_balance_ratio";
          const val = parseFloat(values[key] ?? "0") || 0;

          return (
            <div key={key} className="space-y-1.5">
              <Label className="text-sm">{label}</Label>
              {isRatio ? (
                <div className="flex items-center gap-3">
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[val]}
                    onValueChange={([v]) => onChange(key, v.toFixed(2))}
                    disabled={disabled}
                    className="flex-1"
                  />
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
              ) : (
                <Input
                  type="number"
                  min={0}
                  step={key === "transaction_lookback_days" ? 1 : 1000}
                  value={values[key] ?? "0"}
                  onChange={(e) => onChange(key, e.target.value)}
                  disabled={disabled}
                  className="tabular-nums"
                />
              )}
              <p className="text-xs text-muted-foreground">{help}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
