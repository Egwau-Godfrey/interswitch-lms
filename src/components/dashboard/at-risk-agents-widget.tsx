"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/shared/stat-card";
import type { AtRiskAgent } from "@/lib/types";

interface AtRiskAgentsWidgetProps {
  agents: AtRiskAgent[] | undefined;
  isLoading: boolean;
  basePath: "/super-admin" | "/user";
}

function statusBadgeClass(status: string): string {
  if (status === "defaulted") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
}

function riskBadgeClass(risk: string | null): string {
  if (risk === "high") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (risk === "medium") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (risk === "low") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  return "bg-muted text-muted-foreground";
}

export function AtRiskAgentsWidget({ agents, isLoading, basePath }: AtRiskAgentsWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const agentList = agents || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            At-Risk Agents
          </CardTitle>
          <CardDescription>Top 5 worst overdue/defaulted</CardDescription>
        </div>
        <Link href={`${basePath}/reports?tab=risk`}>
          <span className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ExternalLink className="h-3 w-3" />
          </span>
        </Link>
      </CardHeader>
      <CardContent>
        {agentList.length > 0 ? (
          <div className="space-y-3">
            {agentList.map((agent) => (
              <Link
                key={agent.agent_id}
                href={`${basePath}/loans?agent_id=${agent.agent_id}`}
                className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{agent.full_name}</p>
                      <span className="text-xs text-muted-foreground">({agent.agent_id})</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className={cn("text-xs", statusBadgeClass(agent.status))}>
                        {agent.status}
                      </Badge>
                      {agent.risk_level && (
                        <Badge variant="secondary" className={cn("text-xs", riskBadgeClass(agent.risk_level))}>
                          {agent.risk_level} risk
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {agent.days_overdue_max}d overdue · {agent.overdue_loans_count} loan(s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">
                      {formatCurrency(agent.total_outstanding, "UGX", true)}
                    </p>
                  </div>
                </div>
                {agent.autostrike_attempts > 0 && (
                  <div className="mt-2 flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>
                      Autostrike: {agent.autostrike_attempts} attempts ·{" "}
                      {agent.autostrike_successful} success ·{" "}
                      {formatCurrency(agent.autostrike_amount_recovered, "UGX", true)} recovered
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No at-risk agents in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
