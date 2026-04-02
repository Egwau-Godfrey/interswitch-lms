"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi, useMutation } from "@/hooks/use-api";
import { agentsApi, apiClient } from "@/lib/api";
import type { Agent } from "@/lib/types";
import { AgentStatusBadge } from "@/components/shared/status-badges";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { LoadingState, ErrorState } from "@/components/shared/loading-states";
import { ExportButton } from "@/components/shared/export-button";
import { formatDate } from "@/components/shared/stat-card";
import { useSession } from "next-auth/react";

export default function AgentsPage() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [deletingAgent, setDeletingAgent] = React.useState<Agent | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [sortBy] = React.useState("created_at");
  const [sortOrder] = React.useState<"asc" | "desc">("desc");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Set access token when session is available
  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

  // Fetch agents from API with authentication
  const { data: agentsData, isLoading, error, refetch } = useApi(
    () => agentsApi.list({
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      status: statusFilter !== "all" ? statusFilter as Agent["status"] : undefined,
      search: searchQuery || undefined
    }),
    [page, pageSize, statusFilter, searchQuery, sortBy, sortOrder, mounted, status === 'authenticated'],
    { 
      cacheKey: `agents-${page}-${statusFilter}-${searchQuery}-${sortBy}-${sortOrder}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  // Show error toast if API fails (but not for session loading)
  React.useEffect(() => {
    if (error && session?.user?.accessToken) {
      // Only show error if we have a session but API failed
      if (error.message !== "No access token available") {
        toast.error("Failed to load agents", {
          description: error.message || "Please try refreshing the page",
        });
      }
    }
  }, [error, session]);

  const agents = agentsData?.data || [];
  const totalItems = agentsData?.total || 0;
  const totalPages = agentsData?.total_pages || 0;

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
        toast.error("Registration failed", {
          description: err.message || "Please check the details and try again."
        });
      },
    }
  );

  const deleteAgentMutation = useMutation(
    (agentId: string) => agentsApi.delete(agentId),
    {
      onSuccess: () => {
        toast.success("Agent deactivated successfully!");
        setDeletingAgent(null);
        refetch();
      },
      onError: (err) => {
        toast.error("Deactivation failed", {
          description: err.message || "Failed to deactivate agent."
        });
        setDeletingAgent(null);
      },
    }
  );

  const handleToggleAgentStatus = () => {
    if (deletingAgent) {
      const isInactive = deletingAgent.status === "inactive";
      if (isInactive) {
        // Activate agent
        updateAgentMutation.mutate({
          agentId: deletingAgent.agent_id,
          data: { status: "active" as any }
        });
      } else {
        // Deactivate agent
        deleteAgentMutation.mutate(deletingAgent.agent_id);
      }
    }
  };

  const updateAgentMutation = useMutation(
    ({ agentId, data }: { agentId: string; data: any }) => agentsApi.update(agentId, data),
    {
      onSuccess: () => {
        toast.success("Agent activated successfully!");
        setDeletingAgent(null);
        refetch();
      },
      onError: (err) => {
        toast.error("Activation failed", {
          description: err.message || "Failed to activate agent."
        });
        setDeletingAgent(null);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (error && error.message !== "No access token available") {
    return <ErrorState message={error.message || "Failed to load agents"} onRetry={refetch} />;
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6">
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
            filename="agents"
            onExportCsv={() => agentsApi.exportCsv({
              status: statusFilter !== "all" ? statusFilter as any : undefined,
              search: searchQuery || undefined
            })}
          />
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#004B91] hover:bg-[#003B71]">
                <UserPlus className="w-4 h-4 mr-2" />
                Register Agent
              </Button>
            </DialogTrigger>
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
                    <Select>
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
                  <Button type="submit" className="bg-[#E31C2D] hover:bg-[#C21827]" disabled={createAgent.isLoading}>
                    {createAgent.isLoading ? "Registering..." : "Complete Registration"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
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
            {isLoading || !agentsData ? (
              // Enhanced skeleton loading matching columns
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right flex justify-end">
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : agents.length > 0 ? (
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
                          <Link href={`/super-admin/agents/${agent.agent_id}`}>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/super-admin/loans/new?agent_id=${agent.agent_id}`}>
                            <DropdownMenuItem>
                              <Banknote className="w-4 h-4 mr-2" /> New Loan
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/super-admin/agents/${agent.agent_id}?tab=transactions`}>
                            <DropdownMenuItem>
                              <Clock className="w-4 h-4 mr-2" /> History
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          {agent.status === "inactive" ? (
                            <DropdownMenuItem 
                              className="text-emerald-600"
                              onClick={() => setDeletingAgent(agent)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeletingAgent(agent)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Deactivate
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
      </div>

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          // You might need a setPageSize state if you want to support changing page size
          // For now just resetting page to 1
          setPage(1);
        }}
      />

      <AlertDialog open={!!deletingAgent} onOpenChange={() => setDeletingAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingAgent?.status === "inactive" ? "Activate Agent" : "Deactivate Agent"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAgent?.status === "inactive" 
                ? `Are you sure you want to activate agent ${deletingAgent?.full_name}? They will be able to access the system again.`
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
              {deleteAgentMutation.isLoading || updateAgentMutation.isLoading 
                ? (deletingAgent?.status === "inactive" ? "Activating..." : "Deactivating...") 
                : (deletingAgent?.status === "inactive" ? "Activate" : "Deactivate")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
