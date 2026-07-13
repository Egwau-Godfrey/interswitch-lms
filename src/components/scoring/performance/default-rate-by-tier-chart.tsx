"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { DefaultRateByTier } from "@/lib/types/scoring";

interface Props {
  data: DefaultRateByTier[];
}

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
  rejected: "bg-gray-500",
};

const EXPECTED: Record<string, string> = {
  low: "< 5%",
  medium: "10–20%",
  high: "> 30%",
  rejected: "N/A",
};

export function DefaultRateByTierChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No default rate data available.</p>
      </Card>
    );
  }

  const maxRate = Math.max(...data.map((d) => d.default_rate), 0.5);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Default Rate by Risk Tier</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Shows the actual percentage of loans that defaulted for each
                predicted risk tier. If low-risk agents default at &gt;5%, the
                model is under-predicting risk. If high-risk agents rarely
                default, it&apos;s over-predicting.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        {data.map((tier) => (
          <div key={tier.risk_level} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium capitalize">{tier.risk_level} Risk</span>
              <span className="tabular-nums">
                {tier.defaults}/{tier.total} ({(tier.default_rate * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden">
                <div
                  className={`h-full ${RISK_COLORS[tier.risk_level] ?? "bg-gray-500"} flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max((tier.default_rate / maxRate) * 100, 5)}%` }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {(tier.default_rate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground w-20">
                Expected: {EXPECTED[tier.risk_level] ?? "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
