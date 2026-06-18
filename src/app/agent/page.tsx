"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Banknote, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { loansApi } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import { LoanStatusBadge } from "@/components/shared/status-badges";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";

export default function AgentPortalPage() {
  const { data: session, status: authStatus } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if ((session?.user as any)?.accessToken) {
      apiClient.setAccessToken((session?.user as any).accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

  // Derive agent_id from JWT — never from user input
  const agentId = (session?.user as any)?.agentId as string | undefined;

  const { data: balance, isLoading: balanceLoading, error: balanceError, refetch } = useApi(
    () => loansApi.getBalance(agentId!).catch((err: Error) => {
      // 404 means the agent has no loans record yet — treat as "no loan"
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        return null as any;
      }
      throw err;
    }),
    [agentId, mounted, authStatus === "authenticated"],
    {
      cacheKey: `agent-portal-balance-${agentId}`,
      enabled: mounted && authStatus === "authenticated" && !!agentId,
    }
  );

  const { data: loansData, isLoading: loansLoading } = useApi(
    () => loansApi.list({ agent_id: agentId, page: 1, page_size: 5, sort_by: "created_at", sort_order: "desc" }).catch((err: Error) => {
      // 404 = agent has no record yet — return empty list
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        return { data: [], total: 0, page: 1, page_size: 5, total_pages: 0 };
      }
      throw err;
    }),
    [agentId, mounted, authStatus === "authenticated"],
    {
      cacheKey: `agent-portal-loans-${agentId}`,
      enabled: mounted && authStatus === "authenticated" && !!agentId,
    }
  );

  if (!mounted) return null;

  const agentName =
    (session?.user as any)?.firstName && (session?.user as any)?.lastName
      ? `${(session?.user as any).firstName} ${(session?.user as any).lastName}`
      : session?.user?.name || "Agent";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {agentName}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agent ID: <code className="font-mono">{agentId}</code>
        </p>
      </div>

      {/* Current Loan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Banknote className="h-5 w-5" />
            Current Loan
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : balanceError ? (
            <div className="flex flex-col items-center py-4 gap-3 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Could not load loan data.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : balance?.has_loan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  <p className="text-3xl font-bold">{formatCurrency(balance.loan_balance, "UGX")}</p>
                </div>
                <LoanStatusBadge status={balance.status!} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Principal</p>
                  <p className="font-medium">{formatCurrency(balance.principal_amount, "UGX")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest</p>
                  <p className="font-medium">{formatCurrency(balance.interest, "UGX")}</p>
                </div>
                {balance.penalty > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Penalty</p>
                    <p className="font-medium text-red-600">{formatCurrency(balance.penalty, "UGX")}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium">{balance.due_date ? formatDate(balance.due_date) : "—"}</p>
                </div>
              </div>
              {balance.is_overdue && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">
                    This loan is <strong>{balance.days_overdue} day(s) overdue</strong>.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-medium">No active loan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Limit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Loan Limit</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <div>
              <p className="text-3xl font-bold">{formatCurrency(balance?.loan_limit ?? 0, "UGX")}</p>
              <p className="text-xs text-muted-foreground mt-1">Maximum borrowable amount based on your credit profile</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Loans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Recent Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loansLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : loansData?.data?.length ? (
            <div className="space-y-2">
              {loansData.data.map(loan => (
                <div key={loan.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(loan.principal_amount, "UGX")}</p>
                    <p className="text-xs text-muted-foreground">
                      {loan.disbursed_at ? formatDate(loan.disbursed_at) : formatDate(loan.created_at)}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No loan history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
