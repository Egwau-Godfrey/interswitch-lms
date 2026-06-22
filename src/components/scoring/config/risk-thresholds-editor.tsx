"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const THRESHOLD_KEYS = [
  { key: "threshold_rejected", label: "Rejected (below)", color: "bg-gray-500" },
  { key: "threshold_high_risk", label: "High Risk (below)", color: "bg-red-500" },
  { key: "threshold_medium_risk", label: "Medium Risk (below)", color: "bg-amber-500" },
] as const;

interface RiskThresholdsEditorProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function RiskThresholdsEditor({
  values,
  onChange,
  disabled,
}: RiskThresholdsEditorProps) {
  const parsed = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const { key } of THRESHOLD_KEYS) {
      map[key] = parseFloat(values[key] ?? "0") || 0;
    }
    return map;
  }, [values]);

  const sorted = React.useMemo(
    () => [...THRESHOLD_KEYS].sort((a, b) => parsed[a.key] - parsed[b.key]),
    [parsed]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Agents scoring below these thresholds are classified into the
        corresponding risk level. Scores at or above the Medium threshold
        are classified as Low Risk.
      </p>

      {/* Visual gauge */}
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        {sorted.map(({ key, label, color }, i) => {
          const next = sorted[i + 1];
          const width = next
            ? (parsed[next.key] - parsed[key]) * 100
            : (1 - parsed[key]) * 100;
          return (
            <div
              key={key}
              className={`${color} flex items-center justify-center text-xs font-medium text-white`}
              style={{ width: `${Math.max(width, 2)}%` }}
              title={label}
            >
              {width > 8 ? `${Math.round(width)}%` : ""}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {THRESHOLD_KEYS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4">
            <Label className="text-sm w-40 shrink-0">{label}</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={parsed[key].toFixed(2)}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={disabled}
              className="w-24 h-8 tabular-nums"
            />
            <Progress value={parsed[key] * 100} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {Math.round(parsed[key] * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
