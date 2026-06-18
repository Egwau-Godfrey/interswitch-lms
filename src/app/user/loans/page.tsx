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
import { RecordPaymentDialog } from "@/components/shared/record-payment-dialog";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import { useApiAuth } from "@/hooks/use-api-auth";
import { useWritePermission } from "@/hooks/use-write-permission";

const toAmount = (value: unknown): number => Number(value || 0);

export default function LoansPage() {
  const { accessToken, isReady } = useApiAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [selectedLoanId, setSelectedLoanId] = React.useState<string | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = React.useState(false);
  const { canWrite: canWriteLoans, writeDisabled, writeTooltip } =
    useWritePermission("loans");
  const { canWrite: canWritePayments } = useWritePermission("payments");
  const canRecordPayment = canWriteLoans || canWritePayments;

  const { data: loansData, isLoading, error, refetch } = useApi(
    () => {
      if (!accessToken) {
        throw new Error("No access token available");
      }
      return loansApi.list({
        page,
        page_size: pageSize,
        status: statusFilter !== "all" ? statusFilter as LoanStatus : undefined,
      });
    },
    [page, pageSize, statusFilter, accessToken],
    {
      cacheKey: `loans-${page}-${statusFilter}`,
      enabled: isReady,
    }
  );

  const loans = loansData?.data ?? [];
  const totalItems = loansData?.total ?? 0;
  const totalPages = loansData?.total_pages ?? 1;

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

  const filteredLoans = loans.filter(loan =>
    !searchQuery ||
    loan.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.disbursement_reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDisbursed = loans.reduce((sum, l) => sum + toAmount(l.principal_amount), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + toAmount(l.outstanding_balance), 0);
  const totalOverdue = loans.filter(l => l.is_overdue).reduce((sum, l) => sum + toAmount(l.outstanding_balance), 0);
  const clearedCount = loans.filter(l => l.status === "cleared").length;
  const recoveryRate = loans.length > 0 ? (clearedCount / loans.length) * 100 : 0;

  const handleWriteError = (err: any): boolean => {
    if (err?.status === 403) {
      toast.error("Write access required", {
        description: "This action requires write access granted by a super admin.",
      });
      return true;
    }
    return false;
  };

  const requireRecordPaymentWrite = (): boolean => {
    if (!canRecordPayment) {
      toast.error("Write access required", {
        description: "Recording payments requires write access on loans or payments, granted by a super admin.",
      });
      return false;
    }
    return true;
  };

  const handleRecordPayment = (loanId: string) => {
    if (!requireRecordPaymentWrite()) return;
    setSelectedLoanId(loanId);
    setIsRecordPaymentOpen(true);
  };

  const handleExport = async () => {
    try {
      toast.loading("Preparing export...", { id: "export-loading" });
      const blob = await loansApi.exportCsv({
        status: statusFilter !== "all" ? statusFilter as any : undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loans_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss("export-loading");
      toast.success("Loans exported successfully");
    } catch (err: any) {
      toast.dismiss("export-loading");
      toast.error(err.message || "Failed to export loans");
    }
  };

  return (
    <div className="space-y-6">
      {!canWriteLoans && <WriteAccessAlert tabLabel="loan" />}

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
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            className="bg-[#E31C2D] hover:bg-[#C21827]"
            disabled={writeDisabled}
            title={writeTooltip}
            onClick={() => {
              if (canWriteLoans) {
                window.location.href = "/user/loans/new";
              } else {
                toast.error("View-only access", {
                  description: "Creating loans requires write access granted by a super admin.",
                });
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Loan Application
          </Button>
        </div>
      </div>

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
                        <Link href={`/user/loans/${loan.id}`}>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/user/loans/${loan.id}?tab=statement`}>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" /> Statement
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => handleRecordPayment(loan.id)}
                          disabled={!canRecordPayment}
                          title={canRecordPayment ? undefined : "Write access requires a grant from a super admin"}
                        >
                          <Banknote className="w-4 h-4 mr-2" /> Record Payment
                          {!canRecordPayment && (
                            <span className="ml-auto text-[10px] text-muted-foreground">Write required</span>
                          )}
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

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <RecordPaymentDialog
        open={isRecordPaymentOpen}
        onOpenChange={setIsRecordPaymentOpen}
        loanId={selectedLoanId || undefined}
        submitDisabled={!canRecordPayment}
        submitDisabledReason="Recording payments requires write access on loans or payments, granted by a super admin."
        onWriteError={handleWriteError}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
