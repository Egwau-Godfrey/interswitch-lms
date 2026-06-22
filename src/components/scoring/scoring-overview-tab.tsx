"use client";

import * as React from "react";
import { RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useApi, usePagination } from "@/hooks/use-api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import { ScoringStatsCards } from "@/components/scoring/scoring-stats-cards";
import { ScoringFiltersToolbar } from "@/components/scoring/scoring-filters-toolbar";
import { ScoringTable } from "@/components/scoring/scoring-table";
import { ScoreDetailDrawer } from "@/components/scoring/score-detail-drawer";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import type { ScoredAgent, RiskLevel } from "@/lib/types";

interface ScoringOverviewTabProps {
  hasWriteAccess: boolean;
  writeTooltip: string;
  isUser: boolean;
  basePath: string;
}

export function ScoringOverviewTab({
  hasWriteAccess,
  writeTooltip,
  isUser,
  basePath,
}: ScoringOverviewTabProps) {
  const [search, setSearch] = React.useState("");
  const [riskLevel, setRiskLevel] = React.useState<RiskLevel | "all">("all");
  const [scoreMin, setScoreMin] = React.useState<number | undefined>(undefined);
  const [scoreMax, setScoreMax] = React.useState<number | undefined>(undefined);
  const [scoredFrom, setScoredFrom] = React.useState<string | undefined>(undefined);
  const [scoredTo, setScoredTo] = React.useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState("last_scored_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selectedAgent, setSelectedAgent] = React.useState<ScoredAgent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [reScoringAgentId, setReScoringAgentId] = React.useState<string | null>(null);
  const [isRescoringAll, setIsRescoringAll] = React.useState(false);

  const { page, pageSize, setPage, setPageSize } = usePagination();

  const apiParams = React.useMemo(() => ({
    page,
    page_size: pageSize,
    search: search || undefined,
    risk_level: riskLevel !== "all" ? riskLevel : undefined,
    score_min: scoreMin !== undefined ? scoreMin / 100 : undefined,
    score_max: scoreMax !== undefined ? scoreMax / 100 : undefined,
    scored_from: scoredFrom,
    scored_to: scoredTo,
    sort_by: sortBy,
    sort_order: sortOrder,
  }), [page, pageSize, search, riskLevel, scoreMin, scoreMax, scoredFrom, scoredTo, sortBy, sortOrder]);

  const cacheKey = `scored-agents-${page}-${pageSize}-${search}-${riskLevel}-${scoreMin}-${scoreMax}-${scoredFrom}-${scoredTo}-${sortBy}-${sortOrder}`;

  const { data: agentsData, isLoading: listLoading, error: listError, refetch } = useApi(
    () => scoringDashboardApi.listScoredAgents(apiParams as any),
    [cacheKey],
    { cacheKey }
  );

  const { data: stats, isLoading: statsLoading } = useApi(
    () => scoringDashboardApi.getStats(),
    ["scoring-stats"],
    { cacheKey: "scoring-stats" }
  );

  const agents = agentsData?.data ?? [];
  const totalItems = agentsData?.total ?? 0;
  const totalPages = agentsData?.total_pages ?? 0;

  const handleSortChange = (col: string) => {
    if (col === sortBy) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleReScore = async (agentId: string) => {
    if (!hasWriteAccess) {
      toast.error("Write access required", {
        description: "Contact a super admin to grant scoring write access.",
      });
      return;
    }
    setReScoringAgentId(agentId);
    try {
      const result = await scoringDashboardApi.triggerScore(agentId);
      if (result.success) {
        toast.success(`Agent re-scored. New score: ${((result.score ?? 0) * 100).toFixed(1)}%`);
      } else {
        toast.error(result.message || "Re-scoring failed");
      }
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Re-scoring failed");
    } finally {
      setReScoringAgentId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setRiskLevel("all");
    setScoreMin(undefined);
    setScoreMax(undefined);
    setScoredFrom(undefined);
    setScoredTo(undefined);
    setPage(1);
  };

  const handleRescoreAll = async () => {
    if (!hasWriteAccess) {
      toast.error("Write access required");
      return;
    }
    setIsRescoringAll(true);
    try {
      const result = await scoringDashboardApi.rescoreAll();
      toast.success("Rescore complete", {
        description: `${result.succeeded} scored, ${result.skipped} skipped, ${result.failed} failed out of ${result.total} agents.`,
        duration: 8000,
      });
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Rescore-all failed");
    } finally {
      setIsRescoringAll(false);
    }
  };

  const exportParams = React.useMemo(() => ({
    search: search || undefined,
    risk_level: riskLevel !== "all" ? riskLevel : undefined,
    score_min: scoreMin !== undefined ? scoreMin / 100 : undefined,
    score_max: scoreMax !== undefined ? scoreMax / 100 : undefined,
    scored_from: scoredFrom,
    scored_to: scoredTo,
    sort_by: sortBy,
    sort_order: sortOrder,
  } as any), [search, riskLevel, scoreMin, scoreMax, scoredFrom, scoredTo, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {isUser && !hasWriteAccess && <WriteAccessAlert tabLabel="credit scoring" />}

      <div className="flex items-center justify-end gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              disabled={isRescoringAll || !hasWriteAccess}
              title={hasWriteAccess ? undefined : writeTooltip}
            >
              {isRescoringAll ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isRescoringAll ? "Rescoring All..." : "Rescore All Agents"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rescore all agents?</AlertDialogTitle>
              <AlertDialogDescription>
                This will re-run the credit scoring engine for every agent in the system
                and update their loan limits and risk levels. This may take a while depending
                on the number of agents. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRescoreAll}>
                Yes, Rescore All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <ScoringStatsCards stats={stats} isLoading={statsLoading} />

      <ScoringFiltersToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        riskLevel={riskLevel}
        onRiskLevelChange={(v) => { setRiskLevel(v); setPage(1); }}
        scoreMin={scoreMin}
        scoreMax={scoreMax}
        onScoreRangeChange={(min, max) => { setScoreMin(min); setScoreMax(max); setPage(1); }}
        scoredFrom={scoredFrom}
        scoredTo={scoredTo}
        onDateRangeChange={(from, to) => { setScoredFrom(from); setScoredTo(to); setPage(1); }}
        onReset={handleResetFilters}
        onExportCsv={() => scoringDashboardApi.exportScoredAgents(exportParams, "csv")}
        onExportExcel={() => scoringDashboardApi.exportScoredAgents(exportParams, "xlsx")}
      />

      <ScoringTable
        agents={agents}
        isLoading={listLoading || !agentsData}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowClick={(agent) => { setSelectedAgent(agent); setIsDrawerOpen(true); }}
        onReScore={handleReScore}
        reScoringAgentId={reScoringAgentId}
        hasWriteAccess={hasWriteAccess}
        writeTooltip={writeTooltip}
        basePath={basePath}
      />

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />

      <ScoreDetailDrawer
        agent={selectedAgent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onReScoreSuccess={() => refetch()}
        hasWriteAccess={hasWriteAccess}
        writeTooltip={writeTooltip}
      />
    </div>
  );
}
