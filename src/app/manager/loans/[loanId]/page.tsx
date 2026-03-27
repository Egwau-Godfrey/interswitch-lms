"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { useApi, useMutation } from "@/hooks/use-api";
import { loansApi } from "@/lib/api";
import type { Loan, LoanPayment, LoanDetailResponse, LoanStatementResponse, LoanStatementEntry } from "@/lib/types";
import { LoanStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badges";
import { LoadingState, ErrorState } from "@/components/shared/loading-states";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params.loanId as string;

  const [confirmAction, setConfirmAction] = React.useState<"clear" | "writeoff" | null>(null);

  // Fetch loan detail
  const { data: loanDetail, isLoading, error, refetch } = useApi(
    () => loansApi.getDetail(loanId),
    [loanId],
    { cacheKey: `loan-${loanId}` }
  );

  // Fetch statement
  const { data: statement } = useApi(
    () => loansApi.getStatement(loanId),
    [loanId],
    { cacheKey: `loan-statement-${loanId}` }
  );

  // Show error toast on failure
  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load loan details", {
        description: error.message || "Please try again",
      });
    }
  }, [error]);

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

  const displayLoan = loanDetail?.loan;
  const displayAgent = loanDetail?.agent;
  const displayProduct = loanDetail?.product;
  const displayPayments = loanDetail?.payments ?? [];
  const displayStatement = statement;

  const paymentProgress = displayLoan?.principal_amount
    ? Math.round((displayLoan.total_paid / (displayLoan.principal_amount + displayLoan.interest_amount + displayLoan.penalty_amount)) * 100)
    : 0;

  if (isLoading) {
    return <LoadingState message="Loading loan details..." />;
  }

  if (error && !loanDetail) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <ErrorState
          message="Failed to load loan details"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!displayLoan) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <ErrorState
          message="Loan not found"
          onRetry={() => router.push("/manager/loans")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/manager/loans">
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
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Statement
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
                {formatCurrency(displayLoan.total_paid, "UGX")} paid of {formatCurrency(displayLoan.principal_amount + displayLoan.interest_amount + displayLoan.penalty_amount, "UGX")}
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
                <p className="font-medium">{displayProduct?.name ?? "N/A"}</p>
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
                  {displayAgent?.full_name
                    ? displayAgent.full_name.split(" ").map((n: string) => n[0]).join("")
                    : "NA"}
                </span>
              </div>
              <div>
                <p className="font-medium">{displayAgent?.full_name ?? "N/A"}</p>
                <p className="text-sm text-muted-foreground">{displayAgent?.agent_id ?? "N/A"}</p>
              </div>
            </div>
            {displayAgent && (
              <Link href={`/manager/agents/${displayAgent.agent_id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Agent Profile
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Agent</p>
                    <p className="font-medium">{displayAgent?.full_name ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Agent ID</p>
                    <p className="font-medium">{displayAgent?.agent_id ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Product</p>
                    <p className="font-medium">{displayProduct?.name ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <LoanStatusBadge status={displayLoan.status} />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStatement?.entries && displayStatement.entries.length > 0 ? (
                      displayStatement.entries.map((entry: LoanStatementEntry, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDate(entry.date)}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-red-600">
                            {entry.debit > 0 ? formatCurrency(entry.debit, "UGX") : "-"}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {entry.credit > 0 ? formatCurrency(entry.credit, "UGX") : "-"}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(entry.balance, "UGX")}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No statement entries available
                        </TableCell>
                      </TableRow>
                    )}
                    {displayStatement && (
                      <TableRow className="border-t-2 bg-muted/50">
                        <TableCell colSpan={4} className="font-bold text-lg">Closing Balance</TableCell>
                        <TableCell className="font-bold text-lg">{formatCurrency(displayStatement.closing_balance, "UGX")}</TableCell>
                      </TableRow>
                    )}
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
    </div>
  );
}
