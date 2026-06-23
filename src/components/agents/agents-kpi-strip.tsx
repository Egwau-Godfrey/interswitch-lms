"use client";

import { Users, Banknote, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentLoanSummaryTotals } from "@/lib/types";
import { formatCurrency } from "@/components/shared/stat-card";

interface AgentsKPIStripProps {
  summary: AgentLoanSummaryTotals | null;
}

export function AgentsKPIStrip({ summary }: AgentsKPIStripProps) {
  if (!summary) return null;

  const cards = [
    {
      label: "Total Agents",
      value: summary.total_agents,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Total Exposure",
      value: formatCurrency(summary.total_outstanding),
      icon: Banknote,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Defaulted",
      value: summary.defaulted_count,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Overdue",
      value: summary.overdue_count,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Active Loans",
      value: summary.active_loan_count,
      icon: TrendingUp,
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
              <p className="text-lg font-bold leading-tight">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
