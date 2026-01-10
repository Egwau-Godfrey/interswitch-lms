"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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

// Mock data for development
const mockAgent: Agent = {
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
};

const mockLoanBalance: LoanBalanceResponse = {
  agent_id: "3ISO0056",
  has_loan: true,
  loan_id: "loan-001",
  status: "disbursed",
  principal_amount: 500000,
  interest_rate: 10,
  interest: 50000,
  penalty: 0,
  surcharge: 50000,
  loan_balance: 550000,
  total_paid: 0,
  disbursed_at: "2026-01-05T10:30:00",
  due_date: "2026-02-04T10:30:00",
  tenure_days: 30,
  days_since_disbursement: 5,
  is_overdue: false,
  days_overdue: 0,
  is_cleared: false,
  product_id: "prod-001",
  product_name: "Quick Loan 30",
};

const mockLoans: Loan[] = [
  {
    id: "loan-001",
    agent_id: "3ISO0056",
    product_id: "prod-001",
    principal_amount: 500000,
    interest_rate: 10,
    penalty_rate: 1,
    interest_amount: 50000,
    penalty_amount: 0,
    total_paid: 0,
    outstanding_balance: 550000,
    tenure_days: 30,
    due_date: "2026-02-04T10:30:00",
    disbursed_at: "2026-01-05T10:30:00",
    cleared_at: null,
    status: "disbursed",
    is_overdue: false,
    days_overdue: 0,
    disbursement_reference: "DSB-001-2026",
    created_at: "2026-01-05T10:30:00",
    updated_at: "2026-01-05T10:30:00",
  },
  {
    id: "loan-002",
    agent_id: "3ISO0056",
    product_id: "prod-001",
    principal_amount: 300000,
    interest_rate: 10,
    penalty_rate: 1,
    interest_amount: 30000,
    penalty_amount: 0,
    total_paid: 330000,
    outstanding_balance: 0,
    tenure_days: 30,
    due_date: "2025-12-20T10:30:00",
    disbursed_at: "2025-11-20T10:30:00",
    cleared_at: "2025-12-15T14:22:00",
    status: "cleared",
    is_overdue: false,
    days_overdue: 0,
    disbursement_reference: "DSB-002-2025",
    created_at: "2025-11-20T10:30:00",
    updated_at: "2025-12-15T14:22:00",
  },
];

const mockTransactions: AgentTransaction[] = [
  { id: "1", agent_id: "3ISO0056", transaction_date: "2026-01-09T14:30:00", credit_amount: 150000, debit_amount: 0, terminal: "TML001", biller: "MTN Mobile Money", narration: "Commission payout", balance: 450000, status: "success", request_ref: "REQ001" },
  { id: "2", agent_id: "3ISO0056", transaction_date: "2026-01-08T10:15:00", credit_amount: 0, debit_amount: 50000, terminal: "TML001", biller: "Airtel Money", narration: "Cash withdrawal", balance: 300000, status: "success", request_ref: "REQ002" },
  { id: "3", agent_id: "3ISO0056", transaction_date: "2026-01-07T16:45:00", credit_amount: 200000, debit_amount: 0, terminal: "TML002", biller: "Bank Transfer", narration: "Deposit", balance: 350000, status: "success", request_ref: "REQ003" },
];

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  // Fetch agent data
  const { data: agent, isLoading: agentLoading, error: agentError } = useApi(
    () => agentsApi.get(agentId).catch(() => mockAgent),
    [agentId],
    { cacheKey: `agent-${agentId}` }
  );

  // Fetch loan balance
  const { data: loanBalance, isLoading: balanceLoading } = useApi(
    () => loansApi.getBalance(agentId).catch(() => mockLoanBalance),
    [agentId],
    { cacheKey: `agent-balance-${agentId}` }
  );

  const displayAgent = agent || mockAgent;
  const displayBalance = loanBalance || mockLoanBalance;

  if (agentLoading) {
    return <LoadingState message="Loading agent details..." />;
  }

  if (agentError && !agent) {
    return <ErrorState message="Failed to load agent details" onRetry={() => router.refresh()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agents">
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
          <Link href={`/dashboard/agents/${agentId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/loans/new?agent_id=${agentId}`}>
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
              <div className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : displayBalance.has_loan ? (
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
                    <span>{formatDate(displayBalance.due_date!)}</span>
                  </div>
                  {displayBalance.is_overdue && (
                    <div className="flex items-center justify-between text-sm mt-2 text-red-600">
                      <span>Days Overdue</span>
                      <span className="font-bold">{displayBalance.days_overdue}</span>
                    </div>
                  )}
                </div>
                <Link href={`/dashboard/loans/${displayBalance.loan_id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Loan Details
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No active loan</p>
                <Link href={`/dashboard/loans/new?agent_id=${agentId}`}>
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
      <Tabs defaultValue="loans" className="space-y-4">
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
                  {mockLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <Link href={`/dashboard/loans/${loan.id}`} className="text-primary hover:underline">
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
                  {mockTransactions.map((tx) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
