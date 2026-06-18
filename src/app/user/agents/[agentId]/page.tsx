"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { agentsApi, loansApi } from "@/lib/api";
import type { Agent, Loan, AgentTransaction, LoanBalanceResponse } from "@/lib/types";
import { AgentStatusBadge, LoanStatusBadge } from "@/components/shared/status-badges";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/loading-states";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { useWritePermission } from "@/hooks/use-write-permission";
import { WriteAccessAlert } from "@/components/shared/write-access-alert";
import { useApiAuth } from "@/hooks/use-api-auth";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isReady } = useApiAuth();
  const agentId = params.agentId as string;
  const initialTab = searchParams.get("tab") || "loans";
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const { canWrite, writeDisabled, writeTooltip } = useWritePermission("agents");
  const {
    writeDisabled: loansWriteDisabled,
    writeTooltip: loansWriteTooltip,
    requireWrite: requireLoansWrite,
  } = useWritePermission("loans");

  // Pagination state for Loans
  const [loansPage, setLoansPage] = React.useState(1);
  const [loansPageSize, setLoansPageSize] = React.useState(10);

  // Pagination state for Transactions
  const [txPage, setTxPage] = React.useState(1);
  const [txPageSize, setTxPageSize] = React.useState(10);

  React.useEffect(() => {
    setActiveTab(searchParams.get("tab") || "loans");
  }, [searchParams]);

  // Fetch agent data
  const { data: agent, isLoading: agentLoading, error: agentError, refetch } = useApi(
    () => agentsApi.get(agentId),
    [agentId, accessToken],
    {
      cacheKey: `agent-${agentId}`,
      enabled: isReady
    }
  );

  // Fetch loan balance
  const { data: loanBalance, isLoading: balanceLoading } = useApi(
    () => loansApi.getBalance(agentId),
    [agentId, accessToken],
    {
      cacheKey: `agent-balance-${agentId}`,
      enabled: isReady
    }
  );

  // Fetch loan history
  const { data: loansData, isLoading: loansLoading } = useApi(
    () => agentsApi.getLoanHistory(agentId, { page: loansPage, page_size: loansPageSize }),
    [agentId, loansPage, loansPageSize, accessToken],
    {
      cacheKey: `agent-loans-${agentId}-${loansPage}-${loansPageSize}`,
      enabled: isReady
    }
  );

  // Fetch transaction history
  const { data: transactionsData, isLoading: transactionsLoading } = useApi(
    () => agentsApi.getTransactions(agentId, { page: txPage, page_size: txPageSize }),
    [agentId, txPage, txPageSize, accessToken],
    {
      cacheKey: `agent-transactions-${agentId}-${txPage}-${txPageSize}`,
      enabled: isReady
    }
  );

  const displayAgent = agent;
  const displayBalance = loanBalance;
  const loans = loansData?.data ?? [];
  const loansTotalPages = loansData?.total_pages ?? 1;
  const loansTotalItems = loansData?.total ?? 0;
  const transactions = transactionsData?.data ?? [];
  const txTotalPages = transactionsData?.total_pages ?? 1;
  const txTotalItems = transactionsData?.total ?? 0;

  if (agentLoading) {
    return <LoadingState message="Loading agent details..." />;
  }

  if (agentError && !agent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <ErrorState
          message="Failed to load agent details"
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!displayAgent) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh]">
        <ErrorState
          message="Agent not found"
          onRetry={() => router.push("/user/agents")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!canWrite && <WriteAccessAlert tabLabel="agent" />}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/user/agents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{displayAgent?.full_name ?? "N/A"}</h1>
            <p className="text-muted-foreground">Agent ID: {displayAgent?.agent_id ?? "N/A"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            title={writeTooltip}
            disabled={writeDisabled}
            onClick={() => {
              if (canWrite) {
                router.push(`/user/agents/${agentId}/edit`);
              } else {
                toast.error("View-only access", {
                  description: "Editing agents requires write access granted by a super admin.",
                });
              }
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            {writeDisabled ? "View" : "Edit"}
          </Button>
          <Button
            size="sm"
            disabled={loansWriteDisabled}
            title={loansWriteTooltip}
            onClick={() => {
              if (requireLoansWrite()) {
                router.push(`/user/loans/new?agent_id=${agentId}`);
              }
            }}
          >
            <Banknote className="h-4 w-4 mr-2" />
            New Loan
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
                  {displayAgent?.full_name
                    ? displayAgent.full_name.split(" ").map(n => n[0]).join("")
                    : "NA"}
                </span>
              </div>
            </div>
            <div className="text-center">
              <AgentStatusBadge status={displayAgent?.status ?? "inactive"} />
            </div>
            <div className="space-y-3 pt-4 border-t">
              {displayAgent?.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{displayAgent.email}</span>
                </div>
              )}
              {displayAgent?.phone_number && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{displayAgent.phone_number}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(displayAgent?.created_at ?? new Date().toISOString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan Balance Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Loan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {balanceLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : displayBalance?.has_loan ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <LoanStatusBadge status={displayBalance.status} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Principal</span>
                    <span className="font-medium">{formatCurrency(displayBalance.principal_amount, "UGX")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Interest</span>
                    <span className="font-medium">{formatCurrency(displayBalance.interest, "UGX")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Due</span>
                    <span className="font-semibold text-red-600">{formatCurrency(displayBalance.loan_balance, "UGX")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <span className="font-medium text-green-600">{formatCurrency(displayBalance.total_paid, "UGX")}</span>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">{displayBalance?.due_date ? formatDate(displayBalance.due_date) : "N/A"}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm font-medium">No active loan</p>
                <p className="text-xs text-muted-foreground">Agent is eligible for new loan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">National ID</p>
              <p className="font-medium">{displayAgent?.national_id_number || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employment Status</p>
              <p className="font-medium capitalize">{displayAgent?.employment_status?.replace("_", " ") || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employer</p>
              <p className="font-medium">{displayAgent?.employer_name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Income</p>
              <p className="font-medium">{formatCurrency(displayAgent?.monthly_income || 0, "UGX")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Credit Check Consent</p>
              <p className="font-medium flex items-center gap-1">
                {displayAgent?.consents_to_credit_check ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-500" /> Consented</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 text-yellow-500" /> Not Consented</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Loan and Transaction History */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setActiveTab(tab);
          router.replace(`/user/agents/${agentId}?tab=${tab}`, { scroll: false });
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="loans">
            <Banknote className="h-4 w-4 mr-2" />
            Loan History
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="h-4 w-4 mr-2" />
            Transaction History
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
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : loans.length > 0 ? (
                <>
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
                            <Link href={`/user/loans/${loan.id}`} className="text-primary hover:underline">
                              {loan.id.slice(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell>{formatCurrency(loan.principal_amount, "UGX")}</TableCell>
                          <TableCell>{formatCurrency(loan.principal_amount + loan.interest_amount, "UGX")}</TableCell>
                          <TableCell><LoanStatusBadge status={loan.status} /></TableCell>
                          <TableCell>{loan.disbursed_at ? formatDate(loan.disbursed_at) : "-"}</TableCell>
                          <TableCell>{formatDate(loan.due_date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <DataTablePagination
                    page={loansPage}
                    pageSize={loansPageSize}
                    totalItems={loansTotalItems}
                    totalPages={loansTotalPages}
                    onPageChange={setLoansPage}
                    onPageSizeChange={setLoansPageSize}
                  />
                </>
              ) : (
                <EmptyState
                  title="No loans found"
                  description="This agent doesn't have any loans yet"
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
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Credit</TableHead>
                        <TableHead>Debit</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDate(tx.transaction_date, "long")}</TableCell>
                          <TableCell>{tx.narration}</TableCell>
                          <TableCell className="text-green-600">
                            {tx.credit_amount > 0 ? formatCurrency(tx.credit_amount, "UGX") : "-"}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {tx.debit_amount > 0 ? formatCurrency(tx.debit_amount, "UGX") : "-"}
                          </TableCell>
                          <TableCell>{formatCurrency(tx.balance, "UGX")}</TableCell>
                          <TableCell className="font-mono text-xs">{tx.request_ref}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <DataTablePagination
                    page={txPage}
                    pageSize={txPageSize}
                    totalItems={txTotalItems}
                    totalPages={txTotalPages}
                    onPageChange={setTxPage}
                    onPageSizeChange={setTxPageSize}
                  />
                </>
              ) : (
                <EmptyState
                  title="No transactions found"
                  description="This agent doesn't have any transactions yet"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
