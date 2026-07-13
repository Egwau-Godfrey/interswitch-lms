"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/components/shared/stat-card";
import type { ScoringConfigEntry } from "@/lib/types/scoring";

/** Global guardrail keys. */
const GLOBAL_KEYS = [
  { key: "min_loan_limit", label: "Global Min Loan Limit (UGX)" },
  { key: "max_loan_limit", label: "Global Max Loan Limit (UGX)" },
  { key: "loan_limit_step", label: "Loan Limit Step (UGX)" },
  { key: "rejected_loan_limit", label: "Rejected Loan Limit (UGX)" },
] as const;

/** Per-risk-band limit keys. */
const TIER_KEYS = [
  {
    band: "high",
    label: "High Risk",
    minKey: "high_risk_min_loan_limit",
    maxKey: "high_risk_max_loan_limit",
    color: "text-red-600",
    dot: "bg-red-500",
  },
  {
    band: "medium",
    label: "Medium Risk",
    minKey: "medium_risk_min_loan_limit",
    maxKey: "medium_risk_max_loan_limit",
    color: "text-amber-600",
    dot: "bg-amber-500",
  },
  {
    band: "low",
    label: "Low Risk",
    minKey: "low_risk_min_loan_limit",
    maxKey: "low_risk_max_loan_limit",
    color: "text-green-600",
    dot: "bg-green-500",
  },
] as const;

interface LoanLimitConfigProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  configEntries?: ScoringConfigEntry[];
}

export function LoanLimitConfig({
  values,
  onChange,
  disabled,
  configEntries,
}: LoanLimitConfigProps) {
  const helpMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    if (configEntries) {
      for (const e of configEntries) {
        if (e.help_text) m[e.key] = e.help_text;
      }
    }
    return m;
  }, [configEntries]);
  const num = React.useCallback(
    (key: string, fallback = 0) => parseFloat(values[key] ?? "") || fallback,
    [values],
  );

  const step = num("loan_limit_step", 5000);

  // Build discrete step values for each risk tier
  const tiers = React.useMemo(() => {
    return TIER_KEYS.map((t) => {
      const min = num(t.minKey, 0);
      const max = num(t.maxKey, 0);
      const steps: number[] = [];
      if (step > 0 && max >= min) {
        for (let v = min; v <= max + 0.001; v += step) {
          steps.push(Math.round(v));
        }
      }
      return {
        band: t.band,
        label: t.label,
        color: t.color,
        dot: t.dot,
        min,
        max,
        steps,
      };
    });
  }, [num, step]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Loan limits are <strong>risk-tier-based</strong> with discrete steps.
        Each risk band maps to a fixed set of loan amounts. The agent&apos;s
        score position within the band determines which step they receive.
      </p>

      {/* Global guardrails */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Global Guardrails</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GLOBAL_KEYS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-sm">{label}</Label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={num(key)}
                onChange={(e) => onChange(key, e.target.value)}
                disabled={disabled}
                className="tabular-nums"
              />
              {helpMap[key] && (
                <p className="text-xs text-muted-foreground">{helpMap[key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Per-risk-band limits */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Per-Risk-Band Limits</h4>
        <div className="grid grid-cols-1 gap-4">
          {TIER_KEYS.map((t) => (
            <div
              key={t.band}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-3"
            >
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${t.dot}`} />
                  {t.label} — Min (UGX)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={num(t.minKey)}
                  onChange={(e) => onChange(t.minKey, e.target.value)}
                  disabled={disabled}
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${t.dot}`} />
                  {t.label} — Max (UGX)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={num(t.maxKey)}
                  onChange={(e) => onChange(t.maxKey, e.target.value)}
                  disabled={disabled}
                  className="tabular-nums"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier preview */}
      {tiers.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Tier Preview (score &lt; 30% → Rejected → 0 UGX)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tiers.map((t) => (
              <div
                key={t.band}
                className="rounded-md border p-3 text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${t.dot}`} />
                  <p className={`text-xs font-semibold ${t.color}`}>{t.label}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {formatCurrency(t.min, "UGX")} – {formatCurrency(t.max, "UGX")}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {t.steps.map((s) => (
                    <span
                      key={s}
                      className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
                    >
                      {formatCurrency(s, "UGX").replace("UGX", "").trim()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
