"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiAuth } from "@/hooks/use-api-auth";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  CreditCard,
  Calendar,
  Clock,
  Edit,
  Banknote,
  History,
  FileText,
  AlertTriangle,
  CheckCircle2,
  User,
  Gauge,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi, useMutation } from "@/hooks/use-api";
import { agentsApi, loansApi } from "@/lib/api";
import { scoringDashboardApi } from "@/lib/api/scoring-dashboard";
import type { Agent, Loan, AgentTransaction, LoanBalanceResponse, RiskLevel } from "@/lib/types";
import type { ScoreBreakdown, AgentBehavior } from "@/lib/types/scoring";
import { AgentStatusBadge, LoanStatusBadge, RiskLevelBadge } from "@/components/shared/status-badges";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/loading-states";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ScoreValueMeter } from "@/components/scoring/score-value-meter";
import { FactorBreakdownChart } from "@/components/scoring/breakdown/factor-breakdown-chart";
import { SourceBreakdownPie } from "@/components/scoring/breakdown/source-breakdown-pie";
import { PenaltyBreakdown } from "@/components/scoring/breakdown/penalty-breakdown";
import { ScoreTrendChart } from "@/components/scoring/breakdown/score-trend-chart";
import { LoanBehaviorSummary } from "@/components/scoring/breakdown/loan-behavior-summary";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function AgentDetailPage() {
  const params = useParams();
  const { isReady } = useApiAuth();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const router = useRouter();
  const agentId = params.agentId as string;
  const [mounted, setMounted] = React.useState(false);

  // Pagination state for Loans
  const [loansPage, setLoansPage] = React.useState(1);
  const [loansPageSize, setLoansPageSize] = React.useState(10);

  // Pagination state for Transactions
  const [txPage, setTxPage] = React.useState(1);
  const [txPageSize, setTxPageSize] = React.useState(10);
  const activeTab = searchParams?.get('tab') || 'loans';

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch agent data
  const { data: agent, isLoading: agentLoading, error: agentError } = useApi(
    () => agentsApi.get(agentId),
    [agentId, mounted, isReady],
    {
      cacheKey: `agent-${agentId}`,
      enabled: mounted && isReady
    }
  );

  // Fetch loan balance
  const { data: loanBalance, isLoading: balanceLoading } = useApi(
    () => loansApi.getBalance(agentId),
    [agentId, mounted, isReady],
    {
      cacheKey: `agent-balance-${agentId}`,
      enabled: mounted && isReady
    }
  );

  // Fetch loan history
  const { data: loansData, isLoading: loansLoading } = useApi(
    () => agentsApi.getLoanHistory(agentId, { page: loansPage, page_size: loansPageSize }),
    [agentId, mounted, isReady, loansPage, loansPageSize],
    {
      cacheKey: `agent-loans-${agentId}-${loansPage}-${loansPageSize}`,
      enabled: mounted && isReady
    }
  );

  // Fetch transaction history
  const { data: transactionsData, isLoading: transactionsLoading } = useApi(
    () => agentsApi.getTransactions(agentId, { page: txPage, page_size: txPageSize }),
    [agentId, mounted, isReady, txPage, txPageSize],
    {
      cacheKey: `agent-transactions-${agentId}-${txPage}-${txPageSize}`,
      enabled: mounted && isReady
    }
  );

  // Fetch score breakdown
  const { data: scoreBreakdown, isLoading: scoreBreakdownLoading, refetch: refetchScoreBreakdown } = useApi(
    () => scoringDashboardApi.getScoreBreakdown(agentId),
    [agentId, mounted, isReady],
    {
      cacheKey: `agent-score-breakdown-${agentId}`,
      enabled: mounted && isReady
    }
  );

  // Fetch score history
  const { data: scoreHistory, isLoading: scoreHistoryLoading } = useApi(
    () => scoringDashboardApi.getScoreHistory(agentId, 10),
    [agentId, mounted, isReady],
    {
      cacheKey: `agent-score-history-${agentId}`,
      enabled: mounted && isReady
    }
  );

  const reScoreMutation = useMutation(
    () => scoringDashboardApi.triggerScore(agentId),
    {
      onSuccess: (result) => {
        if (result?.success) {
          toast.success("Agent re-scored successfully");
        } else {
          toast.error(result?.message || "Re-scoring failed");
          return;
        }
        refetchScoreBreakdown();
      },
      onError: (e) => toast.error(e.message || "Re-scoring failed"),
    }
  );

  const scoredAgent = scoreBreakdown
    ? {
        last_credit_score: scoreBreakdown.credit_score ?? scoreBreakdown.final_score,
        credit_score_risk_level: scoreBreakdown.risk_level,
        loan_limit: scoreBreakdown.loan_limit ?? displayAgent?.loan_limit,
        last_scored_at: scoreBreakdown.scored_at ?? displayAgent?.last_scored_at,
      }
    : null;
  const displayAgent = agent;
  const displayBalance = loanBalance;
  const loans = loansData?.data || [];
  const transactions = transactionsData?.data || [];

  const formatTxAmount = (amount: AgentTransaction["credit_amount"] | AgentTransaction["debit_amount"] | AgentTransaction["balance"]) =>
    formatCurrency(Number(amount ?? 0), "UGX");

  const formatPositiveTxAmount = (amount: AgentTransaction["credit_amount"] | AgentTransaction["debit_amount"]) => {
    const numericAmount = Number(amount ?? 0);
    return numericAmount > 0 ? formatCurrency(numericAmount, "UGX") : "-";
  };

  const formatTxDate = (date: string | null | undefined, includeTime = false) =>
    date ? formatDate(date, includeTime ? "long" : "short") : "-";

  const formatTxField = (value: string | null | undefined) => value || "-";

  if (agentError && !agent) {
    return <ErrorState message={agentError.message || "Failed to load agent details"} onRetry={() => router.refresh()} />;
  }

  if (agentLoading || !displayAgent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{displayAgent.full_name}</h1>
            <p className="text-muted-foreground">Agent ID: {displayAgent.agent_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/super-admin/agents/${agentId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/super-admin/loans/new?agent_id=${agentId}`}>
            <Button size="sm">
              <Banknote className="h-4 w-4 mr-2" />
              New Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {displayAgent.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                </span>
              </div>
            </div>
            <div className="text-center">
              <AgentStatusBadge status={displayAgent.status} />
            </div>
            <div className="space-y-3 pt-4 border-t">
              {displayAgent.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{displayAgent.email}</span>
                </div>
              )}
              {displayAgent.phone_number && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{displayAgent.phone_number}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(displayAgent.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Score Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Credit Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayAgent.last_credit_score != null ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-4xl font-bold ${
                      displayAgent.credit_score_risk_level === 'low' ? 'text-green-600' :
                      displayAgent.credit_score_risk_level === 'medium' ? 'text-amber-600' :
                      displayAgent.credit_score_risk_level === 'rejected' ? 'text-gray-600' :
                      'text-red-600'
                    }`}>
                      {(displayAgent.last_credit_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <RiskLevelBadge riskLevel={displayAgent.credit_score_risk_level ?? 'high'} />
                </div>
                <ScoreValueMeter
                  score={displayAgent.last_credit_score}
                  riskLevel={displayAgent.credit_score_risk_level}
                  showPercent={false}
                />
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Loan Limit</p>
                    <p className="font-semibold">{formatCurrency(displayAgent.loan_limit || 0, "UGX")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Scored</p>
                    <p className="font-semibold text-sm">
                      {displayAgent.last_scored_at ? formatDate(displayAgent.last_scored_at, "relative") : "Never"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={reScoreMutation.isLoading}
                  onClick={() => reScoreMutation.mutate(undefined as any)}
                >
                  {reScoreMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {reScoreMutation.isLoading ? "Re-scoring..." : "Re-score"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Gauge className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Not yet scored</p>
                <p className="text-xs text-muted-foreground mb-4">No credit score available</p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reScoreMutation.isLoading}
                  onClick={() => reScoreMutation.mutate(undefined as any)}
                >
                  {reScoreMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {reScoreMutation.isLoading ? "Scoring..." : "Score Agent"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              KYC Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">National ID</p>
              <p className="font-medium">{displayAgent.national_id_number || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employment Status</p>
              <p className="font-medium capitalize">{displayAgent.employment_status?.replace("_", " ") || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employer</p>
              <p className="font-medium">{displayAgent.employer_name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Income</p>
              <p className="font-medium">{formatCurrency(displayAgent.monthly_income || 0, "UGX")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Credit Check Consent</p>
              <p className="font-medium flex items-center gap-1">
                {displayAgent.consents_to_credit_check ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-500" /> Consented</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 text-yellow-500" /> Not Consented</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loan Balance Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Current Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="space-y-6">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-48" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ) : displayBalance?.has_loan ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(displayBalance.loan_balance, "UGX")}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p className="font-medium">{formatCurrency(displayBalance.principal_amount, "UGX")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interest</p>
                    <p className="font-medium">{formatCurrency(displayBalance.interest, "UGX")}</p>
                  </div>
                </div>
                {displayBalance.penalty > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Penalty</p>
                    <p className="font-medium text-red-600">{formatCurrency(displayBalance.penalty, "UGX")}</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <LoanStatusBadge status={displayBalance.status!} />
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Due Date</span>
                    <span>{displayBalance.due_date ? formatDate(displayBalance.due_date) : "-"}</span>
                  </div>
                  {displayBalance.is_overdue && (
                    <div className="flex items-center justify-between text-sm mt-2 text-red-600">
                      <span>Days Overdue</span>
                      <span className="font-bold">{displayBalance.days_overdue}</span>
                    </div>
                  )}
                </div>
                <Link href={`/super-admin/loans/${displayBalance.loan_id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Loan Details
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No active loan</p>
                <Link href={`/super-admin/loans/new?agent_id=${agentId}`}>
                  <Button size="sm">
                    <Banknote className="h-4 w-4 mr-2" />
                    Create Loan
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for History */}
      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="loans">
            <Banknote className="h-4 w-4 mr-2" />
            Loan History
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="h-4 w-4 mr-2" />
            Transaction History
          </TabsTrigger>
          <TabsTrigger value="credit-score">
            <Gauge className="h-4 w-4 mr-2" />
            Credit Score
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Loan History</CardTitle>
              <CardDescription>All loans associated with this agent</CardDescription>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : loans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan ID</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Total Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disbursed</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <Link href={`/super-admin/loans/${loan.id}`} className="text-primary hover:underline">
                            {loan.id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell>{formatCurrency(loan.principal_amount, "UGX")}</TableCell>
                        <TableCell>{formatCurrency(Number(loan.principal_amount || 0) + Number(loan.interest_amount || 0), "UGX")}</TableCell>
                        <TableCell><LoanStatusBadge status={loan.status} /></TableCell>
                        <TableCell>{loan.disbursed_at ? formatDate(loan.disbursed_at) : "-"}</TableCell>
                        <TableCell>{formatDate(loan.due_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No loan history found.
                </div>
              )}
              
              {loans.length > 0 && loansData && (
                <DataTablePagination
                  page={loansPage}
                  pageSize={loansPageSize}
                  totalItems={loansData.total}
                  totalPages={loansData.total_pages}
                  onPageChange={setLoansPage}
                  onPageSizeChange={(size) => {
                    setLoansPageSize(size);
                    setLoansPage(1);
                  }}
                  pageSizeOptions={[5, 10, 15, 20]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Agent wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Agent ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead>Narration</TableHead>
                        <TableHead>Credit</TableHead>
                        <TableHead>Debit</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Terminal</TableHead>
                        <TableHead>Biller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Updated At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                          <TableCell className="font-mono text-xs">{tx.agent_id}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatTxDate(tx.transaction_date, true)}</TableCell>
                          <TableCell>{formatTxField(tx.transaction_description || tx.narration)}</TableCell>
                          <TableCell className="max-w-xs">{formatTxField(tx.narration)}</TableCell>
                          <TableCell className="text-green-600 whitespace-nowrap">{formatPositiveTxAmount(tx.credit_amount)}</TableCell>
                          <TableCell className="text-red-600 whitespace-nowrap">{formatPositiveTxAmount(tx.debit_amount)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatTxAmount(tx.balance)}</TableCell>
                          <TableCell>{formatTxField(tx.terminal)}</TableCell>
                          <TableCell>{formatTxField(tx.biller)}</TableCell>
                          <TableCell>{formatTxField(tx.status)}</TableCell>
                          <TableCell className="font-mono text-xs max-w-xs">{formatTxField(tx.request_ref)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatTxDate(tx.created_at, true)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatTxDate(tx.updated_at, true)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transaction history found.
                </div>
              )}

              {transactions.length > 0 && transactionsData && (
                <DataTablePagination
                  page={txPage}
                  pageSize={txPageSize}
                  totalItems={transactionsData.total}
                  totalPages={transactionsData.total_pages}
                  onPageChange={setTxPage}
                  onPageSizeChange={(size) => {
                    setTxPageSize(size);
                    setTxPage(1);
                  }}
                  pageSizeOptions={[5, 10, 15, 20]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-score">
          {displayAgent.last_credit_score != null ? (
            <div className="space-y-6">
              {/* Score Composition */}
              {scoreBreakdown && !scoreBreakdownLoading && (
                <Card>
                  <CardHeader>
                    <CardTitle>Score Composition</CardTitle>
                    <CardDescription>
                      Method: {scoreBreakdown.scoring_method} &middot; Confidence: {Math.round((scoreBreakdown.confidence ?? 0) * 100)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="rounded-md bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">Rule-Based</p>
                        <p className="text-2xl font-bold tabular-nums">
                          {Math.round((scoreBreakdown.rule_score ?? 0) * 100)}%
                        </p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-4">
                        <p className="text-xs text-muted-foreground">ML Model</p>
                        <p className="text-2xl font-bold tabular-nums">
                          {Math.round((scoreBreakdown.ml_score ?? 0) * 100)}%
                        </p>
                      </div>
                      <div className="rounded-md bg-primary/10 p-4">
                        <p className="text-xs text-muted-foreground">Final</p>
                        <p className="text-2xl font-bold tabular-nums text-primary">
                          {Math.round((scoreBreakdown.final_score ?? scoreBreakdown.credit_score) * 100)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Score Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {scoreHistoryLoading ? (
                    <Skeleton className="h-48 w-full rounded" />
                  ) : (
                    <ScoreTrendChart history={scoreHistory} />
                  )}
                </CardContent>
              </Card>

              {/* Factor Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Factor Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {scoreBreakdownLoading ? (
                    <Skeleton className="h-48 w-full rounded" />
                  ) : (
                    <FactorBreakdownChart factors={scoreBreakdown?.factors} />
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Source Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Score Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scoreBreakdownLoading ? (
                      <Skeleton className="h-48 w-full rounded" />
                    ) : (
                      <SourceBreakdownPie data={scoreBreakdown?.source_breakdown} />
                    )}
                  </CardContent>
                </Card>

                {/* Penalties */}
                <Card>
                  <CardHeader>
                    <CardTitle>Penalties Applied</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scoreBreakdownLoading ? (
                      <Skeleton className="h-32 w-full rounded" />
                    ) : (
                      <PenaltyBreakdown
                        penalties={scoreBreakdown?.penalties}
                        penaltyTotal={scoreBreakdown?.penalty_total}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Loan Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle>Loan Repayment Behavior</CardTitle>
                </CardHeader>
                <CardContent>
                  {scoreBreakdownLoading ? (
                    <Skeleton className="h-32 w-full rounded" />
                  ) : (
                    <LoanBehaviorSummary behavior={scoreBreakdown?.behavior} />
                  )}
                </CardContent>
              </Card>

              {/* Score History */}
              <Card>
                <CardHeader>
                  <CardTitle>Score History</CardTitle>
                </CardHeader>
                <CardContent>
                  {scoreHistoryLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded" />
                      ))}
                    </div>
                  ) : scoreHistory && scoreHistory.length > 0 ? (
                    <div className="space-y-2">
                      {scoreHistory.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-md border p-3 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <RiskLevelBadge
                              riskLevel={entry.risk_level}
                              className="text-xs px-1 py-0.5"
                            />
                            <span className="font-mono font-semibold">
                              {(entry.credit_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground text-right space-y-0.5">
                            <p>{formatCurrency(entry.loan_limit, "UGX")}</p>
                            <p>{entry.scoring_method} &middot; {entry.trigger_type}</p>
                            <p>{formatDate(entry.created_at, "relative")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No scoring history available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  title="No credit score"
                  description="This agent has not been scored yet. Click 'Score Agent' in the Credit Score card above to generate a score."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
