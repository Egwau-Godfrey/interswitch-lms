"use client";

import { Banknote, AlertTriangle, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LoanSummaryTotals } from "@/lib/types";
import { formatCurrency } from "@/components/shared/stat-card";

interface LoansKpiStripProps {
  summary: LoanSummaryTotals | null;
  isLoading?: boolean;
}

export function LoansKpiStrip({ summary, isLoading }: LoansKpiStripProps) {
  const cards = [
    {
      label: "Total Loans",
      value: summary ? String(summary.total_loans) : "—",
      icon: Banknote,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Outstanding",
      value: summary ? formatCurrency(summary.total_outstanding, "UGX", true) : "—",
      icon: Clock,
      color: "text-[#004B91]",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Overdue",
      value: summary ? formatCurrency(summary.total_overdue_amount, "UGX", true) : "—",
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Active Loans",
      value: summary ? String(summary.disbursed_count) : "—",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Cleared",
      value: summary ? String(summary.cleared_count) : "—",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              {isLoading && !summary ? (
                <Skeleton className="h-5 w-16 mt-1" />
              ) : (
                <p className="text-lg font-bold leading-tight">{card.value}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
