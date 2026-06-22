"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/components/shared/stat-card";

const LIMIT_KEYS = [
  { key: "min_loan_limit", label: "Minimum Loan Limit (UGX)" },
  { key: "max_loan_limit", label: "Maximum Loan Limit (UGX)" },
  { key: "loan_limit_step", label: "Loan Limit Step (UGX)" },
  { key: "rejected_loan_limit", label: "Rejected Loan Limit (UGX)" },
] as const;

interface LoanLimitConfigProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function LoanLimitConfig({
  values,
  onChange,
  disabled,
}: LoanLimitConfigProps) {
  const parsed = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const { key } of LIMIT_KEYS) {
      map[key] = parseFloat(values[key] ?? "0") || 0;
    }
    return map;
  }, [values]);

  const min = parsed["min_loan_limit"] || 0;
  const max = parsed["max_loan_limit"] || 0;
  const step = parsed["loan_limit_step"] || 1;

  // Generate tier preview
  const tiers = React.useMemo(() => {
    if (min >= max || step <= 0) return [];
    const result: { label: string; amount: number }[] = [];
    for (let p = 0; p <= 100; p += 25) {
      const amount = min + ((max - min) * p) / 100;
      const rounded = Math.round(amount / step) * step;
      result.push({ label: `${p}%`, amount: rounded });
    }
    return result;
  }, [min, max, step]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure the loan limit range. The final limit is calculated by
        interpolating the credit score between min and max, rounded to the
        step value.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LIMIT_KEYS.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm">{label}</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              value={parsed[key]}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={disabled}
              className="tabular-nums"
            />
          </div>
        ))}
      </div>

      {tiers.length > 0 && (
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Tier Preview
          </p>
          <div className="grid grid-cols-5 gap-2">
            {tiers.map((t) => (
              <div key={t.label} className="text-center">
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(t.amount, "UGX")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
