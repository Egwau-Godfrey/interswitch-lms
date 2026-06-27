"use client";

import * as React from "react";
import Link from "next/link";
import {
  RefreshCw,
  Loader2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  User as UserIcon,
  Banknote,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import { RiskLevelBadge } from "@/components/shared/status-badges";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import type { ScoredAgent, CreditScoreHistoryEntry } from "@/lib/types";
import { FactorBreakdownChart } from "@/components/scoring/breakdown/factor-breakdown-chart";
import { SourceBreakdownPie } from "@/components/scoring/breakdown/source-breakdown-pie";
import { PenaltyBreakdown } from "@/components/scoring/breakdown/penalty-breakdown";
import { ScoreTrendChart } from "@/components/scoring/breakdown/score-trend-chart";
import { LoanBehaviorSummary } from "@/components/scoring/breakdown/loan-behavior-summary";

// ============================================
// Risk color helpers
// ============================================
function riskAccentClass(level: string | null | undefined): string {
  switch (level) {
    case "low":      return "bg-green-500";
    case "medium":   return "bg-amber-500";
    case "high":     return "bg-red-500";
    case "rejected": return "bg-gray-500";
    default:         return "bg-gray-400";
  }
}

function riskTextClass(level: string | null | undefined): string {
  switch (level) {
    case "low":      return "text-green-600";
    case "medium":   return "text-amber-600";
    case "rejected": return "text-gray-600";
    default:         return "text-red-600";
  }
}

function riskBgClass(level: string | null | undefined): string {
  switch (level) {
    case "low":      return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
    case "medium":   return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800";
    case "rejected": return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800";
    default:         return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
  }
}

// ============================================
// Score History Timeline
// ============================================
function ScoreHistoryTimeline({ history }: { history: CreditScoreHistoryEntry[] | undefined }) {
  if (!history || history.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-4 text-center">
        No scoring history available.
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {history.map((entry, idx) => {
          const prev = idx < history.length - 1 ? history[idx + 1] : null;
          const delta = prev ? entry.credit_score - prev.credit_score : 0;
          const scorePct = (entry.credit_score * 100).toFixed(1);
          const dotColor = riskAccentClass(entry.risk_level);

          return (
            <div key={entry.id} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full ring-2 ring-background ${dotColor}`}
              />

              <div className="rounded-lg border bg-card p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold tabular-nums">
                      {scorePct}%
                    </span>
                    {prev && delta !== 0 && (
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          delta > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {delta > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {delta > 0 ? "+" : ""}
                        {(delta * 100).toFixed(1)}%
                      </span>
                    )}
                    {prev && delta === 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Minus className="h-3 w-3" />
                        0%
                      </span>
                    )}
                  </div>
                  <RiskLevelBadge
                    riskLevel={entry.risk_level}
                    className="text-xs px-1.5 py-0"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(entry.loan_limit, "UGX")}</span>
                  <span>{formatDate(entry.created_at, "relative")}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                    {entry.scoring_method}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5">
                    {entry.trigger_type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Score Composition Flow
// ============================================
function ScoreCompositionFlow({
  ruleScore,
  mlScore,
  finalScore,
  method,
  confidence,
  riskLevel,
}: {
  ruleScore: number;
  mlScore: number;
  finalScore: number;
  method: string;
  confidence: number;
  riskLevel: string | null | undefined;
}) {
  const finalColor = riskTextClass(riskLevel);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Rule-Based */}
        <div className="flex-1 rounded-lg border bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Rule-Based</p>
          <p className="text-xl font-bold tabular-nums">
            {Math.round(ruleScore * 100)}%
          </p>
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* ML Model */}
        <div className="flex-1 rounded-lg border bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">ML Model</p>
          <p className="text-xl font-bold tabular-nums">
            {Math.round(mlScore * 100)}%
          </p>
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Final */}
        <div className={`flex-1 rounded-lg border p-3 text-center ${riskBgClass(riskLevel)}`}>
          <p className="text-xs text-muted-foreground mb-1">Final</p>
          <p className={`text-xl font-bold tabular-nums ${finalColor}`}>
            {Math.round(finalScore * 100)}%
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono">
          {method}
        </span>
        <span>·</span>
        <span>
          Confidence:{" "}
          <span className="font-semibold tabular-nums">
            {Math.round(confidence * 100)}%
          </span>
        </span>
      </div>
    </div>
  );
}

// ============================================
// Section wrapper
// ============================================
function DrawerSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {title && (
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      )}
      {children}
    </div>
  );
}

// ============================================
// Main Drawer Component
// ============================================
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
  const [activeTab, setActiveTab] = React.useState("overview");

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

  // Reset to overview tab when switching agents
  React.useEffect(() => {
    if (isOpen) setActiveTab("overview");
  }, [agent?.agent_id, isOpen]);

  if (!agent) return null;

  const riskColor = riskTextClass(agent.credit_score_risk_level);
  const accentBar = riskAccentClass(agent.credit_score_risk_level);
  const initials =
    agent.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const isLoading = historyLoading && breakdownLoading;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:max-w-[640px] p-0 flex flex-col"
        side="right"
      >
        {/* ── Sticky Header ── */}
        <div className="relative shrink-0">
          {/* Risk accent strip */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`} />

          <SheetHeader className="pb-3 pl-5">
            <SheetTitle asChild>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-tight truncate">
                    {agent.full_name ?? "Unknown Agent"}
                  </p>
                  <code className="text-xs text-muted-foreground">
                    {agent.agent_id}
                  </code>
                </div>
                <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* ── Tabs ── */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-5 pb-2 shrink-0">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="factors" className="flex-1">Factors</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Scrollable Tab Content ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-24">
            {isLoading ? (
              <div className="space-y-4 pt-2">
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
            ) : (
              <>
                {/* ════════ Overview Tab ════════ */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                  {/* Current Score Card */}
                  <div className={`rounded-lg border p-4 space-y-3 ${riskBgClass(agent.credit_score_risk_level)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Credit Score</p>
                        <p className={`text-4xl font-bold ${riskColor}`}>
                          {agent.score_percent.toFixed(1)}%
                        </p>
                      </div>
                      <RiskLevelBadge riskLevel={agent.credit_score_risk_level} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
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
                  </div>

                  {/* Score Composition */}
                  {breakdown && !breakdownLoading && (
                    <DrawerSection title="Score Composition">
                      <ScoreCompositionFlow
                        ruleScore={breakdown.rule_score ?? 0}
                        mlScore={breakdown.ml_score ?? 0}
                        finalScore={breakdown.final_score ?? breakdown.credit_score}
                        method={breakdown.scoring_method}
                        confidence={breakdown.confidence ?? 0}
                        riskLevel={agent.credit_score_risk_level}
                      />
                    </DrawerSection>
                  )}

                  {/* Score Trend */}
                  <DrawerSection title="Score Trend">
                    <ScoreTrendChart history={history} />
                  </DrawerSection>

                  {/* Source Breakdown */}
                  <DrawerSection title="Score Source Breakdown">
                    {breakdownLoading ? (
                      <Skeleton className="h-32 w-full rounded" />
                    ) : (
                      <SourceBreakdownPie data={breakdown?.source_breakdown} />
                    )}
                  </DrawerSection>

                  {/* Penalties */}
                  <DrawerSection title="Penalties Applied">
                    {breakdownLoading ? (
                      <Skeleton className="h-24 w-full rounded" />
                    ) : (
                      <PenaltyBreakdown
                        penalties={breakdown?.penalties}
                        penaltyTotal={breakdown?.penalty_total}
                      />
                    )}
                  </DrawerSection>

                  {/* Loan Behavior */}
                  <DrawerSection title="Loan Repayment Behavior">
                    {breakdownLoading ? (
                      <Skeleton className="h-32 w-full rounded" />
                    ) : (
                      <LoanBehaviorSummary behavior={breakdown?.behavior} />
                    )}
                  </DrawerSection>
                </TabsContent>

                {/* ════════ Factors Tab ════════ */}
                <TabsContent value="factors" className="space-y-6 mt-0">
                  {breakdown && !breakdownLoading && (
                    <DrawerSection title="Score Composition">
                      <ScoreCompositionFlow
                        ruleScore={breakdown.rule_score ?? 0}
                        mlScore={breakdown.ml_score ?? 0}
                        finalScore={breakdown.final_score ?? breakdown.credit_score}
                        method={breakdown.scoring_method}
                        confidence={breakdown.confidence ?? 0}
                        riskLevel={agent.credit_score_risk_level}
                      />
                    </DrawerSection>
                  )}

                  <DrawerSection title="Factor Breakdown">
                    {breakdownLoading ? (
                      <Skeleton className="h-48 w-full rounded" />
                    ) : (
                      <FactorBreakdownChart factors={breakdown?.factors} />
                    )}
                  </DrawerSection>
                </TabsContent>

                {/* ════════ History Tab ════════ */}
                <TabsContent value="history" className="space-y-4 mt-0">
                  <DrawerSection title="Score History Timeline">
                    {historyLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <ScoreHistoryTimeline history={history} />
                    )}
                  </DrawerSection>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        {/* ── Sticky Footer ── */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 px-5 py-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
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
            {reScoreMutation.isLoading ? "Scoring..." : "Re-score"}
          </Button>

          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/super-admin/agents/${agent.agent_id}`}>
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </Button>

          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/super-admin/loans?search=${agent.agent_id}`}>
              <Banknote className="h-4 w-4 mr-2" />
              Loans
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
