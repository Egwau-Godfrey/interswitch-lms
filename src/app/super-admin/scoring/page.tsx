"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApi, usePagination } from "@/hooks/use-api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import { apiClient } from "@/lib/api/client";
import { ScoringStatsCards } from "@/components/scoring/scoring-stats-cards";
import { ScoringFiltersToolbar } from "@/components/scoring/scoring-filters-toolbar";
import { ScoringTable } from "@/components/scoring/scoring-table";
import { ScoreDetailDrawer } from "@/components/scoring/score-detail-drawer";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ErrorState } from "@/components/shared/loading-states";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import type { ScoredAgent, RiskLevel } from "@/lib/types";

// Try to load permissions context — only available when rendered under /user layout
// Super admin pages don't wrap with PermissionsProvider so we handle the missing context gracefully
let usePermissionsHook: (() => { hasWriteAccess: (tab: string) => boolean; isLoading: boolean; refetch: () => void }) | null = null;
try {
  const ctx = require("@/contexts/permissions-context");
  usePermissionsHook = ctx.usePermissions;
} catch {
  usePermissionsHook = null;
}

export default function ScoringPage() {
  const { data: session, status: authStatus } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const isUser = role === "user";
  // For super_admin: always has write. For user: check grants. Fallback: allow.
  const permCtx = usePermissionsHook ? usePermissionsHook() : null;
  const hasWriteAccess = role === "super_admin" || (session?.user as any)?.isAdmin
    ? true
    : (permCtx ? permCtx.hasWriteAccess("scoring") : !isUser);
  const permLoading = permCtx ? permCtx.isLoading : false;
  const writeDisabled = permLoading || !hasWriteAccess;
  const writeTooltip = "Write access requires a grant from a super admin";
  const [mounted, setMounted] = React.useState(false);

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

  const { page, pageSize, setPage, setPageSize } = usePagination();

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

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
    [cacheKey, mounted, authStatus === "authenticated"],
    { cacheKey, enabled: mounted && authStatus === "authenticated" }
  );

  const { data: stats, isLoading: statsLoading } = useApi(
    () => scoringDashboardApi.getStats(),
    [mounted, authStatus === "authenticated"],
    { cacheKey: "scoring-stats", enabled: mounted && authStatus === "authenticated" }
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
      if ((e as any)?.message?.includes("403") || (e as any)?.message?.includes("Write access")) {
        toast.error("Write access has expired or been revoked");
        permCtx?.refetch();
      } else {
        toast.error(e?.message || "Re-scoring failed");
      }
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

  if (!mounted) return null;

  if (listError && listError.message !== "No access token available") {
    return <ErrorState message={listError.message || "Failed to load scored agents"} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {isUser && !hasWriteAccess && <WriteAccessAlert tabLabel="credit scoring" />}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Scoring</h1>
          <p className="text-muted-foreground">View and manage credit scores for all agents.</p>
        </div>
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
        basePath={isUser ? "/user" : "/super-admin"}
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
