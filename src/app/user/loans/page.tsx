"use client";

import * as React from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { useApiAuth } from "@/hooks/use-api-auth";
import { useWritePermission } from "@/hooks/use-write-permission";
import { useLoanSummary } from "@/hooks/use-loan-summary";
import { useLoanBulkActions } from "@/hooks/use-loan-bulk-actions";
import { LoansKpiStrip } from "@/components/loans/loans-kpi-strip";
import { LoanSummaryTable } from "@/components/loans/loan-summary-table";
import { LoanBulkActionsBar } from "@/components/loans/loan-bulk-actions-bar";
import { loanTabColumnsMap } from "@/components/loans/loan-summary-columns";
import { RecordPaymentDialog } from "@/components/shared/record-payment-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import { loansApi } from "@/lib/api";
import { useMutation } from "@/hooks/use-api";
import type { LoanStatusTab, Loan, LoanSummaryTotals } from "@/lib/types";

const TABS: { value: LoanStatusTab; label: string; emptyMessage: string }[] = [
  { value: "disbursed", label: "Active", emptyMessage: "No active loans." },
  { value: "overdue", label: "Overdue", emptyMessage: "No overdue loans. Great news! 🎉" },
  { value: "defaulted", label: "Defaulted", emptyMessage: "No defaulted loans." },
  { value: "pending", label: "Pending", emptyMessage: "No pending loan applications." },
  { value: "cleared", label: "Cleared", emptyMessage: "No cleared loans yet." },
  { value: "all", label: "All Loans", emptyMessage: "No loans found." },
];

function countForTab(tab: LoanStatusTab, summary: LoanSummaryTotals | null): number {
  if (!summary) return 0;
  switch (tab) {
    case "disbursed": return summary.disbursed_count;
    case "overdue": return summary.overdue_count;
    case "defaulted": return summary.defaulted_count;
    case "pending": return summary.pending_count;
    case "cleared": return summary.cleared_count;
    case "all": return summary.total_loans;
    default: return 0;
  }
}

