"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { CalibrationBucket } from "@/lib/types/scoring";

interface Props {
  data: CalibrationBucket[];
}

export function CalibrationCurveChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No calibration data available.</p>
      </Card>
    );
  }

  const width = 100;
  const height = 100;

  // Build points for actual default rate
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.actual_default_rate * height);
    return { x, y, ...d };
  });

  // Perfect calibration line (diagonal)
  const linePath = `M 0,${height} L ${width},0`;
  // Actual curve
  const actualPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  const maxGap = Math.max(
    ...data.map((d) => Math.abs(d.predicted_default_prob - d.actual_default_rate))
  );

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-medium">Calibration Curve</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-xs">
                Compares the model&apos;s predicted default probability against
                the actual default rate in each score bucket. A well-calibrated
                model has points close to the diagonal line. Large gaps indicate
                the model over- or under-predicts risk in certain score ranges.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative w-full" style={{ paddingBottom: "100%" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="hsl(var(--muted))" strokeWidth="0.3" strokeDasharray="2" />
          <line x1={width * 0.5} y1="0" x2={width * 0.5} y2={height} stroke="hsl(var(--muted))" strokeWidth="0.3" strokeDasharray="2" />

          {/* Perfect calibration line */}
          <path d={linePath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="2,1" />

          {/* Actual curve */}
          <path d={actualPath} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="hsl(var(--primary))" />
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-primary" /> Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 border-t border-dashed border-muted-foreground" /> Perfect
          </span>
        </div>
        <span className={`tabular-nums ${maxGap > 0.15 ? "text-amber-600" : "text-green-600"}`}>
          Max gap: {(maxGap * 100).toFixed(0)}%
        </span>
      </div>

      {/* Bucket details */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.map((b) => (
          <div key={b.score_bucket} className="rounded border p-1.5 text-center">
            <p className="text-[10px] text-muted-foreground">{b.score_bucket}</p>
            <p className="text-xs font-medium tabular-nums">
              {(b.actual_default_rate * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">{b.count} loans</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
