"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  Clock,
  CreditCard,
  Download,
  FileText,
  Receipt,
  RefreshCw,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Percent,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { loansApi } from "@/lib/api";
import type { Loan, LoanPayment, LoanDetailResponse, LoanStatementResponse, LoanStatementEntry, Agent } from "@/lib/types";
import { LoanStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badges";
import { LoadingState, ErrorState } from "@/components/shared/loading-states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { RecordPaymentDialog } from "@/components/shared/record-payment-dialog";
import { generateLoanStatementPDF } from "@/lib/pdf-utils";

// Mock data for development
const mockLoan: Loan = {
  id: "loan-001",
  agent_id: "3ISO0056",
  product_id: "prod-001",
  principal_amount: 500000,
  interest_rate: 10,
  penalty_rate: 1,
  interest_amount: 50000,
  penalty_amount: 5000,
  total_paid: 200000,
  outstanding_balance: 355000,
  tenure_days: 30,
  due_date: "2026-02-04T10:30:00",
  disbursed_at: "2026-01-05T10:30:00",
  cleared_at: null,
  status: "overdue",
  is_overdue: true,
  days_overdue: 5,
  disbursement_reference: "DSB-001-2026",
  created_at: "2026-01-05T10:30:00",
  updated_at: "2026-01-10T10:30:00",
  applicant_id: "agent-1",
  loan_type: "float",
  disbursed_amount: 500000,
  application_fee: 300,
  penalty_applied: true,
};

const mockLoanDetail: LoanDetailResponse = {
  loan: mockLoan,
  agent: {
    id: "1",
    agent_id: "3ISO0056",
    full_name: "John Doe",
    email: "john.doe@example.com",
    phone_number: "+256700123456",
    national_id_number: "CM12345678901234",
    employer_name: "Interswitch Uganda Ltd",
    employment_status: "full_time",
    monthly_income: 2500000,
    consents_to_credit_check: true,
    default_product_id: null,
    status: "active",
    created_at: "2025-06-15T10:30:00",
    updated_at: "2025-12-01T14:22:00",
  },
  product: {
    id: "prod-001",
    name: "Quick Loan 30",
    description: "Short-term loan product",
    max_amount: 1000000,
    interest_rate: 10,
    penalty_rate: 1,
    tenure_days: 30,
    grace_period_days: 2,
    requires_payroll: false,
    is_default: true,
    is_active: true,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
  },
  payments: [
    {
      id: "pay-001",
      loan_id: "loan-001",
      amount: 100000,
      payment_reference: "PAY-001-2026",
      channel: "mobile_money",
      status: "posted",
      payment_date: "2026-01-15T10:30:00",
      created_at: "2026-01-15T10:30:00",
    },
    {
      id: "pay-002",
      loan_id: "loan-001",
      amount: 100000,
      payment_reference: "PAY-002-2026",
      channel: "bank_transfer",
      status: "posted",
      payment_date: "2026-01-20T14:00:00",
      created_at: "2026-01-20T14:00:00",
    },
  ],
};

const mockStatement: LoanStatementResponse = {
  loan_id: "loan-001",
  agent_id: "3ISO0056",
  entries: [
    { date: "2026-01-05", description: "Loan Disbursement", debit: 500000, credit: 0, balance: 500000, reference: "DSB-001" },
    { date: "2026-01-05", description: "Interest Charge", debit: 50000, credit: 0, balance: 550000, reference: "INT-001" },
    { date: "2026-01-15", description: "Payment Received", debit: 0, credit: 100000, balance: 450000, reference: "PAY-001" },
    { date: "2026-01-20", description: "Payment Received", debit: 0, credit: 100000, balance: 350000, reference: "PAY-002" },
    { date: "2026-02-05", description: "Penalty Charge", debit: 5000, credit: 0, balance: 355000, reference: "PEN-001" },
  ],
  opening_balance: 0,
  closing_balance: 355000,
};

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.loanId as string;
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "payments";
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const { data: session } = useSession();

  const [confirmAction, setConfirmAction] = React.useState<"clear" | "writeoff" | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = React.useState(false);

  // Fetch loan detail
  const { data: loanDetail, isLoading, error, refetch } = useApi(
    () => loansApi.getDetail(loanId),
    [loanId, session],
    { 
      cacheKey: `loan-${loanId}`,
      enabled: !!session?.user?.accessToken
    }
  );

  // Fetch statement
  const { data: statement, isLoading: isStatementLoading, refetch: refetchStatement } = useApi(
    () => loansApi.getStatement(loanId),
    [loanId, session],
    { 
      cacheKey: `loan-statement-${loanId}`,
      enabled: !!session?.user?.accessToken,
      onError: (err) => {
        console.error("Statement Fetch Error:", err);
        toast.error(`Failed to load ledger: ${err.message}`);
      }
    }
  );

  const handleRefresh = () => {
    refetch();
    refetchStatement();
    toast.success("Data refreshed");
  };

  const handleDownloadPDF = () => {
    if (!displayLoan || !displayAgent || !displayStatement) {
      toast.error("Loan data not fully loaded");
      return;
    }
    
    try {
      generateLoanStatementPDF(
        displayLoan,
        displayAgent as Agent,
        displayProduct,
        displayStatement
      );
      toast.success("Preparing PDF download...");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Failed to generate PDF");
    }
  };

  // Clear loan mutation
  const clearLoan = useMutation(
    () => loansApi.clearLoan(loanId),
    {
      onSuccess: () => {
        toast.success("Loan marked as cleared");
        refetch();
        setConfirmAction(null);
      },
    }
  );

  // Write off loan mutation
  const writeOffLoan = useMutation(
    () => loansApi.writeOff(loanId),
    {
      onSuccess: () => {
        toast.success("Loan written off");
        refetch();
        setConfirmAction(null);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !loanDetail) {
    return (
      <ErrorState 
        message={error?.message || "Failed to load loan details"} 
        onRetry={refetch} 
      />
    );
  }

  const displayLoan = loanDetail.loan;
  const displayAgent = loanDetail.agent;
  const displayProduct = loanDetail.product;
  const displayPayments = loanDetail.payments;
  // Handle potentially missing statement with a stable default including required IDs
  const displayStatement: LoanStatementResponse = statement || { 
    loan_id: displayLoan.id,
    agent_id: displayAgent.agent_id,
    entries: [], 
    opening_balance: 0, 
    closing_balance: 0 
  };

  // Stable calculation: totalRepaymentTarget includes all accrued costs
  const totalRepaymentTarget = Number(displayLoan.principal_amount) + 
                                Number(displayLoan.application_fee || 0) + 
                                Number(displayLoan.interest_amount || 0) + 
                                Number(displayLoan.penalty_amount || 0);

  const paymentProgress = totalRepaymentTarget > 0
    ? Math.round((Number(displayLoan.total_paid) / totalRepaymentTarget) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/loans">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loan Details</h1>
            <p className="text-muted-foreground">Reference: {displayLoan.disbursement_reference || displayLoan.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download Statement
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700" 
            size="sm"
            onClick={() => setIsRecordPaymentOpen(true)}
          >
            <Banknote className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          {displayLoan.status !== "cleared" && displayLoan.status !== "failed" && (
            <Button 
              size="sm" 
              onClick={() => setConfirmAction("clear")}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Cleared
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {displayLoan.is_overdue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">This loan is overdue</p>
            <p className="text-sm text-red-600">{displayLoan.days_overdue} days past due date. Penalty charges may apply.</p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Principal</p>
                <p className="text-xl font-bold">{formatCurrency(displayLoan.principal_amount, "UGX")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest ({displayLoan.interest_rate}%)</p>
                <p className="text-xl font-bold">{formatCurrency(displayLoan.interest_amount, "UGX")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Penalty ({displayLoan.penalty_rate}%)</p>
                <p className="text-xl font-bold">{formatCurrency(displayLoan.penalty_amount, "UGX")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Banknote className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold">{formatCurrency(displayLoan.outstanding_balance, "UGX")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(displayLoan.total_paid, "UGX")} paid of {formatCurrency(totalRepaymentTarget, "UGX")}
              </span>
              <span className="font-medium">{paymentProgress}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Loan Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Loan Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1"><LoanStatusBadge status={displayLoan.status} /></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Product</p>
                <p className="font-medium">{displayProduct?.name || (displayLoan.loan_type === 'pay_day' ? 'Pay Day Loan' : 'Float Loan')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenure</p>
                <p className="font-medium">{displayLoan.tenure_days} days</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disbursement Date</p>
                <p className="font-medium">{displayLoan.disbursed_at ? formatDate(displayLoan.disbursed_at, "long") : "Not disbursed"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-medium">{formatDate(displayLoan.due_date, "long")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days Since Disbursement</p>
                <p className="font-medium">
                  {displayLoan.disbursed_at 
                    ? Math.floor((Date.now() - new Date(displayLoan.disbursed_at).getTime()) / (1000 * 60 * 60 * 24))
                    : 0} days
                </p>
              </div>
              {displayLoan.cleared_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Cleared Date</p>
                  <p className="font-medium">{formatDate(displayLoan.cleared_at, "long")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {displayAgent.full_name.split(" ").map((n: string) => n[0]).join("")}
                </span>
              </div>
              <div>
                <p className="font-medium">{displayAgent.full_name}</p>
                <p className="text-sm text-muted-foreground">{displayAgent.agent_id}</p>
              </div>
            </div>
            <Link href={`/super-admin/agents/${displayAgent.agent_id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Agent Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">
            <Receipt className="h-4 w-4 mr-2" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="statement">
            <FileText className="h-4 w-4 mr-2" />
            Statement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payments made towards this loan</CardDescription>
            </CardHeader>
            <CardContent>
              {displayPayments && displayPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayPayments.map((payment: LoanPayment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.payment_date || payment.created_at, "long")}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.payment_reference}</TableCell>
                        <TableCell className="capitalize">{payment.channel?.replace("_", " ") || "N/A"}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          +{formatCurrency(payment.amount, "UGX")}
                        </TableCell>
                        <TableCell><PaymentStatusBadge status={payment.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payments recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statement">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Loan Statement</CardTitle>
                <CardDescription>Transaction history for this loan</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Agent Name</p>
                    <p className="font-medium">{displayAgent.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">{displayAgent.agent_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Product</p>
                    <p className="font-medium">
                      {displayProduct?.name || 
                       (displayLoan.loan_type === 'pay_day' ? 'Pay Day Loan' : 
                        displayLoan.loan_type === 'float' ? 'Float Loan' : 'Loan')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Status: {displayLoan.status.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Principal</p>
                    <p className="font-medium">{formatCurrency(displayLoan.principal_amount, "UGX")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Outstanding</p>
                    <p className="font-bold text-primary">{formatCurrency(displayLoan.outstanding_balance, "UGX")}</p>
                  </div>
                </div>

                {/* Debug Info (Only for admins/managers) */}
                {statement?.debug_info && (
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] font-mono whitespace-pre-wrap">
                    DEBUG: {JSON.stringify(statement.debug_info, null, 2)}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 border rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Total Interest</p>
                    <p className="text-sm font-semibold">{formatCurrency(displayLoan.interest_amount, "UGX")}</p>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Total Penalty</p>
                    <p className="text-sm font-semibold">{formatCurrency(displayLoan.penalty_amount, "UGX")}</p>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Total Paid</p>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(displayLoan.total_paid, "UGX")}</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStatement.entries.map((entry: LoanStatementEntry, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{formatDate(entry.date)}</TableCell>
                        <TableCell className={
                          entry.description.includes("Interest") || entry.description.includes("Penalty") 
                            ? "italic text-muted-foreground" 
                            : ""
                        }>
                          {entry.description}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{entry.reference || "-"}</TableCell>
                        <TableCell className="text-red-600">
                          {entry.debit > 0 ? formatCurrency(entry.debit, "UGX") : "-"}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {entry.credit > 0 ? formatCurrency(entry.credit, "UGX") : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(entry.balance, "UGX")}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-muted/50">
                      <TableCell colSpan={5} className="font-bold text-lg text-right pr-8">Closing Balance</TableCell>
                      <TableCell className="font-bold text-lg">{formatCurrency(displayStatement.closing_balance, "UGX")}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="text-xs text-muted-foreground text-center mt-4">
                  Statement generated on {formatDate(new Date().toISOString(), "long")}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmAction === "clear"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Clear Loan"
        description="Are you sure you want to mark this loan as cleared? This indicates the loan has been fully repaid."
        confirmLabel="Mark as Cleared"
        onConfirm={() => { clearLoan.mutate(); }}
        isLoading={clearLoan.isLoading}
      />

      <ConfirmDialog
        open={confirmAction === "writeoff"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Write Off Loan"
        description="Are you sure you want to write off this loan? This action is typically used for defaulted loans that are unlikely to be recovered."
        confirmLabel="Write Off"
        variant="destructive"
        onConfirm={() => { writeOffLoan.mutate(); }}
        isLoading={writeOffLoan.isLoading}
      />

      <RecordPaymentDialog
        open={isRecordPaymentOpen}
        onOpenChange={setIsRecordPaymentOpen}
        loanId={loanId}
        onSuccess={() => handleRefresh()}
      />
    </div>
  );
}
