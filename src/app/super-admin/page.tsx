"use client";

import * as React from "react";
import Link from "next/link";
import {
  Banknote,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  RefreshCw,
  Percent,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { dashboardApi, apiClient } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Mock data for development/fallback
const mockStats: DashboardStats = {
  total_active_loans: 156,
  total_disbursed: 45000000,
  total_collections: 38500000,
  total_interest_earned: 2450000,
  total_overdue: 6500000,
  overdue_count: 23,
  default_rate: 4.2,
  recovery_rate: 85.5,
  disbursement_trend: [
    { month: "Jan", disbursed: 4200000, collected: 3800000 },
    { month: "Feb", disbursed: 4800000, collected: 4100000 },
    { month: "Mar", disbursed: 5100000, collected: 4900000 },
    { month: "Apr", disbursed: 4500000, collected: 4200000 },
    { month: "May", disbursed: 5500000, collected: 5000000 },
    { month: "Jun", disbursed: 6000000, collected: 5200000 },
  ],
  loan_status_distribution: [
    { status: "disbursed", count: 85, amount: 25000000 },
    { status: "overdue", count: 23, amount: 6500000 },
    { status: "cleared", count: 45, amount: 12000000 },
    { status: "defaulted", count: 3, amount: 1500000 },
  ],
  overdue_aging: [
    { range: "1-7 days", count: 10, amount: 2500000 },
    { range: "8-14 days", count: 6, amount: 1800000 },
    { range: "15-30 days", count: 4, amount: 1200000 },
    { range: "30+ days", count: 3, amount: 1000000 },
  ],
  recent_activity: [
    { id: "1", type: "loan_disbursed", description: "Loan disbursed to John Doe", amount: 500000, timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: "2", type: "payment_received", description: "Payment received from Sarah Smith", amount: 250000, timestamp: new Date(Date.now() - 1500000).toISOString() },
    { id: "3", type: "loan_disbursed", description: "Loan disbursed to Michael Obi", amount: 1000000, timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: "4", type: "loan_overdue", description: "Loan overdue for David Chen", amount: 750000, timestamp: new Date(Date.now() - 7200000).toISOString() },
  ],
};

// Status colors for pie chart
const statusColors: Record<string, string> = {
  disbursed: "#004B91",
  cleared: "#10B981",
  overdue: "#F59E0B",
  defaulted: "#EF4444",
  pending: "#FFD700",
  approved: "#3B82F6",
  failed: "#6B7280",
};

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [months, setMonths] = React.useState(6);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  // Set access token when session is available
  React.useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    }
  }, [session]);

  // Fetch dashboard data with authentication
  const { data: stats, isLoading: isStatsLoading, error, refetch } = useApi(
    () => {
      return dashboardApi.getStats({ months });
    },
    [months, mounted, sessionStatus === "authenticated"],
    {
      enabled: mounted && sessionStatus === "authenticated",
      cacheKey: `dashboard-stats-${months}`
    }
  );

  // Consider it loading if either session is loading or stats are being fetched
  const isLoading = isStatsLoading || sessionStatus === "loading";

  // Show error toast if API fails
  React.useEffect(() => {
    if (error && sessionStatus === "authenticated") {
      toast.error("Failed to load dashboard data", {
        description: error.message || "Please try refreshing the page",
      });
    }
  }, [error, sessionStatus]);

  const displayStats = stats || mockStats;
  const isManager = session?.user?.role === 'manager';

  if (isManager) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] border rounded-lg border-dashed mt-6">
        <h2 className="text-2xl font-bold mb-2">Manager Dashboard</h2>
        <p className="text-muted-foreground max-w-md">
          Welcome to the manager view. This interface is currently under development.
          Your specific performance metrics, loan queue, and agent overview will appear here soon.
        </p>
      </div>
    );
  }

  // Prepare pie chart data
  const pieData = displayStats.loan_status_distribution.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: statusColors[item.status] || "#6B7280",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Real-time performance metrics for Interswitch Loans.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Active Loans */}
        <Card className="relative overflow-hidden border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Active Loans</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Banknote className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {displayStats.total_active_loans}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active loans in portfolio
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Disbursed */}
        <Card className="relative overflow-hidden border border-rose-100 dark:border-rose-900/50 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 dark:bg-rose-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Disbursed</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {formatCurrency(displayStats.total_disbursed, "UGX", true)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total amount disbursed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Collections */}
        <Card className="relative overflow-hidden border border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Collections</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {formatCurrency(displayStats.total_collections, "UGX", true)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total payments collected
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Overdue Loans */}
        <Card className="relative overflow-hidden border border-amber-100 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Overdue</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <>
                <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {formatCurrency(displayStats.total_overdue, "UGX", true)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {displayStats.overdue_count} {(displayStats.overdue_count === 1) ? 'loan' : 'loans'} overdue
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Default Rate</p>
              <p className="text-2xl font-bold">{displayStats.default_rate.toFixed(1)}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Percent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recovery Rate</p>
              <p className="text-2xl font-bold">{displayStats.recovery_rate.toFixed(1)}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Disbursement vs Collections</CardTitle>
            <CardDescription>Monthly comparison of disbursed amounts vs collections</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px]" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={displayStats.disbursement_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => formatCurrency(v, "UGX", true)} className="text-xs" />
                  <Tooltip
                    formatter={(value: number | string | undefined) => formatCurrency(value !== undefined ? Number(value) : 0, "UGX")}
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="disbursed" name="Disbursed" fill="#004B91" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Loan Status Distribution</CardTitle>
            <CardDescription>Breakdown of loans by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px]" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const p = percent || 0;
                      return p > 0 ? `${name} (${(p * 100).toFixed(0)}%)` : null;
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Overdue Aging */}
        <Card>
          <CardHeader>
            <CardTitle>Overdue Aging</CardTitle>
            <CardDescription>Distribution of overdue loans by days past due</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={displayStats.overdue_aging} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v, "UGX", true)} className="text-xs" />
                  <YAxis dataKey="range" type="category" className="text-xs" width={80} />
                  <Tooltip
                    formatter={(value: number | string | undefined) => formatCurrency(value !== undefined ? Number(value) : 0, "UGX")}
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="amount" name="Amount" fill="#F59E0B" radius={[0, 4, 4, 0]}>
                    {displayStats.overdue_aging.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index > 2 ? "#EF4444" : "#F59E0B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and events</CardDescription>
            </div>
            <Link href="/super-admin/loans">
              <Button variant="ghost" size="sm">
                View All <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayStats.recent_activity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        activity.type.includes("disbursed") && "bg-blue-100 dark:bg-blue-900/30",
                        activity.type.includes("payment") && "bg-emerald-100 dark:bg-emerald-900/30",
                        activity.type.includes("overdue") && "bg-amber-100 dark:bg-amber-900/30",
                      )}>
                        {activity.type.includes("disbursed") && <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                        {activity.type.includes("payment") && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                        {activity.type.includes("overdue") && <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(activity.amount, "UGX")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
