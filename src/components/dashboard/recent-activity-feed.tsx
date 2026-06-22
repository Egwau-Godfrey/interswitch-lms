"use client";

import * as React from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/components/shared/stat-card";
import type { RecentActivityItem } from "@/lib/types";

interface RecentActivityFeedProps {
  activities: RecentActivityItem[] | undefined;
  isLoading: boolean;
  basePath: "/super-admin" | "/user";
}

function getActivityIcon(type: string) {
  if (type.includes("disbursed")) return <Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  if (type.includes("payment")) return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
  if (type.includes("autostrike_success")) return <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
  if (type.includes("autostrike_failed")) return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  if (type.includes("defaulted")) return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
  if (type.includes("overdue")) return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
  return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
}

function getActivityBg(type: string) {
  if (type.includes("disbursed")) return "bg-blue-100 dark:bg-blue-900/30";
  if (type.includes("payment")) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (type.includes("autostrike_success")) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (type.includes("autostrike_failed")) return "bg-red-100 dark:bg-red-900/30";
  if (type.includes("defaulted")) return "bg-red-100 dark:bg-red-900/30";
  if (type.includes("overdue")) return "bg-amber-100 dark:bg-amber-900/30";
  return "bg-muted";
}

export function RecentActivityFeed({
  activities,
  isLoading,
  basePath,
}: RecentActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const activityList = activities || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and events</CardDescription>
        </div>
        <Link href={`${basePath}/loans`}>
          <span className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ExternalLink className="h-3 w-3" />
          </span>
        </Link>
      </CardHeader>
      <CardContent>
        {activityList.length > 0 ? (
          <div className="space-y-3">
            {activityList.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getActivityBg(activity.type))}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
                {activity.amount !== undefined && activity.amount > 0 && (
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(activity.amount, "UGX")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No recent activity in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
