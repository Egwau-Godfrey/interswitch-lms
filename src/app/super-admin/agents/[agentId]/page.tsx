"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

export default function AgentDetailPage() {
  const params = useParams();
  const { status } = useSession();
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
    [agentId, mounted, status === 'authenticated'],
    { 
      cacheKey: `agent-${agentId}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  // Fetch loan balance
  const { data: loanBalance, isLoading: balanceLoading } = useApi(
    () => loansApi.getBalance(agentId),
    [agentId, mounted, status === 'authenticated'],
    { 
      cacheKey: `agent-balance-${agentId}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  // Fetch loan history
  const { data: loansData, isLoading: loansLoading } = useApi(
    () => agentsApi.getLoanHistory(agentId, { page: loansPage, page_size: loansPageSize }),
    [agentId, mounted, status === 'authenticated', loansPage, loansPageSize],
    { 
      cacheKey: `agent-loans-${agentId}-${loansPage}-${loansPageSize}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  // Fetch transaction history
  const { data: transactionsData, isLoading: transactionsLoading } = useApi(
    () => agentsApi.getTransactions(agentId, { page: txPage, page_size: txPageSize }),
    [agentId, mounted, status === 'authenticated', txPage, txPageSize],
    { 
      cacheKey: `agent-transactions-${agentId}-${txPage}-${txPageSize}`,
      enabled: mounted && status === 'authenticated'
    }
  );

  const displayAgent = agent;
  const displayBalance = loanBalance;
  const loans = loansData?.data || [];
  const transactions = transactionsData?.data || [];

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
                  {displayAgent.full_name.split(" ").map(n => n[0]).join("")}
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
      </Tabs>
    </div>
  );
}
