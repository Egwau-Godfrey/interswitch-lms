"use client";

import * as React from "react";
import { TrendingUp, ShieldCheck, AlertTriangle, ShieldX, Ban } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScoringStats } from "@/lib/types";

interface ScoringStatsCardsProps {
  stats: ScoringStats | undefined;
  isLoading: boolean;
}

export function ScoringStatsCards({ stats, isLoading }: ScoringStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        title="Total Scored"
        value={stats?.total_scored ?? "--"}
        icon={<TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        iconClassName="bg-blue-100 dark:bg-blue-900/30"
      />
      <StatCard
        title="Low Risk"
        value={stats?.low_risk_count ?? "--"}
        icon={<ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />}
        iconClassName="bg-green-100 dark:bg-green-900/30"
      />
      <StatCard
        title="Medium Risk"
        value={stats?.medium_risk_count ?? "--"}
        icon={<AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
        iconClassName="bg-amber-100 dark:bg-amber-900/30"
      />
      <StatCard
        title="High Risk"
        value={stats?.high_risk_count ?? "--"}
        icon={<ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />}
        iconClassName="bg-red-100 dark:bg-red-900/30"
      />
      <StatCard
        title="Rejected"
        value={stats?.rejected_count ?? "--"}
        icon={<Ban className="h-6 w-6 text-gray-600 dark:text-gray-400" />}
        iconClassName="bg-gray-100 dark:bg-gray-900/30"
      />
    </div>
  );
}
