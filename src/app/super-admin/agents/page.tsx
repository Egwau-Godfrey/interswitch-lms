"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useAgentLoanSummary } from "@/hooks/use-agent-loan-summary";
import { useAgentBulkActions } from "@/hooks/use-agent-bulk-actions";
import { AgentsKPIStrip } from "@/components/agents/agents-kpi-strip";
import { AgentLoanSummaryTable } from "@/components/agents/agent-loan-summary-table";
import { AgentBulkActionsBar } from "@/components/agents/agent-bulk-actions-bar";
import { tabColumnsMap } from "@/components/agents/agent-loan-summary-columns";
import { ExportButton } from "@/components/shared/export-button";
import type { LoanStatusFilter, AgentLoanSummary } from "@/lib/types";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useApi } from "@/hooks/use-api";
import { agentsApi } from "@/lib/api";
import { settingsApi } from "@/lib/api/settings";

const TABS: { value: LoanStatusFilter; label: string; emptyMessage: string }[] = [
  { value: "defaulted", label: "Defaulted", emptyMessage: "No defaulted agents. Great news! 🎉" },
  { value: "overdue", label: "Overdue", emptyMessage: "No overdue agents." },
  { value: "active", label: "Active Loans", emptyMessage: "No agents with active loans." },
  { value: "no_loan", label: "No Loans", emptyMessage: "All agents have loans." },
  { value: "all", label: "All Agents", emptyMessage: "No agents found." },
];

