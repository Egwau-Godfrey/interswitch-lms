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
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { loansApi, dashboardApi } from "@/lib/api";
import type { Loan, LoanStatus } from "@/lib/types";
import { LoanStatusBadge } from "@/components/shared/status-badges";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { RecordPaymentDialog } from "@/components/shared/record-payment-dialog";


export default function LoansPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const { data: session, status } = useSession();
  const [mounted, setMounted] = React.useState(false);
  const [selectedLoanId, setSelectedLoanId] = React.useState<string | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  // Fetch overview stats
  const { data: stats, isLoading: isStatsLoading } = useApi(
    () => dashboardApi.getStats({ months: 12 }),
    [mounted, status === 'authenticated'],
    {
      cacheKey: 'dashboard-stats-loans-overview',
      enabled: mounted && status === 'authenticated'
    }
  );


  // Fetch loans from API
  const { data: loansData, isLoading, error, refetch } = useApi(
    () => loansApi.list({
      page,
      page_size: pageSize,
      status: statusFilter !== "all" ? statusFilter as LoanStatus : undefined,
    }),
    [page, pageSize, statusFilter, mounted, status === 'authenticated'],
    {
      cacheKey: `loans-${page}-${statusFilter}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  const loans = loansData?.data || [];
  const totalItems = loansData?.total || 0;
  const totalPages = loansData?.total_pages || 1;


  // Filter by search query locally
  const filteredLoans = loans.filter(loan =>
    !searchQuery ||
    loan.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.agent_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.disbursement_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Use global stats if available
  const totalDisbursed = stats?.total_disbursed || 0;

  const totalOutstanding = stats
    ? stats.loan_status_distribution
      .filter(s => ['disbursed', 'overdue'].includes(s.status))
      .reduce((sum, s) => sum + s.amount, 0)
    : 0;

  const totalOverdue = stats?.total_overdue || 0;
  const recoveryRate = stats?.recovery_rate || 0;

  // Error state if API fails
  if (error && status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Failed to load loans</h2>
        <p className="text-muted-foreground mb-4">{error.message || "An unexpected error occurred. Please try refreshing the page."}</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
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
          <Link href="/super-admin/loans/new">
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
            {isStatsLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
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
            {isStatsLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
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
            {isStatsLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
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
            {isStatsLoading ? <Skeleton className="h-8 w-24 mt-1" /> : (
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
          <SelectTrigger className="w-[180px]" suppressHydrationWarning>
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
                  <TableCell className="font-mono text-[10px] font-semibold">
                    <div className="flex flex-col">
                      <span>{loan.id.substring(0, 8)}...</span>
                      {loan.disbursement_reference && (
                        <span className="text-muted-foreground font-normal">{loan.disbursement_reference}</span>
                      )}
                    </div>
                  </TableCell>
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
                        <Link href={`/super-admin/loans/${loan.id}`}>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/super-admin/loans/${loan.id}?tab=statement`}>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" /> Statement
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => {
                          setSelectedLoanId(loan.id);
                          setIsRecordPaymentOpen(true);
                        }}>
                          <Banknote className="w-4 h-4 mr-2" /> Record Payment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No loans found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={() => { }} // Page size is currently fixed
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={isRecordPaymentOpen}
        onOpenChange={setIsRecordPaymentOpen}
        loanId={selectedLoanId || undefined}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
//