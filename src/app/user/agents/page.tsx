"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Banknote,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApi, useMutation } from "@/hooks/use-api";
import { agentsApi, apiClient } from "@/lib/api";
import type { Agent, AgentCreate } from "@/lib/types";
import { AgentStatusBadge } from "@/components/shared/status-badges";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { LoadingState, ErrorState } from "@/components/shared/loading-states";
import { ExportButton } from "@/components/shared/export-button";
import { formatDate } from "@/components/shared/stat-card";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import { useApiAuth } from "@/hooks/use-api-auth";
import { useWritePermission } from "@/hooks/use-write-permission";

export default function AgentsPage() {
  const { accessToken, isReady } = useApiAuth();
  const { canWrite, isLoading: permLoading, writeDisabled, writeTooltip } =
    useWritePermission("agents");
  const { requireWrite: requireLoansWrite } = useWritePermission("loans");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [targetAgent, setTargetAgent] = React.useState<Agent | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sortBy] = React.useState("created_at");
  const [sortOrder] = React.useState<"asc" | "desc">("desc");

  const { data: agentsData, isLoading, error, refetch } = useApi(
    () => {
      if (!accessToken) {
        throw new Error("No access token available");
      }
      return agentsApi.list({
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: statusFilter !== "all" ? statusFilter as Agent["status"] : undefined,
        search: searchQuery || undefined
      });
    },
    [page, pageSize, statusFilter, searchQuery, sortBy, sortOrder, accessToken],
    { cacheKey: `agents-${page}-${statusFilter}-${searchQuery}-${sortBy}-${sortOrder}`, enabled: isReady }
  );

  const agents = agentsData?.data || [];
  const totalItems = agentsData?.total || 0;
  const totalPages = agentsData?.total_pages || 0;

  const handleWriteError = (err: any): boolean => {
    if (err?.status === 403) {
      toast.error("Write access required", {
        description: "This action requires write access granted by a super admin.",
      });
      return true;
    }
    return false;
  };

  const createAgent = useMutation(
    (data: AgentCreate) => agentsApi.create(data),
    {
      onSuccess: () => {
        toast.success("Agent registered successfully!");
        setIsRegisterOpen(false);
        refetch();
      },
      onError: (err: any) => {
        if (!handleWriteError(err)) {
          console.error("Agent registration error:", err);
          toast.error("Failed to register agent", {
            description: err.message || "Please try again",
          });
        }
      },
    }
  );

  const updateAgentMutation = useMutation(
    ({ agentId, data }: { agentId: string; data: any }) => agentsApi.update(agentId, data),
    {
      onSuccess: () => {
        toast.success("Agent activated successfully!");
        setTargetAgent(null);
        refetch();
      },
      onError: (err: any) => {
        if (!handleWriteError(err)) {
          toast.error("Activation failed", {
            description: err.message || "Failed to activate agent."
          });
        }
        setTargetAgent(null);
      },
    }
  );

  const deleteAgentMutation = useMutation(
    (agentId: string) => agentsApi.delete(agentId),
    {
      onSuccess: () => {
        toast.success("Agent deactivated successfully!");
        setTargetAgent(null);
        refetch();
      },
      onError: (err: any) => {
        if (!handleWriteError(err)) {
          toast.error("Deactivation failed", {
            description: err.message || "Failed to deactivate agent."
          });
        }
        setTargetAgent(null);
      },
    }
  );

  const handleRegisterAgent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canWrite) {
      toast.error("View-only access", {
        description: "Registering agents requires write access granted by a super admin.",
      });
      return;
    }
    const formData = new FormData(e.currentTarget);
    createAgent.mutate({
      agent_id: String(formData.get("agent_id")),
      full_name: String(formData.get("full_name")),
      email: String(formData.get("email")),
      phone_number: String(formData.get("phone")),
      national_id_number: String(formData.get("national_id")),
      monthly_income: Number(formData.get("income")),
      employment_status: formData.get("employment") as "full_time" | "part_time" | "contract" | "unemployed" | undefined,
      employer_name: String(formData.get("employer")),
      consents_to_credit_check: true,
    });
  };

  const handleToggleAgentStatus = () => {
    if (!targetAgent) return;
    if (targetAgent.status === "inactive") {
      updateAgentMutation.mutate({
        agentId: targetAgent.agent_id,
        data: { status: "active" }
      });
      return;
    }
    deleteAgentMutation.mutate(targetAgent.agent_id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (error && !agentsData) {
    return <ErrorState message="Failed to load agents" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {!canWrite && <WriteAccessAlert tabLabel="agent" />}

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
            onExportCsv={() => agentsApi.exportCsv({
              status: statusFilter !== "all" ? statusFilter as any : undefined,
              search: searchQuery || undefined
            })}
            filename="agents"
          />
          <Dialog open={canWrite && isRegisterOpen} onOpenChange={canWrite ? setIsRegisterOpen : undefined}>
            <DialogTrigger asChild>
              <Button
                className={writeDisabled ? "bg-[#004B91]/70 hover:bg-[#003B71]/70" : "bg-[#004B91] hover:bg-[#003B71]"}
                aria-disabled={writeDisabled}
                title={writeTooltip}
                onClick={() => {
                  if (!canWrite) {
                    toast.error("View-only access", {
                      description: "Registering agents requires write access granted by a super admin.",
                    });
                  }
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register Agent
              </Button>
            </DialogTrigger>
            {canWrite && (
              <DialogContent className="sm:max-w-[600px]">
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
                      <Input id="agent_id" placeholder="e.g. AGT001" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" placeholder="John Doe" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="08012345678" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="national_id">National ID (NIN)</Label>
                      <Input id="national_id" placeholder="12345678901" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="income">Monthly Income (UGX)</Label>
                      <Input id="income" type="number" placeholder="50000" required />
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
                      <Input id="employer" placeholder="Company Ltd" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-[#E31C2D] hover:bg-[#C21827]" disabled={createAgent.isLoading || permLoading}>
                      {createAgent.isLoading ? "Registering..." : "Complete Registration"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            )}
          </Dialog>
        </div>
      </div>

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
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </form>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Loading agents..." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">Agent ID</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length > 0 ? (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-mono text-xs font-semibold">{agent.agent_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                            {agent.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{agent.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col text-xs space-y-1">
                        {agent.email && (
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="w-3 h-3 mr-1" /> {agent.email}
                          </div>
                        )}
                        {agent.phone_number && (
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="w-3 h-3 mr-1" /> {agent.phone_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><AgentStatusBadge status={agent.status} /></TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(agent.created_at)}
                      </div>
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
                          <Link href={`/user/agents/${agent.agent_id}`}>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => {
                              if (!requireLoansWrite()) return;
                              window.location.href = `/user/loans/new?agent_id=${agent.agent_id}`;
                            }}
                          >
                            <Banknote className="w-4 h-4 mr-2" /> New Loan
                          </DropdownMenuItem>
                          <Link href={`/user/agents/${agent.agent_id}?tab=transactions`}>
                            <DropdownMenuItem>
                              <Clock className="w-4 h-4 mr-2" /> History
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          {agent.status === "inactive" ? (
                            <DropdownMenuItem
                              className="text-emerald-600"
                              disabled={writeDisabled}
                              title={writeTooltip}
                              onClick={() => setTargetAgent(agent)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={writeDisabled}
                              title={writeTooltip}
                              onClick={() => setTargetAgent(agent)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Deactivate
                              {!canWrite && (
                                <span className="ml-auto text-[10px] text-muted-foreground">Write required</span>
                              )}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No agents found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <AlertDialog open={!!targetAgent} onOpenChange={() => setTargetAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetAgent?.status === "inactive" ? "Activate Agent" : "Deactivate Agent"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetAgent?.status === "inactive"
                ? `Are you sure you want to activate agent ${targetAgent?.full_name}? They will be able to access the system again.`
                : `Are you sure you want to deactivate agent ${targetAgent?.full_name}? They will lose access to the system immediately. Active loans will still need to be settled.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleAgentStatus}
              className={targetAgent?.status === "inactive"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
              disabled={deleteAgentMutation.isLoading || updateAgentMutation.isLoading}
            >
              {deleteAgentMutation.isLoading || updateAgentMutation.isLoading
                ? (targetAgent?.status === "inactive" ? "Activating..." : "Deactivating...")
                : (targetAgent?.status === "inactive" ? "Activate" : "Deactivate")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
