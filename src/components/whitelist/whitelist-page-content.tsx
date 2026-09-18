"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  ShieldX,
  Plus,
  Trash2,
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  MoreVertical,
  Eye,
  ListChecks,
  Upload,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { whitelistApi } from "@/lib/api";
import { prequalificationApi, type PrequalificationOnboardResult } from "@/lib/api/whitelist";
import { settingsApi } from "@/lib/api/settings";
import type {
  WhitelistEntry,
  NonWhitelistedAgent,
  WhitelistListResponse,
  NonWhitelistedListResponse,
} from "@/lib/types";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { LoadingState, ErrorState } from "@/components/shared/loading-states";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import { formatDate } from "@/components/shared/stat-card";

interface WhitelistPageContentProps {
  isUser?: boolean;
  canWrite: boolean;
  writeDisabled: boolean;
}

export function WhitelistPageContent({
  isUser = false,
  canWrite,
  writeDisabled,
}: WhitelistPageContentProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [activeTab, setActiveTab] = React.useState<"whitelisted" | "non-whitelisted">("whitelisted");
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [removeEntry, setRemoveEntry] = React.useState<WhitelistEntry | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkRemoveOpen, setBulkRemoveOpen] = React.useState(false);
  const [whitelistMode, setWhitelistMode] = React.useState(false);
  const [whitelistModeLoading, setWhitelistModeLoading] = React.useState(false);

  const basePath = isUser ? "/user" : "/super-admin";

  // Fetch whitelisted agents
  const {
    data: whitelistData,
    isLoading: wlLoading,
    error: wlError,
    refetch: refetchWhitelist,
  } = useApi(
    () => whitelistApi.list({ page, page_size: pageSize, search: searchQuery || undefined }),
    [page, pageSize, searchQuery, activeTab === "whitelisted"],
    {
      cacheKey: `whitelist-${page}-${pageSize}-${searchQuery}`,
      enabled: activeTab === "whitelisted",
    }
  );

  // Fetch non-whitelisted agents
  const {
    data: nonWlData,
    isLoading: nonWlLoading,
    error: nonWlError,
    refetch: refetchNonWl,
  } = useApi(
    () => whitelistApi.listNonWhitelisted({ page, page_size: pageSize, search: searchQuery || undefined }),
    [page, pageSize, searchQuery, activeTab === "non-whitelisted"],
    {
      cacheKey: `non-whitelist-${page}-${pageSize}-${searchQuery}`,
      enabled: activeTab === "non-whitelisted",
    }
  );

  // Fetch whitelist mode setting
  const { data: modeSetting } = useApi(
    () => settingsApi.get("whitelist_mode_enabled"),
    [],
    { cacheKey: "whitelist-mode-setting" }
  );

  React.useEffect(() => {
    if (modeSetting) {
      setWhitelistMode(modeSetting.value.toLowerCase() === "true");
    }
  }, [modeSetting]);

  // Toggle whitelist mode
  const toggleWhitelistMode = async (enabled: boolean) => {
    setWhitelistModeLoading(true);
    try {
      await settingsApi.update("whitelist_mode_enabled", enabled ? "true" : "false");
      setWhitelistMode(enabled);
      toast.success(enabled ? "Whitelist mode enabled" : "Whitelist mode disabled", {
        description: enabled
          ? "Only whitelisted agents can now apply for loans."
          : "All active agents can apply for loans.",
      });
    } catch (err: any) {
      toast.error("Failed to update whitelist mode", { description: err.message });
    } finally {
      setWhitelistModeLoading(false);
    }
  };

  // Add to whitelist mutation
  const addMutation = useMutation(
    (data: { agent_id: string; notes?: string }) => whitelistApi.add(data),
    {
      successMessage: "Agent added to whitelist",
      onSuccess: () => {
        setAddDialogOpen(false);
        refetchWhitelist();
        refetchNonWl();
      },
      onError: (err) => {
        toast.error("Failed to add agent", { description: err.message });
      },
    }
  );

  // Remove from whitelist mutation
  const removeMutation = useMutation(
    (agentId: string) => whitelistApi.remove(agentId),
    {
      successMessage: "Agent removed from whitelist",
      onSuccess: () => {
        setRemoveEntry(null);
        refetchWhitelist();
        refetchNonWl();
      },
      onError: (err) => {
        toast.error("Failed to remove agent", { description: err.message });
      },
    }
  );

  // Bulk add mutation
  const bulkAddMutation = useMutation(
    (data: { agent_ids: string[] }) => whitelistApi.bulkAdd(data),
    {
      onSuccess: (result) => {
        toast.success(`Added ${result.succeeded} agent(s) to whitelist`, {
          description: result.failed > 0 ? `${result.failed} failed` : undefined,
        });
        setSelectedIds(new Set());
        refetchWhitelist();
        refetchNonWl();
      },
      onError: (err) => {
        toast.error("Bulk add failed", { description: err.message });
      },
    }
  );

  // Bulk remove mutation
  const bulkRemoveMutation = useMutation(
    (data: { agent_ids: string[] }) => whitelistApi.bulkRemove(data),
    {
      onSuccess: (result) => {
        toast.success(`Removed ${result.succeeded} agent(s) from whitelist`, {
          description: result.failed > 0 ? `${result.failed} failed` : undefined,
        });
        setSelectedIds(new Set());
        setBulkRemoveOpen(false);
        refetchWhitelist();
        refetchNonWl();
      },
      onError: (err) => {
        toast.error("Bulk remove failed", { description: err.message });
      },
    }
  );

  const toggleSelection = (agentId: string) => {
    const next = new Set(selectedIds);
    if (next.has(agentId)) next.delete(agentId);
    else next.add(agentId);
    setSelectedIds(next);
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleTabChange = (tab: "whitelisted" | "non-whitelisted") => {
    setActiveTab(tab);
    setPage(1);
    clearSelection();
  };

  const isLoading = activeTab === "whitelisted" ? wlLoading : nonWlLoading;
  const error = activeTab === "whitelisted" ? wlError : nonWlError;
  const data = activeTab === "whitelisted" ? whitelistData : nonWlData;
  const totalItems = data?.total || 0;
  const totalPages = data?.total_pages || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Whitelist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control which agents can apply for loans, even if they are active and scored.
          </p>
        </div>
      </div>

      {/* Whitelist mode toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          {whitelistMode ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <ShieldX className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <Label className="text-sm font-medium">Whitelist Mode</Label>
            <p className="text-xs text-muted-foreground">
              When enabled, only whitelisted agents can apply for loans.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {whitelistMode && (
            <Badge variant="destructive" className="text-xs">
              Active
            </Badge>
          )}
          <Switch
            checked={whitelistMode}
            onCheckedChange={toggleWhitelistMode}
            disabled={writeDisabled || whitelistModeLoading}
          />
        </div>
      </div>

      {whitelistMode && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">
            Whitelist mode is ON
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Only agents on the whitelist can receive new loans. Active agents not on
            the whitelist will be blocked from loan applications.
          </AlertDescription>
        </Alert>
      )}

      {isUser && !canWrite && <WriteAccessAlert tabLabel="whitelist" />}

      <PrequalificationPanel writeDisabled={writeDisabled} />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => handleTabChange("whitelisted")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "whitelisted"
              ? "border-[#E31C2D] text-[#E31C2D]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Whitelisted ({whitelistData?.total ?? 0})
        </button>
        <button
          onClick={() => handleTabChange("non-whitelisted")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "non-whitelisted"
              ? "border-[#E31C2D] text-[#E31C2D]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Non-Whitelisted ({nonWlData?.total ?? 0})
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, agent ID, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Bulk actions */}
        {activeTab === "whitelisted" && selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            disabled={writeDisabled || bulkRemoveMutation.isLoading}
            onClick={() => setBulkRemoveOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove ({selectedIds.size})
          </Button>
        )}
        {activeTab === "non-whitelisted" && selectedIds.size > 0 && (
          <Button
            size="sm"
            disabled={writeDisabled || bulkAddMutation.isLoading}
            onClick={() => {
              bulkAddMutation.mutate({ agent_ids: Array.from(selectedIds) });
            }}
          >
            {bulkAddMutation.isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Whitelist ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading agents..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => (activeTab === "whitelisted" ? refetchWhitelist() : refetchNonWl())} />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        data?.data?.length === selectedIds.size &&
                        data?.data?.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const ids = (data?.data || []).map((item: any) => item.agent_id);
                          selectAll(ids);
                        } else {
                          clearSelection();
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  {activeTab === "whitelisted" ? (
                    <>
                      <TableHead>Whitelisted By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Status</TableHead>
                      <TableHead>Loan Limit</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {activeTab === "whitelisted"
                        ? "No whitelisted agents found."
                        : "All active agents are already whitelisted."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((item: any) => (
                    <TableRow key={item.agent_id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.agent_id)}
                          onCheckedChange={() => toggleSelection(item.agent_id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`${basePath}/agents/${item.agent_id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {item.agent_id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{item.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.email || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.phone_number || "—"}</TableCell>
                      {activeTab === "whitelisted" ? (
                        <>
                          <TableCell className="text-sm">{item.whitelisted_by || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.whitelisted_at ? formatDate(item.whitelisted_at, "short") : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <Link href={`${basePath}/agents/${item.agent_id}`}>
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setRemoveEntry(item)}
                                  disabled={writeDisabled || removeMutation.isLoading}
                                >
                                  <XCircle className="w-4 h-4 mr-2" /> Remove from Whitelist
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Badge variant="outline">{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            UGX {Number(item.loan_limit || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {item.credit_score_risk_level ? (
                              <Badge
                                variant={
                                  item.credit_score_risk_level === "low"
                                    ? "default"
                                    : item.credit_score_risk_level === "medium"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {item.credit_score_risk_level}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <Link href={`${basePath}/agents/${item.agent_id}`}>
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-blue-600"
                                  onClick={() => addMutation.mutate({ agent_id: item.agent_id })}
                                  disabled={writeDisabled || addMutation.isLoading}
                                >
                                  <ListChecks className="w-4 h-4 mr-2" /> Add to Whitelist
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalItems > 0 && (
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </>
      )}

      {/* Add to whitelist dialog */}
      <AddToWhitelistDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={(agentId, notes) => addMutation.mutate({ agent_id: agentId, notes })}
        isLoading={addMutation.isLoading}
      />

      {/* Remove confirmation */}
      <AlertDialog open={!!removeEntry} onOpenChange={(open) => !open && setRemoveEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{removeEntry?.full_name || removeEntry?.agent_id}</strong> from
              the whitelist. {whitelistMode ? "They will no longer be able to apply for loans." : "Whitelist mode is currently off, so this has no immediate effect."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeEntry && removeMutation.mutate(removeEntry.agent_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk remove confirmation */}
      <AlertDialog open={bulkRemoveOpen} onOpenChange={setBulkRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {selectedIds.size} agent(s) from whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              {whitelistMode
                ? "These agents will no longer be able to apply for loans."
                : "Whitelist mode is currently off, so this has no immediate effect."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkRemoveMutation.mutate({ agent_ids: Array.from(selectedIds) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PrequalificationPanel({ writeDisabled }: { writeDisabled: boolean }) {
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [onboardOpen, setOnboardOpen] = React.useState(false);
  const [platformStatus, setPlatformStatus] = React.useState<"not_joined" | "joined">("not_joined");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [selectedBatchId, setSelectedBatchId] = React.useState("all");
  const [prequalifiedSearch, setPrequalifiedSearch] = React.useState("");
  const [prequalifiedPage, setPrequalifiedPage] = React.useState(1);
  const [prequalifiedPageSize, setPrequalifiedPageSize] = React.useState(10);
  const { data: agents, isLoading } = useApi(
    () => prequalificationApi.listAgents({
      batch_id: selectedBatchId || undefined,
      platform_status: platformStatus,
      search: prequalifiedSearch || undefined,
      page: prequalifiedPage,
      page_size: prequalifiedPageSize,
    }),
    [platformStatus, selectedBatchId, prequalifiedSearch, prequalifiedPage, prequalifiedPageSize, refreshKey],
    {
      enabled: Boolean(selectedBatchId),
      cacheKey: `prequalified-${selectedBatchId}-${platformStatus}-${prequalifiedSearch}-${prequalifiedPage}-${prequalifiedPageSize}-${refreshKey}`,
    }
  );
  const { data: imports } = useApi(
    () => prequalificationApi.listImports(),
    [refreshKey],
    { cacheKey: `prequalification-imports-${refreshKey}` }
  );
  const latestBatch = imports?.data?.[0];
  React.useEffect(() => {
    if (!selectedBatchId && latestBatch?.id) setSelectedBatchId(latestBatch.id);
  }, [latestBatch?.id, selectedBatchId]);
  const selectedBatch = imports?.data?.find((batch) => batch.id === selectedBatchId) || latestBatch;
  const { data: batchStats } = useApi(
    () => prequalificationApi.stats(selectedBatch!.id),
    [selectedBatch?.id, refreshKey],
    { enabled: Boolean(selectedBatch?.id) && selectedBatchId !== "all", cacheKey: `prequalification-stats-${selectedBatch?.id}-${refreshKey}` }
  );
  const { data: allStats } = useApi(
    () => prequalificationApi.allStats(),
    [refreshKey],
    { enabled: selectedBatchId === "all", cacheKey: `prequalification-all-stats-${refreshKey}` }
  );
  const stats = selectedBatchId === "all" ? allStats : batchStats;

  const exportCsv = async () => {
    if (!selectedBatch) return;
    try {
      const blob = selectedBatchId === "all"
        ? await prequalificationApi.exportAll(platformStatus)
        : await prequalificationApi.exportCsv(selectedBatch.id, platformStatus);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `prequalified-${platformStatus}-${selectedBatchId === "all" ? "all-releases" : selectedBatch.id}.csv`;
      anchor.click(); URL.revokeObjectURL(url);
      toast.success("Interswitch CSV exported");
    } catch (error: any) { toast.error("Export failed", { description: error.message }); }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Externally pre-qualified agents</h2>
          <p className="text-sm text-muted-foreground">Upload scored agents before or after they join. External eligibility takes priority.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!selectedBatch && selectedBatchId !== "all"}>
            <Download className="mr-2 h-4 w-4" />Export for Interswitch
          </Button>
          <Button variant="outline" onClick={() => setOnboardOpen(true)} disabled={writeDisabled || !stats?.awaiting_signup}>
            <UserPlus className="mr-2 h-4 w-4" />Onboard awaiting{stats?.awaiting_signup ? ` (${stats.awaiting_signup})` : ""}
          </Button>
          <Button onClick={() => setUploadOpen(true)} disabled={writeDisabled}>
            <Upload className="mr-2 h-4 w-4" />Upload scored agents
          </Button>
        </div>
      </div>
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Selected", stats.total_selected], ["Awaiting signup", stats.awaiting_signup],
            ["Joined", stats.joined], ["Activated", stats.activated],
            ["Registration rate", `${stats.registration_conversion_rate}%`],
          ].map(([label, value]) => <div key={String(label)} className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></div>)}
        </div>
      )}
      {imports?.data?.length ? <div className="flex items-center gap-3"><Label htmlFor="prequalification-batch">View</Label><select id="prequalification-batch" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedBatchId} onChange={(event) => { setSelectedBatchId(event.target.value); setPrequalifiedPage(1); }}><option value="all">All releases</option>{imports.data.map((batch) => <option key={batch.id} value={batch.id}>{batch.filename} · {batch.selected_rows} agents · {batch.created_at ? formatDate(batch.created_at, "short") : ""}</option>)}</select></div> : null}
      <div className="flex gap-2 border-b">
        <button className={`px-3 py-2 text-sm ${platformStatus === "not_joined" ? "border-b-2 border-[#E31C2D] text-[#E31C2D]" : "text-muted-foreground"}`} onClick={() => { setPlatformStatus("not_joined"); setPrequalifiedPage(1); }}>Awaiting signup</button>
        <button className={`px-3 py-2 text-sm ${platformStatus === "joined" ? "border-b-2 border-[#E31C2D] text-[#E31C2D]" : "text-muted-foreground"}`} onClick={() => { setPlatformStatus("joined"); setPrequalifiedPage(1); }}>Joined from uploads</button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by agent ID..."
          value={prequalifiedSearch}
          onChange={(event) => { setPrequalifiedSearch(event.target.value); setPrequalifiedPage(1); }}
        />
      </div>
      <div className="rounded-md border">
        <Table><TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Agent ID</TableHead><TableHead>External score</TableHead><TableHead>Band</TableHead><TableHead>Status</TableHead><TableHead>Starter</TableHead><TableHead>Current limit</TableHead><TableHead>External maximum</TableHead><TableHead>Available</TableHead></TableRow></TableHeader>
          <TableBody>{isLoading ? <TableRow><TableCell colSpan={9}>Loading agents...</TableCell></TableRow> : agents?.data?.length ? agents.data.map((agent) => <TableRow key={agent.id}><TableCell>{agent.rank}</TableCell><TableCell className="font-mono">{agent.agent_id}</TableCell><TableCell>{agent.external_score}</TableCell><TableCell>{agent.external_band || "—"}</TableCell><TableCell><Badge variant="outline">{agent.status.replaceAll("_", " ")}</Badge></TableCell><TableCell>UGX {Number(agent.starter_limit).toLocaleString()}</TableCell><TableCell>UGX {Number(agent.effective_loan_limit).toLocaleString()}</TableCell><TableCell>UGX {Number(agent.external_recommended_limit || 0).toLocaleString()}</TableCell><TableCell>UGX {Number(agent.available_loan_limit).toLocaleString()}</TableCell></TableRow>) : <TableRow><TableCell colSpan={9} className="py-6 text-center text-muted-foreground">No agents in this group.</TableCell></TableRow>}</TableBody>
        </Table>
      </div>
      <DataTablePagination
        page={prequalifiedPage}
        pageSize={prequalifiedPageSize}
        totalItems={agents?.total || 0}
        totalPages={Math.ceil((agents?.total || 0) / prequalifiedPageSize)}
        onPageChange={setPrequalifiedPage}
        onPageSizeChange={(size) => { setPrequalifiedPageSize(size); setPrequalifiedPage(1); }}
      />
      <PrequalificationUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onImported={(batchId) => {
          setSelectedBatchId("all");
          setPrequalifiedPage(1);
          setPrequalifiedSearch("");
          setRefreshKey((key) => key + 1);
        }}
      />
      <OnboardAwaitingDialog
        open={onboardOpen}
        onOpenChange={setOnboardOpen}
        batchId={selectedBatchId !== "all" ? selectedBatchId : undefined}
        batchLabel={selectedBatchId === "all" ? "all releases" : selectedBatch?.filename}
        awaiting={stats?.awaiting_signup ?? 0}
        onCompleted={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
}

function OnboardAwaitingDialog({
  open,
  onOpenChange,
  batchId,
  batchLabel,
  awaiting,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId?: string;
  batchLabel?: string;
  awaiting: number;
  onCompleted: () => void;
}) {
  const [limit, setLimit] = React.useState(50);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<PrequalificationOnboardResult | null>(null);

  React.useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  const run = async () => {
    setBusy(true);
    try {
      const response = await prequalificationApi.onboardAwaiting(Math.min(200, Math.max(1, limit)), batchId);
      setResult(response);
      if (response.selected === 0) {
        toast.info("Nothing to onboard", { description: "Every agent in scope already has an account." });
      } else {
        toast.success(`Onboarded ${response.created} of ${response.selected} agent(s)`, {
          description: response.remaining > 0 ? `${response.remaining} still awaiting signup` : "No agents remain awaiting signup",
        });
      }
    } catch (error: any) {
      toast.error("Onboarding run failed", {
        description: `${error.message}. Agents already onboarded are skipped, so it is safe to retry.`,
      });
    } finally {
      setBusy(false);
      onCompleted();
    }
  };

  const nextCount = result ? Math.min(limit, result.remaining) : Math.min(limit, awaiting);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Onboard awaiting agents</DialogTitle>
          <DialogDescription>
            Creates each account, activates the external qualification, adds the whitelist entry,
            and requests the transaction statement — the same flow as a normal opt-in.
            Scope: {batchLabel || "all releases"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!result && (
            <>
              <div className="space-y-2">
                <Label htmlFor="onboard-limit">Agents per run</Label>
                <Input id="onboard-limit" type="number" min={1} max={200} value={limit} onChange={(event) => setLimit(Number(event.target.value) || 50)} />
              </div>
              <Alert>
                <AlertDescription>
                  {awaiting} agent(s) awaiting signup. Highest external scores are released first.
                  Statements are requested one agent at a time, so a large run can take a minute or more.
                  Safe to run repeatedly — existing agents are skipped.
                </AlertDescription>
              </Alert>
            </>
          )}
          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>{result.created} of {result.selected} onboarded</AlertTitle>
              <AlertDescription>
                {result.already_registered} already had an account and {result.failed.length} failed. {result.remaining} still awaiting signup.
                {result.failed.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {result.failed.slice(0, 5).map((failure) => (
                      <li key={failure.agent_id} className="font-mono text-xs">{failure.agent_id}: {failure.error}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {result && result.remaining === 0 ? "Done" : "Close"}
          </Button>
          {(!result || result.remaining > 0) && (
            <Button onClick={run} disabled={busy || (!result && awaiting === 0)}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {result ? `Onboard next ${nextCount}` : `Onboard ${nextCount || limit} agent(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrequalificationUploadDialog({ open, onOpenChange, onImported }: { open: boolean; onOpenChange: (open: boolean) => void; onImported: (batchId: string) => void }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [count, setCount] = React.useState(100);
  const [importAll, setImportAll] = React.useState(false);
  const [preview, setPreview] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const previewFile = async () => {
    if (!file) return toast.error("Choose a CSV or Excel file");
    setBusy(true); try { setPreview(await prequalificationApi.preview(file, count, importAll)); } catch (error: any) { toast.error("Validation failed", { description: error.message }); } finally { setBusy(false); }
  };
  const importFile = async () => {
    if (!file) return;
    setBusy(true); try {
      const result = await prequalificationApi.commit(file, count, importAll);
      toast.success(`Imported ${result.selected_rows} agents`, { description: `Ranks ${result.first_selected_rank}–${result.last_selected_rank}; ${result.remaining_after_import} remain` });
      setPreview(null); setFile(null); onOpenChange(false); onImported(result.id);
    } catch (error: any) { toast.error("Import failed", { description: error.message }); } finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Upload externally scored agents</DialogTitle><DialogDescription>Select the first valid agents in the file. Every activated agent starts with UGX 5,000.</DialogDescription></DialogHeader>
    <div className="space-y-4 py-3"><div className="space-y-2"><Label htmlFor="score-file">CSV or Excel file</Label><Input id="score-file" type="file" accept=".csv,.xlsx" onChange={(event) => { setFile(event.target.files?.[0] || null); setPreview(null); }} /></div><div className="space-y-2"><Label htmlFor="selection-count">Number of new agents to release</Label><Input id="selection-count" type="number" min={1} value={count} disabled={importAll} onChange={(event) => { setCount(Number(event.target.value)); setPreview(null); }} /></div><div className="flex items-center gap-2"><Checkbox id="import-all" checked={importAll} onCheckedChange={(checked) => { setImportAll(checked === true); setPreview(null); }} /><Label htmlFor="import-all">Import all remaining eligible agents</Label></div>
      {preview && <Alert><FileSpreadsheet className="h-4 w-4" /><AlertTitle>{preview.selected_rows} new agents ready</AlertTitle><AlertDescription>{preview.already_imported} previously imported agents will be skipped. Selected ranks: {preview.first_selected_rank ?? "—"}–{preview.last_selected_rank ?? "—"}. Cutoff score: {preview.cutoff_score || "—"}. {preview.remaining_after_import} will remain in the pool. Initial exposure: UGX {Number(preview.initial_exposure).toLocaleString()}.</AlertDescription></Alert>}
    </div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>{preview ? <Button onClick={importFile} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm import</Button> : <Button onClick={previewFile} disabled={busy || !file}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Validate and preview</Button>}</DialogFooter></DialogContent></Dialog>;
}

// ---------------------------------------------------------------------------
// Add to Whitelist Dialog
// ---------------------------------------------------------------------------

function AddToWhitelistDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (agentId: string, notes?: string) => void;
  isLoading: boolean;
}) {
  const [agentId, setAgentId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const handleSubmit = () => {
    if (!agentId.trim()) {
      toast.error("Agent ID is required");
      return;
    }
    onAdd(agentId.trim(), notes.trim() || undefined);
    setAgentId("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Agent to Whitelist</DialogTitle>
          <DialogDescription>
            Enter the agent ID to add them to the whitelist. They will be able to
            apply for loans when whitelist mode is enabled.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agent_id">Agent ID</Label>
            <Input
              id="agent_id"
              placeholder="e.g. AGT001"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Reason for whitelisting..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add to Whitelist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