export default function LoansPage() {
  const { isReady } = useApiAuth();
  const { canWrite: canWriteLoans, writeDisabled, writeTooltip } = useWritePermission("loans");
  const { canWrite: canWritePayments } = useWritePermission("payments");
  const canRecordPayment = canWriteLoans || canWritePayments;

  const [activeTab, setActiveTab] = React.useState<LoanStatusTab>("disbursed");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Single-loan action dialogs
  const [clearLoanTarget, setClearLoanTarget] = React.useState<Loan | null>(null);
  const [writeOffTarget, setWriteOffTarget] = React.useState<Loan | null>(null);
  const [recordPaymentLoan, setRecordPaymentLoan] = React.useState<Loan | null>(null);

  // Bulk action dialog
  const [bulkDialog, setBulkDialog] = React.useState<{ type: "clear" | "writeOff"; count: number } | null>(null);

  const {
    loans,
    total,
    totalPages,
    summary,
    isLoading,
    error,
    refetch,
  } = useLoanSummary({
    statusTab: activeTab,
    page,
    pageSize,
    search: searchQuery,
    isReady,
  });

  const {
    selectedLoanIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkClear,
    bulkWriteOff,
    isLoading: bulkLoading,
  } = useLoanBulkActions({ onSuccess: () => refetch() });

  // Single-loan clear mutation
  const clearLoanMutation = useMutation(
    (loanId: string) => loansApi.clearLoan(loanId),
    {
      onSuccess: () => {
        toast.success("Loan marked as cleared");
        setClearLoanTarget(null);
        refetch();
      },
      onError: (err: Error) => {
        toast.error("Failed to clear loan", { description: err.message });
      },
    }
  );

  // Single-loan write-off mutation
  const writeOffMutation = useMutation(
    (loanId: string) => loansApi.writeOff(loanId),
    {
      onSuccess: () => {
        toast.success("Loan written off");
        setWriteOffTarget(null);
        refetch();
      },
      onError: (err: Error) => {
        toast.error("Failed to write off loan", { description: err.message });
      },
    }
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value as LoanStatusTab);
    setPage(1);
    clearSelection();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleConfirmBulkAction = () => {
    if (!canWriteLoans) {
      toast.error("Write access required", {
        description: "Bulk actions require write access on loans, granted by a super admin.",
      });
      return;
    }
    if (!bulkDialog) return;
    const ids = Array.from(selectedLoanIds);
    if (ids.length === 0) return;
    if (bulkDialog.type === "clear") {
      bulkClear.mutate(ids);
    } else {
      bulkWriteOff.mutate(ids);
    }
    setBulkDialog(null);
  };

  const handleExport = async () => {
    try {
      toast.loading("Preparing export...", { id: "export-loading" });
      const blob = await loansApi.exportCsv({
        status: activeTab !== "all" ? (activeTab as any) : undefined,
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

  const columns = loanTabColumnsMap[activeTab];
  const tabConfig = TABS.find((t) => t.value === activeTab)!;

  return (
    <div className="space-y-6">
      {!canWriteLoans && <WriteAccessAlert tabLabel="loan" />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
          <p className="text-muted-foreground">Monitor disbursements, repayments, and overdue balances.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="hidden sm:flex" onClick={handleExport}>
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

      {/* KPI Strip */}
      <LoansKpiStrip summary={summary} isLoading={isLoading} />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loans by ID, agent, or reference..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Bulk Actions Bar */}
      <LoanBulkActionsBar
        selectedCount={selectedLoanIds.size}
        onClearSelected={() => {
          if (!canWriteLoans) {
            toast.error("Write access required", {
              description: "Bulk actions require write access on loans, granted by a super admin.",
            });
            return;
          }
          setBulkDialog({ type: "clear", count: selectedLoanIds.size });
        }}
        onWriteOffSelected={() => {
          if (!canWriteLoans) {
            toast.error("Write access required", {
              description: "Bulk actions require write access on loans, granted by a super admin.",
            });
            return;
          }
          setBulkDialog({ type: "writeOff", count: selectedLoanIds.size });
        }}
        onClearSelection={clearSelection}
        isLoading={bulkLoading}
      />

      {/* Tabs + Table */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
              {summary && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({countForTab(tab.value, summary)})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-4">
            <LoanSummaryTable
              loans={loans}
              columns={columns}
              isLoading={isLoading}
              error={error}
              page={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              selectedLoanIds={selectedLoanIds}
              onToggleSelection={toggleSelection}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              onRefetch={refetch}
              onClearLoan={(loan) => setClearLoanTarget(loan)}
              onWriteOffLoan={(loan) => setWriteOffTarget(loan)}
              onRecordPayment={(loan) => setRecordPaymentLoan(loan)}
              basePath="/user"
              emptyMessage={tabConfig.emptyMessage}
              canWrite={canWriteLoans}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Single-loan Clear Confirm */}
      <ConfirmDialog
        open={!!clearLoanTarget}
        onOpenChange={(open) => !open && setClearLoanTarget(null)}
        title="Mark Loan as Cleared"
        description={`Are you sure you want to mark loan ${clearLoanTarget?.id.substring(0, 8)}... as cleared? This action will set the outstanding balance to zero.`}
        confirmLabel="Mark Cleared"
        variant="default"
        isLoading={clearLoanMutation.isLoading}
        onConfirm={() => clearLoanTarget && clearLoanMutation.mutate(clearLoanTarget.id)}
      />

      {/* Single-loan Write-Off Confirm */}
      <ConfirmDialog
        open={!!writeOffTarget}
        onOpenChange={(open) => !open && setWriteOffTarget(null)}
        title="Write Off Loan"
        description={`Are you sure you want to write off loan ${writeOffTarget?.id.substring(0, 8)}...? This action is destructive and cannot be undone.`}
        confirmLabel="Write Off"
        variant="destructive"
        isLoading={writeOffMutation.isLoading}
        onConfirm={() => writeOffTarget && writeOffMutation.mutate(writeOffTarget.id)}
      />

      {/* Bulk Action Confirm */}
      <ConfirmDialog
        open={!!bulkDialog}
        onOpenChange={(open) => !open && setBulkDialog(null)}
        title={bulkDialog?.type === "clear" ? "Bulk Clear Loans" : "Bulk Write Off Loans"}
        description={
          bulkDialog?.type === "clear"
            ? `Are you sure you want to mark ${bulkDialog?.count ?? 0} loan(s) as cleared?`
            : `Are you sure you want to write off ${bulkDialog?.count ?? 0} loan(s)? This action is destructive and cannot be undone.`
        }
        confirmLabel={bulkDialog?.type === "clear" ? "Clear Selected" : "Write Off Selected"}
        variant={bulkDialog?.type === "writeOff" ? "destructive" : "default"}
        isLoading={bulkLoading}
        onConfirm={handleConfirmBulkAction}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={!!recordPaymentLoan}
        onOpenChange={(open) => !open && setRecordPaymentLoan(null)}
        loanId={recordPaymentLoan?.id}
        submitDisabled={!canRecordPayment}
        submitDisabledReason="Recording payments requires write access on loans or payments, granted by a super admin."
        onSuccess={() => refetch()}
      />
    </div>
  );
}
//
