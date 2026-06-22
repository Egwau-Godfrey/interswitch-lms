"use client";

import * as React from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import { RiskLevelBadge } from "@/components/shared/status-badges";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import type { ScoredAgent } from "@/lib/types";
import { FactorBreakdownChart } from "@/components/scoring/breakdown/factor-breakdown-chart";
import { SourceBreakdownPie } from "@/components/scoring/breakdown/source-breakdown-pie";
import { PenaltyBreakdown } from "@/components/scoring/breakdown/penalty-breakdown";
import { ScoreTrendChart } from "@/components/scoring/breakdown/score-trend-chart";
import { LoanBehaviorSummary } from "@/components/scoring/breakdown/loan-behavior-summary";

interface ScoreDetailDrawerProps {
  agent: ScoredAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onReScoreSuccess: () => void;
  hasWriteAccess?: boolean;
  writeTooltip?: string;
}

export function ScoreDetailDrawer({
  agent,
  isOpen,
  onClose,
  onReScoreSuccess,
  hasWriteAccess = true,
  writeTooltip = "Write access requires a grant from a super admin",
}: ScoreDetailDrawerProps) {
  const { data: history, isLoading: historyLoading } = useApi(
    () => scoringDashboardApi.getScoreHistory(agent!.agent_id, 10),
    [agent?.agent_id],
    {
      cacheKey: `score-history-${agent?.agent_id}`,
      enabled: !!agent && isOpen,
    }
  );

  const { data: breakdown, isLoading: breakdownLoading } = useApi(
    () => scoringDashboardApi.getScoreBreakdown(agent!.agent_id),
    [agent?.agent_id],
    {
      cacheKey: `score-breakdown-${agent?.agent_id}`,
      enabled: !!agent && isOpen,
    }
  );

  const reScoreMutation = useMutation(
    () => scoringDashboardApi.triggerScore(agent!.agent_id),
    {
      onSuccess: (result) => {
        if (result?.success) {
          toast.success("Agent re-scored successfully");
        } else {
          toast.error(result?.message || "Re-scoring failed");
          return;
        }
        onReScoreSuccess();
        onClose();
      },
      onError: (e) => toast.error(e.message || "Re-scoring failed"),
    }
  );

  if (!agent) return null;

  const riskColorClass =
    agent.credit_score_risk_level === "low"
      ? "text-green-600"
      : agent.credit_score_risk_level === "medium"
      ? "text-amber-600"
      : agent.credit_score_risk_level === "rejected"
      ? "text-gray-600"
      : "text-red-600";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:max-w-[500px] overflow-y-auto"
        side="right"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">{agent.full_name}</p>
              <code className="text-xs text-muted-foreground">
                {agent.agent_id}
              </code>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Separator className="mb-4" />

        {/* Current Score Card */}
        <div className="rounded-lg border bg-card p-4 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Credit Score</p>
              <p className={`text-4xl font-bold ${riskColorClass}`}>
                {agent.score_percent.toFixed(1)}%
              </p>
            </div>
            <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Loan Limit</p>
              <p className="font-semibold">
                {formatCurrency(agent.loan_limit, "UGX")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Scored</p>
              <p className="font-semibold">
                {formatDate(agent.last_scored_at, "relative")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={reScoreMutation.isLoading || !hasWriteAccess}
            title={hasWriteAccess ? undefined : writeTooltip}
            onClick={() => {
              if (!hasWriteAccess) {
                toast.error("View-only access", {
                  description: "Re-scoring requires write access granted by a super admin.",
                });
                return;
              }
              reScoreMutation.mutate(undefined as any);
            }}
          >
            {reScoreMutation.isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {reScoreMutation.isLoading ? "Re-scoring..." : "Re-score"}
          </Button>
        </div>

        {/* Rule vs ML vs Final Score */}
        {breakdown && !breakdownLoading && (
          <div className="rounded-lg border bg-card p-4 space-y-2 mb-6">
            <h3 className="text-sm font-semibold">Score Composition</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">Rule-Based</p>
                <p className="text-lg font-bold tabular-nums">
                  {Math.round((breakdown.rule_score ?? 0) * 100)}%
                </p>
              </div>
              <div className="rounded-md bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">ML Model</p>
                <p className="text-lg font-bold tabular-nums">
                  {Math.round((breakdown.ml_score ?? 0) * 100)}%
                </p>
              </div>
              <div className="rounded-md bg-primary/10 p-2">
                <p className="text-xs text-muted-foreground">Final</p>
                <p className="text-lg font-bold tabular-nums text-primary">
                  {Math.round((breakdown.final_score ?? breakdown.credit_score) * 100)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Method: {breakdown.scoring_method} · Confidence:{" "}
              {Math.round((breakdown.confidence ?? 0) * 100)}%
            </p>
          </div>
        )}

        {/* Score Trend Chart */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Score Trend</h3>
          <ScoreTrendChart history={history} />
        </div>

        <Separator className="mb-4" />

        {/* Factor Breakdown */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Factor Breakdown</h3>
          {breakdownLoading ? (
            <Skeleton className="h-32 w-full rounded" />
          ) : (
            <FactorBreakdownChart factors={breakdown?.factors} />
          )}
        </div>

        <Separator className="mb-4" />

        {/* Source Breakdown */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Score Source Breakdown</h3>
          {breakdownLoading ? (
            <Skeleton className="h-32 w-full rounded" />
          ) : (
            <SourceBreakdownPie data={breakdown?.source_breakdown} />
          )}
        </div>

        <Separator className="mb-4" />

        {/* Penalties */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Penalties Applied</h3>
          {breakdownLoading ? (
            <Skeleton className="h-24 w-full rounded" />
          ) : (
            <PenaltyBreakdown
              penalties={breakdown?.penalties}
              penaltyTotal={breakdown?.penalty_total}
            />
          )}
        </div>

        <Separator className="mb-4" />

        {/* Loan Behavior */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Loan Repayment Behavior</h3>
          {breakdownLoading ? (
            <Skeleton className="h-32 w-full rounded" />
          ) : (
            <LoanBehaviorSummary behavior={breakdown?.behavior} />
          )}
        </div>

        <Separator className="mb-4" />

        {/* Score History */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Score History</h3>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <RiskLevelBadge
                      riskLevel={entry.risk_level}
                      className="text-xs px-1 py-0.5"
                    />
                    <span className="font-mono font-semibold">
                      {(entry.credit_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground text-right space-y-0.5">
                    <p>{formatCurrency(entry.loan_limit, "UGX")}</p>
                    <p>
                      {entry.scoring_method} · {entry.trigger_type}
                    </p>
                    <p>{formatDate(entry.created_at, "relative")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No scoring history available.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
