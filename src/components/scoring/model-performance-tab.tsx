"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/use-api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import { PerformanceSummaryCards as PerformanceSummaryCard } from "./performance/performance-summary-cards";
import { ConfusionMatrixCard } from "./performance/confusion-matrix-card";
import { DefaultRateByTierChart } from "./performance/default-rate-by-tier-chart";
import { CalibrationCurveChart } from "./performance/calibration-curve-chart";
import { MethodComparisonChart } from "./performance/method-comparison-chart";
import { FactorPredictivePowerChart } from "./performance/factor-predictive-power-chart";
import { ScoreDriftCard } from "./performance/score-drift-card";
import { LoanLimitAccuracyCard } from "./performance/loan-limit-accuracy-card";
import { ConfidenceCalibrationCard } from "./performance/confidence-calibration-card";
import { OverdueBreakdownCard } from "./performance/overdue-breakdown-card";
import { AutostrikeRecoveryCard } from "./performance/autostrike-recovery-card";
import { PredictionOutcomeTable } from "./performance/prediction-outcome-table";
import { RecommendationsCard } from "./performance/recommendations-card";

export function ModelPerformanceTab() {
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [methodFilter, setMethodFilter] = React.useState("");

  const params = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    if (methodFilter) p.scoring_method = methodFilter;
    return p;
  }, [dateFrom, dateTo, methodFilter]);

  // Cache key includes params so each filter combo has its own cache entry
  const cacheKey = React.useMemo(() => {
    const parts = ["model-performance"];
    if (params.date_from) parts.push(`from:${params.date_from}`);
    if (params.date_to) parts.push(`to:${params.date_to}`);
    if (params.scoring_method) parts.push(`method:${params.scoring_method}`);
    return parts.join("|");
  }, [params]);

  const { data, isLoading, error } = useApi(
    () => scoringDashboardApi.getModelPerformance(params),
    [cacheKey],
    { cacheKey }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load model performance data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.summary.total_loans_evaluated === 0) {
    const isFiltered = !!(dateFrom || dateTo || methodFilter);
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            {isFiltered ? (
              <>
                No loans match the selected filters
                {methodFilter && ` (method: ${methodFilter})`}
                {dateFrom && ` from ${dateFrom}`}
                {dateTo && ` to ${dateTo}`}.
                Try selecting &quot;All Methods&quot; or widening the date range.
                Most loans are likely scored with a different method than the
                one selected.
              </>
            ) : (
              <>
                No prediction vs outcome data available yet. This section will
                populate once loans are disbursed and their outcomes (repaid,
                overdue, or defaulted) are recorded.
              </>
            )}
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Date From", "Date To", "Method", ""].map((label, i) => (
            <div key={i} className="space-y-1.5">
              {label && <Label className="text-xs">{label}</Label>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Date From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Scoring Method</Label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="">All Methods</option>
            <option value="rules">Rules Only</option>
            <option value="ml">ML Only</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <PerformanceSummaryCard summary={data.summary} />

      {/* Confusion matrix + Default rate by tier */}
      <div className="grid gap-4 md:grid-cols-2">
        <ConfusionMatrixCard matrix={data.confusion_matrix} />
        <DefaultRateByTierChart data={data.default_rate_by_tier} />
      </div>

      {/* Calibration curve */}
      <CalibrationCurveChart data={data.calibration} />

      {/* Method comparison + Factor predictive power */}
      <div className="grid gap-4 md:grid-cols-2">
        <MethodComparisonChart data={data.method_comparison} />
        <FactorPredictivePowerChart data={data.factor_predictive_power} />
      </div>

      {/* Score drift + Loan limit accuracy */}
      <div className="grid gap-4 md:grid-cols-2">
        <ScoreDriftCard data={data.score_drift} />
        <LoanLimitAccuracyCard data={data.loan_limit_accuracy} />
      </div>

      {/* Confidence calibration */}
      <ConfidenceCalibrationCard data={data.confidence_calibration} />

      {/* Overdue breakdown + Auto-strike recovery */}
      <div className="grid gap-4 md:grid-cols-2">
        <OverdueBreakdownCard data={data.overdue_breakdown} />
        <AutostrikeRecoveryCard data={data.autostrike_recovery} />
      </div>

      {/* Agent-level table */}
      <PredictionOutcomeTable data={data.agent_level_details} />

      {/* Recommendations */}
      <RecommendationsCard recommendations={data.recommendations} />
    </div>
  );
}