export default function AgentsPage() {
  const { data: session, status } = useSession();
  // Super admins always have full write access
  const canWrite = true;
  const writeDisabled = false;
  const [activeTab, setActiveTab] = React.useState<LoanStatusFilter>("defaulted");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [mounted, setMounted] = React.useState(false);
  const [deletingAgent, setDeletingAgent] = React.useState<AgentLoanSummary | null>(null);
  const [bulkDialog, setBulkDialog] = React.useState<{
    type: "activate" | "deactivate";
    count?: number;
  } | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    }
  }, [session]);

  // Check if whitelist mode is enabled
  const { data: whitelistSetting } = useApi(
    () => settingsApi.get("whitelist_mode_enabled"),
    [mounted, status === "authenticated"],
    { cacheKey: "whitelist-mode-enabled", enabled: mounted && status === "authenticated" }
  );
  const whitelistModeEnabled = whitelistSetting?.value === "true";

  const {
    agents,
    total,
    totalPages,
    summary,
    isLoading,
    error,
    refetch,
  } = useAgentLoanSummary({
    loanStatusFilter: activeTab,
    page,
    pageSize,
    search: searchQuery,
    enabled: mounted && status === "authenticated",
  });

  const {
    selectedAgentIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDeactivate,
    bulkActivate,
    isLoading: bulkLoading,
  } = useAgentBulkActions({ onSuccess: () => refetch() });

  // Create agent mutation
  const createAgent = useMutation(
    (data: any) => agentsApi.create(data),
    {
      onSuccess: () => {
        toast.success("Agent registered successfully!");
        setIsRegisterOpen(false);
        refetch();
      },
      onError: (err) => {
        toast.error("Registration failed", { description: err.message });
      },
    }
  );

  const handleRegisterAgent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAgent.mutate({
      agent_id: formData.get("agent_id") as string,
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone_number: formData.get("phone") as string,
      national_id_number: formData.get("national_id") as string,
      monthly_income: Number(formData.get("income")),
      employment_status: formData.get("employment") as any,
      employer_name: formData.get("employer") as string,
      consents_to_credit_check: true,
    });
  };

  const deleteAgentMutation = useMutation(
    (agentId: string) => agentsApi.delete(agentId),
    {
      onSuccess: () => {
        toast.success("Agent deactivated successfully!");
        setDeletingAgent(null);
        refetch();
      },
      onError: (err) => {
        toast.error("Deactivation failed", { description: err.message });
        setDeletingAgent(null);
      },
    }
  );

  const activateWithScoringMutation = useMutation(
    (agentId: string) => agentsApi.activateWithScoring(agentId),
    {
      onSuccess: (result) => {
        if (result.success) {
          toast.success("Agent activated", {
            description: result.scored
              ? `Credit score: ${result.credit_score?.toFixed(2)}, Risk: ${result.risk_level}, Limit: UGX ${result.loan_limit?.toLocaleString()}`
              : result.error || "Agent activated successfully",
          });
        } else {
          toast.error("Activation blocked", { description: result.error });
        }
        setDeletingAgent(null);
        refetch();
      },
      onError: (err) => {
        toast.error("Activation failed", { description: err.message });
        setDeletingAgent(null);
      },
    }
  );

  const handleToggleAgentStatus = () => {
    if (!deletingAgent) return;
    if (deletingAgent.status === "inactive") {
      activateWithScoringMutation.mutate(deletingAgent.agent_id);
    } else {
      deleteAgentMutation.mutate(deletingAgent.agent_id);
    }
  };

  const handleConfirmBulkAction = () => {
    if (!bulkDialog) return;
    if (bulkDialog.type === "activate" && selectedAgentIds.size > 0) {
      bulkActivate.mutate({ agent_ids: Array.from(selectedAgentIds) });
    } else if (bulkDialog.type === "deactivate" && selectedAgentIds.size > 0) {
      bulkDeactivate.mutate({ agent_ids: Array.from(selectedAgentIds) });
    }
    setBulkDialog(null);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as LoanStatusFilter);
    setPage(1);
    clearSelection();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const columns = tabColumnsMap[activeTab];
  const tabConfig = TABS.find((t) => t.value === activeTab)!;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
          <p className="text-muted-foreground">Manage and monitor loan agents and borrowers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <ExportButton
            filename={`agents_${activeTab}`}
            onExportCsv={() => {
              const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/agents/export`);
              url.searchParams.append("loan_status_filter", activeTab);
              if (searchQuery) url.searchParams.append("search", searchQuery);
              window.open(url.toString(), "_blank");
            }}
          />
          <Button
            className="bg-[#004B91] hover:bg-[#003B71]"
            disabled={writeDisabled}
            onClick={() => setIsRegisterOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Register Agent
          </Button>
        </div>
      </div>

      {/* Register Agent Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>Register New Agent</DialogTitle>
            <DialogDescription>
              Enter the agent's details to create a new account and opt them into the loan system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterAgent} className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent_id">Agent ID</Label>
                <Input id="agent_id" name="agent_id" placeholder="e.g. AGT001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" placeholder="John Doe" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="08012345678" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID (NIN)</Label>
                <Input id="national_id" name="national_id" placeholder="12345678901" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income (UGX)</Label>
                <Input id="income" name="income" type="number" placeholder="50000" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employment">Employment Status</Label>
                <Select name="employment" defaultValue="full_time">
                  <SelectTrigger id="employment">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employer">Employer Name</Label>
                <Input id="employer" name="employer" placeholder="Company Ltd" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#E31C2D] hover:bg-[#C21827]" disabled={createAgent.isLoading}>
                {createAgent.isLoading ? "Registering..." : "Complete Registration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* KPI Strip */}
      <AgentsKPIStrip summary={summary} />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name, ID, or email..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Bulk Actions Bar */}
      <AgentBulkActionsBar
        selectedCount={selectedAgentIds.size}
        onActivateSelected={() => setBulkDialog({ type: "activate", count: selectedAgentIds.size })}
        onDeactivateSelected={() => setBulkDialog({ type: "deactivate", count: selectedAgentIds.size })}
        onClearSelection={clearSelection}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
              {summary && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  (
                  {tab.value === "defaulted" && summary.defaulted_count}
                  {tab.value === "overdue" && summary.overdue_count}
                  {tab.value === "active" && summary.active_loan_count}
                  {tab.value === "no_loan" && summary.no_loan_count}
                  {tab.value === "all" && summary.total_agents}
                  )
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            <AgentLoanSummaryTable
              agents={agents}
              columns={columns}
              isLoading={isLoading}
              error={error}
              page={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              selectedAgentIds={selectedAgentIds}
              onToggleSelection={toggleSelection}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              onRefetch={refetch}
              onActivateAgent={(agent) => setDeletingAgent(agent)}
              onDeactivateAgent={(agent) => setDeletingAgent(agent)}
              basePath="/super-admin"
              emptyMessage={tabConfig.emptyMessage}
              canWrite={canWrite}
              whitelistModeEnabled={whitelistModeEnabled}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Activate/Deactivate Dialog */}
      <AlertDialog open={!!deletingAgent} onOpenChange={() => setDeletingAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingAgent?.status === "inactive" ? "Activate Agent" : "Deactivate Agent"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAgent?.status === "inactive"
                ? `Are you sure you want to activate agent ${deletingAgent?.full_name}? Credit scoring will run before activation.`
                : `Are you sure you want to deactivate agent ${deletingAgent?.full_name}? They will lose access to the system immediately. Active loans will still need to be settled.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleAgentStatus}
              className={deletingAgent?.status === "inactive"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {deleteAgentMutation.isLoading || activateWithScoringMutation.isLoading
                ? (deletingAgent?.status === "inactive" ? "Activating..." : "Deactivating...")
                : (deletingAgent?.status === "inactive" ? "Activate" : "Deactivate")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Dialog */}
      <Dialog open={!!bulkDialog} onOpenChange={() => setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkDialog?.type === "activate" && `Activate ${bulkDialog.count} Agents`}
              {bulkDialog?.type === "deactivate" && `Deactivate ${bulkDialog.count} Agents`}
            </DialogTitle>
            <DialogDescription>
              {bulkDialog?.type === "activate" && (
                <>
                  Credit scoring will run for each agent before activation.
                  Agents with <strong>rejected</strong> risk level will be skipped.
                </>
              )}
              {bulkDialog?.type === "deactivate" && (
                <>
                  Agents with active loans will be skipped automatically.
                  Deactivated agents cannot apply for new loans.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkAction}
              className={bulkDialog?.type === "activate" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}
              disabled={bulkLoading}
            >
              {bulkLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
