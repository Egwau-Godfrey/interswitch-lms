"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
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

  // Debounce date inputs to avoid firing multiple API calls while typing
  const [debouncedFrom, setDebouncedFrom] = React.useState("");
  const [debouncedTo, setDebouncedTo] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFrom(dateFrom);
      setDebouncedTo(dateTo);
    }, 300);
    return () => clearTimeout(timer);
  }, [dateFrom, dateTo]);

  const params = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedFrom) p.date_from = debouncedFrom;
    if (debouncedTo) p.date_to = debouncedTo;
    if (methodFilter) p.scoring_method = methodFilter;
    return p;
  }, [debouncedFrom, debouncedTo, methodFilter]);

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

  const today = new Date().toISOString().split("T")[0];
  const hasFilters = !!(dateFrom || dateTo || methodFilter);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setMethodFilter("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            {hasFilters ? (
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
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3" />
            Clear Filters
          </Button>
        )}
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
            max={dateTo || today}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date To</Label>
          <Input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            max={today}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Scoring Method</Label>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rules">Rules Only</SelectItem>
              <SelectItem value="ml">ML Only</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="h-8">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
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
