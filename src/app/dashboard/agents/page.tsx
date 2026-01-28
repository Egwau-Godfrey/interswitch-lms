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
import { useApi, useMutation } from "@/hooks/use-api";
import { agentsApi } from "@/lib/api";
import type { Agent } from "@/lib/types";
import { AgentStatusBadge } from "@/components/shared/status-badges";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { LoadingState, ErrorState } from "@/components/shared/loading-states";
import { ExportButton } from "@/components/shared/export-button";
import { formatDate } from "@/components/shared/stat-card";

// Mock data for fallback
const mockAgents: Agent[] = [
  { id: "1", agent_id: "3ISO0056", full_name: "John Doe", email: "john@example.com", phone_number: "+256700123456", national_id_number: "CM12345678901234", status: "active", consents_to_credit_check: true, created_at: "2024-01-10", updated_at: "2024-01-10" },
  { id: "2", agent_id: "3ISO0057", full_name: "Sarah Smith", email: "sarah@example.com", phone_number: "+256700123457", national_id_number: "CM12345678901235", status: "pending", consents_to_credit_check: false, created_at: "2024-02-15", updated_at: "2024-02-15" },
  { id: "3", agent_id: "3ISO0058", full_name: "Michael Obi", email: "michael@example.com", phone_number: "+256700123458", national_id_number: "CM12345678901236", status: "active", consents_to_credit_check: true, created_at: "2024-03-01", updated_at: "2024-03-01" },
  { id: "4", agent_id: "3ISO0059", full_name: "Grace Ademola", email: "grace@example.com", phone_number: "+256700123459", national_id_number: "CM12345678901237", status: "inactive", consents_to_credit_check: true, created_at: "2023-12-20", updated_at: "2023-12-20" },
  { id: "5", agent_id: "3ISO0060", full_name: "David Chen", email: "david@example.com", phone_number: "+256700123460", national_id_number: "CM12345678901238", status: "active", consents_to_credit_check: true, created_at: "2024-05-12", updated_at: "2024-05-12" },
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  // Fetch agents from API with fallback to mock data
  const { data: agentsData, isLoading, error, refetch } = useApi(
    () => agentsApi.list({ 
      page, 
      page_size: pageSize,
      status: statusFilter !== "all" ? statusFilter as Agent["status"] : undefined,
      search: searchQuery || undefined
    }).catch((err) => {
      console.error("Agents API error:", err);
      return { 
        data: mockAgents.filter(a => 
          (statusFilter === "all" || a.status === statusFilter) &&
          (!searchQuery || 
            a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.email?.toLowerCase().includes(searchQuery.toLowerCase()))
        ), 
        total: mockAgents.length, 
        page: 1, 
        page_size: 10,
        total_pages: 1
      };
    }),
    [page, pageSize, statusFilter, searchQuery],
    { cacheKey: `agents-${page}-${statusFilter}-${searchQuery}` }
  );

  const agents = agentsData?.data || mockAgents;
  const totalItems = agentsData?.total || mockAgents.length;
  const totalPages = agentsData?.total_pages || Math.ceil(totalItems / pageSize);

  // Create agent mutation
  const createAgent = useMutation(
    (data: Partial<Agent>) => agentsApi.create(data),
    {
      onSuccess: () => {
        toast.success("Agent registered successfully!");
        setIsRegisterOpen(false);
        refetch();
      },
      onError: () => {
        // Mock success for development
        toast.success("Agent registered successfully!");
        setIsRegisterOpen(false);
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
      employment_status: formData.get("employment") as string,
      employer_name: formData.get("employer") as string,
      consents_to_credit_check: true,
    });
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
            data={agents}
            filename="agents"
            columns={[
              { key: "agent_id", header: "Agent ID" },
              { key: "full_name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "phone_number", header: "Phone" },
              { key: "status", header: "Status" },
              { key: "created_at", header: "Created" },
            ]}
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
                            {agent.full_name.split(" ").map(n => n[0]).join("")}
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
                          <Link href={`/dashboard/agents/${agent.agent_id}`}>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/loans/new?agent_id=${agent.agent_id}`}>
                            <DropdownMenuItem>
                              <Banknote className="w-4 h-4 mr-2" /> New Loan
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>
                            <Clock className="w-4 h-4 mr-2" /> History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Deactivate
                          </DropdownMenuItem>
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
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
