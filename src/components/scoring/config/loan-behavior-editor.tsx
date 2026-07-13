"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BEHAVIOR_SETTING_KEYS } from "@/lib/types/scoring";

interface LoanBehaviorEditorProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function LoanBehaviorEditor({
  values,
  onChange,
  disabled,
}: LoanBehaviorEditorProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          These settings control how the system responds to loan delinquency
          and defaults. Auto-strike attempts to recover funds from the
          agent&apos;s wallet, while the default threshold determines when a
          loan is written off.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BEHAVIOR_SETTING_KEYS.map(({ key, label, help }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm">{label}</Label>
            <Input
              type="number"
              min={0}
              step={key === "auto_strike_percentage" ? 1 : 1}
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
