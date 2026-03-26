"use client";

import * as React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Filter, TrendingUp, AlertTriangle, CheckCircle2, Banknote } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { dashboardApi, reportsApi } from "@/lib/api";
import { generateReportPDF } from "@/lib/pdf-utils";
import { formatCurrency } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  disbursed: "#004B91",
  cleared: "#10B981",
  overdue: "#F59E0B",
  defaulted: "#EF4444",
  pending: "#FFD700",
};

export default function ReportsPage() {
  const { data: stats, isLoading: isLoadingStats } = useApi(() => dashboardApi.getStats());
  const { data: portfolioReport, isLoading: isLoadingPortfolio } = useApi(() => reportsApi.getPortfolioReport());
  const { data: collectionsReport, isLoading: isLoadingCollections } = useApi(() => reportsApi.getCollectionsReport());

  const portfolioChartsData = React.useMemo(() => {
    if (!stats?.loan_status_distribution) return [];
    return stats.loan_status_distribution
      .filter(d => ["disbursed", "cleared", "overdue", "defaulted"].includes(d.status))
      .map(d => ({
        name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
        value: d.amount,
        color: statusColors[d.status] || "#cbd5e1"
      }));
  }, [stats]);

  const agingChartsData = React.useMemo(() => {
    if (!stats?.overdue_aging) return [];
    return stats.overdue_aging.map(d => ({
      range: d.range,
      value: d.amount
    }));
  }, [stats]);

  const monthlyTrendsData = React.useMemo(() => {
    if (!stats?.disbursement_trend) return [];
    return stats.disbursement_trend.map(d => ({
      month: d.month,
      disbursed: d.disbursed / 1000000,
      collected: d.collected / 1000000,
    }));
  }, [stats]);

  const par30 = portfolioReport?.par_30 || 0;
  const avgLoanSize = portfolioReport?.average_loan_size || 0;
  const collectionEfficiency = collectionsReport?.collection_rate || 0;
  const totalInterestEarned = stats?.total_interest_earned || 0;
  const isReady = stats && portfolioReport && collectionsReport;

  const handleDownloadPDF = () => {
    if (!isReady) {
      toast.error("Report data is still loading. Please wait.");
      return;
    }

    try {
      toast.loading("Generating professional report...", { id: "report-pdf" });
      generateReportPDF(stats, portfolioReport, collectionsReport);
      toast.dismiss("report-pdf");
      toast.success("Portfolio report downloaded successfully");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.dismiss("report-pdf");
      toast.error("Failed to generate PDF report");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into portfolio performance and recovery.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button 
            className="bg-[#E31C2D] hover:bg-[#C21827]"
            onClick={handleDownloadPDF}
            disabled={!isReady}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio at Risk (PAR 30)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPortfolio ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-rose-500">{par30}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Current risk exposure</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Loan Size</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPortfolio ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(avgLoanSize)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Portfolio average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCollections ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-emerald-500">{collectionEfficiency}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Repayment performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Interest Earned</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-[#004B91]">{formatCurrency(totalInterestEarned)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Cumulative revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Status Distribution</CardTitle>
            <CardDescription>Breakdown of all active and historical loans</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioChartsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {portfolioChartsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth Trends</CardTitle>
            <CardDescription>Disbursements vs Collections (Millions UGX)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="disbursed" name="Disbursements" stroke="#004B91" strokeWidth={2} />
                <Line type="monotone" dataKey="collected" name="Collections" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Aging Analysis (Overdue Value)</CardTitle>
            <CardDescription>Value of outstanding loans categorized by days past due</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingChartsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `UGX ${value/1000}k`} />
                <Tooltip />
                <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
