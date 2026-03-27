"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreVertical, 
  Banknote,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  FileText,
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { loansApi } from "@/lib/api";
import type { Loan, LoanStatus } from "@/lib/types";
import { LoanStatusBadge } from "@/components/shared/status-badges";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { ErrorState, EmptyState } from "@/components/shared/loading-states";

export default function LoansPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Fetch loans from API
  const { data: loansData, isLoading, error, refetch } = useApi(
    () => loansApi.list({
      page,
      page_size: pageSize,
      status: statusFilter !== "all" ? statusFilter as LoanStatus : undefined,
    }),
    [page, pageSize, statusFilter],
    { cacheKey: `loans-${page}-${statusFilter}` }
  );

  const loans = loansData?.data ?? [];
  const totalItems = loansData?.total ?? 0;
  const totalPages = loansData?.total_pages ?? 1;

  // Filter by search query locally
  const filteredLoans = loans.filter(loan =>
    !searchQuery ||
    loan.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.disbursement_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary stats
  const totalDisbursed = loans.reduce((sum, l) => sum + l.principal_amount, 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstanding_balance, 0);
  const totalOverdue = loans.filter(l => l.is_overdue).reduce((sum, l) => sum + l.outstanding_balance, 0);
  const clearedCount = loans.filter(l => l.status === "cleared").length;
  const recoveryRate = loans.length > 0 ? (clearedCount / loans.length) * 100 : 0;

  // Show error state if API failed and no data
  if (error && !loans.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <ErrorState
          message="Failed to load loans"
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
          <p className="text-muted-foreground">Monitor disbursements, repayments, and overdue balances.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/manager/loans/new">
            <Button className="bg-[#E31C2D] hover:bg-[#C21827]">
              <Plus className="w-4 h-4 mr-2" />
              New Loan Application
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Disbursed</p>
              <ArrowUpRight className="w-4 h-4 text-[#E31C2D]" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalDisbursed, "UGX", true)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Outstanding</p>
              <Clock className="w-4 h-4 text-[#004B91]" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalOutstanding, "UGX", true)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overdue</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalOverdue, "UGX", true)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recovery Rate</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
              <p className="text-2xl font-bold mt-1">{recoveryRate.toFixed(1)}%</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search loans by ID, agent, or reference..." 
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="defaulted">Defaulted</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Loan ID</TableHead>
              <TableHead>Agent ID</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-mono text-xs font-semibold">{loan.id}</TableCell>
                  <TableCell className="font-mono text-xs">{loan.agent_id}</TableCell>
                  <TableCell className="text-right">{formatCurrency(loan.principal_amount, "UGX")}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={loan.outstanding_balance > 0 ? "text-[#E31C2D]" : "text-emerald-600"}>
                      {formatCurrency(loan.outstanding_balance, "UGX")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <LoanStatusBadge status={loan.status} />
                      {loan.days_overdue > 0 && (
                        <span className="text-[10px] text-rose-500 font-medium">
                          {loan.days_overdue} days late
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(loan.due_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <Link href={`/manager/loans/${loan.id}`}>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" /> Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Banknote className="w-4 h-4 mr-2" /> Record Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24">
                  <EmptyState
                    title="No loans found"
                    description={searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Loans will appear here once they are created"}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
