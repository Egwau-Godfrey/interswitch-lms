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

  // Only use real stats, no fallback to mock data
  const displayStats = stats;
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

  // Prepare pie chart data (guard for undefined)
  const pieData = displayStats?.loan_status_distribution?.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: statusColors[item.status] || "#6B7280",
  })) || [];

  // Error state if API fails
  if (error && sessionStatus === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Failed to load dashboard data</h2>
        <p className="text-muted-foreground mb-4">{error.message || "An unexpected error occurred. Please try refreshing the page."}</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Loading state (skeletons)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4"><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
          <Card className="lg:col-span-3"><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
          <Card><CardContent>{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full mb-2" />))}</CardContent></Card>
        </div>
      </div>
    );
  }

  // Only render dashboard if data is available
  if (!displayStats) return null;

  // ...existing code for rendering dashboard with real data only...
}
