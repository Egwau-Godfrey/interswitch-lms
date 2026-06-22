"use client";

import * as React from "react";
import {
  Banknote,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Percent,
  Target,
  Wallet,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/shared/stat-card";
import { useWalletBalance } from "@/components/dashboard/use-wallet-balance";
import type { DashboardKPIs } from "@/lib/types";

interface KpiCardsRowProps {
  kpis: DashboardKPIs | undefined;
  isLoading: boolean;
  walletEnabled: boolean;
}

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

function KpiCard({ title, value, description, icon, gradient, iconBg }: KpiCardProps) {
  return (
    <Card className={`relative overflow-hidden border shadow-sm hover:shadow-md transition-shadow ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</CardTitle>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${iconBg}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function WalletCard({ enabled }: { enabled: boolean }) {
  const { balance, isLoading, error, walletInfo } = useWalletBalance(enabled);

  return (
    <Card className="relative overflow-hidden border border-violet-100 dark:border-violet-900/50 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 dark:bg-violet-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">ISW Wallet Balance</CardTitle>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Wallet className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        {isLoading ? (
          <div className="flex items-center gap-2 text-violet-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Fetching balance...</span>
          </div>
        ) : error ? (
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">--</div>
        ) : (
          <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {formatCurrency(balance, "UGX", true)}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {error ? "Failed to load" : walletInfo?.is_cached ? "Cached" : "Interswitch Wallet"}
        </p>
      </CardContent>
    </Card>
  );
}

export function KpiCardsRow({ kpis, isLoading, walletEnabled }: KpiCardsRowProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total Disbursed"
        value={formatCurrency(kpis.total_disbursed, "UGX", true)}
        description={`${kpis.disbursement_count} loans disbursed`}
        icon={<TrendingUp className="h-5 w-5 text-white" />}
        gradient="border-rose-100 dark:border-rose-900/50 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50"
        iconBg="bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/25"
      />
      <KpiCard
        title="Total Collections"
        value={formatCurrency(kpis.total_collected, "UGX", true)}
        description={`${kpis.collection_count} payments received`}
        icon={<ArrowUpRight className="h-5 w-5 text-white" />}
        gradient="border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50"
        iconBg="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
      />
      <KpiCard
        title="Active Loans"
        value={String(kpis.active_loans_count)}
        description={`${kpis.overdue_loans_count} overdue`}
        icon={<Banknote className="h-5 w-5 text-white" />}
        gradient="border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50"
        iconBg="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25"
      />
      <KpiCard
        title="Outstanding Portfolio"
        value={formatCurrency(kpis.total_outstanding, "UGX", true)}
        description={`Avg: ${formatCurrency(kpis.average_loan_size, "UGX", true)}`}
        icon={<Wallet className="h-5 w-5 text-white" />}
        gradient="border-cyan-100 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50"
        iconBg="bg-gradient-to-br from-cyan-500 to-sky-600 shadow-cyan-500/25"
      />
      <KpiCard
        title="Overdue Amount"
        value={formatCurrency(kpis.overdue_amount, "UGX", true)}
        description={`${kpis.overdue_loans_count} loans overdue`}
        icon={<AlertTriangle className="h-5 w-5 text-white" />}
        gradient="border-amber-100 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50"
        iconBg="bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25"
      />
      <KpiCard
        title="Default Rate"
        value={`${kpis.default_rate.toFixed(1)}%`}
        description={`${kpis.defaulted_loans_count} defaulted (${formatCurrency(kpis.defaulted_amount, "UGX", true)})`}
        icon={<Percent className="h-5 w-5 text-white" />}
        gradient="border-red-100 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50"
        iconBg="bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25"
      />
      <KpiCard
        title="Recovery Rate"
        value={`${kpis.recovery_rate.toFixed(1)}%`}
        description={`Collection rate: ${kpis.collection_rate.toFixed(1)}%`}
        icon={<Target className="h-5 w-5 text-white" />}
        gradient="border-green-100 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50"
        iconBg="bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25"
      />
      <WalletCard enabled={walletEnabled} />
    </div>
  );
}
