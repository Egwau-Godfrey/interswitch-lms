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
  CheckCircle2,
  XCircle,
  Loader2,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { whitelistApi } from "@/lib/api";
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
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === "whitelisted" ? 8 : 7} className="text-center py-8 text-muted-foreground">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={writeDisabled || removeMutation.isLoading}
                              onClick={() => setRemoveEntry(item)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
