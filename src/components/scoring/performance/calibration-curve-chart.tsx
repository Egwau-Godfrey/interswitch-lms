"use client";

import * as React from "react";
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { CalibrationBucket } from "@/lib/types/scoring";

interface Props {
  data: CalibrationBucket[];
}

interface ChartPoint {
  score_midpoint: number;
  score_bucket: string;
  predicted_default_prob: number;
  actual_default_rate: number;
  count: number;
  gap: number;
}

interface TooltipPayloadEntry {
  payload: ChartPoint | Record<string, unknown>;
  name?: string;
  dataKey?: string | number;
  value?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  // The ComposedChart has 3 series (perfect line, predicted line, actual scatter).
  // payload[0] may come from the perfect-calibration line which only has
  // { score_midpoint, perfect }. Search for the entry that has the full
  // ChartPoint data (identified by the presence of `score_bucket`).
  const fullEntry = payload.find(
    (entry) => entry.payload && typeof (entry.payload as ChartPoint).score_bucket === "string"
  );
  const p = fullEntry?.payload as ChartPoint | undefined;
  if (!p) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-xs space-y-1">
      <p className="font-medium">{p.score_bucket}</p>
      <p className="text-muted-foreground">
        Score midpoint: <span className="font-mono">{(p.score_midpoint * 100).toFixed(0)}%</span>
      </p>
      <p className="text-blue-600">
        Predicted default: <span className="font-mono">{(p.predicted_default_prob * 100).toFixed(0)}%</span>
      </p>
      <p className="text-primary">
        Actual default: <span className="font-mono">{(p.actual_default_rate * 100).toFixed(1)}%</span>
      </p>
      <p className="text-muted-foreground">
        Gap: <span className={`font-mono ${p.gap > 0.15 ? "text-amber-600" : "text-green-600"}`}>
          {(p.gap * 100).toFixed(0)}%
        </span>
      </p>
      <p className="text-muted-foreground">{p.count} loans in bucket</p>
    </div>
  );
}

export function CalibrationCurveChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">No calibration data available.</p>
      </Card>
    );
  }

  // Parse bucket ranges to compute midpoints for the x-axis
  const chartData: ChartPoint[] = data.map((d) => {
    const match = d.score_bucket.match(/([\d.]+)-([\d.]+)/);
    let lo = 0, hi = 1;
    if (match) {
      lo = parseFloat(match[1]);
      hi = parseFloat(match[2]);
    }
    const midpoint = (lo + Math.min(hi, 1.0)) / 2;
    return {
      score_midpoint: midpoint,
      score_bucket: d.score_bucket,
      predicted_default_prob: d.predicted_default_prob,
      actual_default_rate: d.actual_default_rate,
      count: d.count,
      gap: Math.abs(d.predicted_default_prob - d.actual_default_rate),
    };
  });

  // Perfect calibration line: at score 0 → 100% default, at score 1 → 0% default
  const perfectCalibrationData = [
    { score_midpoint: 0, perfect: 1.0 },
    { score_midpoint: 1, perfect: 0.0 },
  ];

  const maxGap = Math.max(...chartData.map((d) => d.gap));
  const hasData = chartData.some((d) => d.count > 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">Calibration Curve</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  Compares the model&apos;s predicted default probability
                  (blue line) against the actual default rate (dots) in each
                  score bucket. The x-axis is the credit score — higher scores
                  should have lower default rates. A well-calibrated model has
                  dots close to the line. Large gaps mean the model over- or
                  under-predicts risk in certain score ranges.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge
          variant="secondary"
          className={maxGap > 0.15 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}
        >
          Max gap: {(maxGap * 100).toFixed(0)}%
        </Badge>
      </div>

      {!hasData ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No loans with outcomes in any score bucket yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, bottom: 30, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.4} />
            <XAxis
              dataKey="score_midpoint"
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1.0]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              label={{
                value: "Credit Score",
                position: "insideBottom",
                offset: -15,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1.0]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              label={{
                value: "Default Rate",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <RTooltip content={<CustomTooltip />} />

            {/* Perfect calibration reference line (diagonal) */}
            <Line
              data={perfectCalibrationData}
              type="linear"
              dataKey="perfect"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 2"
              strokeWidth={1}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              name="Perfect"
            />

            {/* Predicted default probability line */}
            <Line
              type="monotone"
              dataKey="predicted_default_prob"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6" }}
              activeDot={{ r: 5 }}
              name="Predicted"
            />

            {/* Actual default rate as scatter dots */}
            <Scatter
              dataKey="actual_default_rate"
              fill="hsl(var(--primary))"
              name="Actual"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-blue-500" />
          Predicted default probability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
          Actual default rate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0 border-t-2 border-dashed border-muted-foreground opacity-50" />
          Perfect calibration
        </span>
      </div>

      {/* Bucket details table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-2 py-1.5 font-medium">Score Bucket</th>
              <th className="text-right px-2 py-1.5 font-medium">Predicted</th>
              <th className="text-right px-2 py-1.5 font-medium">Actual</th>
              <th className="text-right px-2 py-1.5 font-medium">Gap</th>
              <th className="text-right px-2 py-1.5 font-medium">Loans</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((b) => (
              <tr key={b.score_bucket} className="border-t">
                <td className="px-2 py-1.5 font-medium">{b.score_bucket}</td>
                <td className="text-right px-2 py-1.5 tabular-nums text-blue-600">
                  {(b.predicted_default_prob * 100).toFixed(0)}%
                </td>
                <td className="text-right px-2 py-1.5 tabular-nums">
                  {b.count > 0 ? `${(b.actual_default_rate * 100).toFixed(1)}%` : "—"}
                </td>
                <td className={`text-right px-2 py-1.5 tabular-nums ${b.gap > 0.15 ? "text-amber-600" : "text-green-600"}`}>
                  {b.count > 0 ? `${(b.gap * 100).toFixed(0)}%` : "—"}
                </td>
                <td className="text-right px-2 py-1.5 tabular-nums text-muted-foreground">
                  {b.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
