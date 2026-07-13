"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ConfidenceCalibrationBucket } from "@/lib/types/scoring";

interface Props {
  data: ConfidenceCalibrationBucket[];
}

export function ConfidenceCalibrationCard({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No confidence calibration data available.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Confidence Calibration</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Shows whether the model&apos;s confidence score correlates with
                actual prediction accuracy. Higher confidence should correspond
                to lower default rates. If high-confidence predictions have high
                default rates, the model is over-confident.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        {data.map((b) => {
          const isCalibrated = b.actual_default_rate < 0.20;
          const isOverConfident = b.actual_default_rate > 0.30;
          return (
            <div key={b.confidence_bucket} className="flex items-center gap-3">
              <span className="text-xs w-20 font-medium">{b.confidence_bucket}</span>
              <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden">
                <div
                  className={`h-full ${isOverConfident ? "bg-red-500" : isCalibrated ? "bg-green-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.max(b.actual_default_rate * 100, 2)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums w-12 text-right">
                {(b.actual_default_rate * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-muted-foreground w-12 text-right">
                {b.count} loans
              </span>
              {isOverConfident ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" /> Calibrated
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Over-confident
        </span>
      </div>
    </Card>
  );
}
