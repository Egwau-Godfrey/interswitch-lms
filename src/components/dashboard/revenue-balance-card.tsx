"use client";

import * as React from "react";
import {
  Building2,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BadgeCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/components/shared/stat-card";
import { useRevenueBalance } from "@/components/dashboard/use-revenue-balance";

interface RevenueBalanceCardProps {
  enabled?: boolean;
}

export function RevenueBalanceCard({ enabled = true }: RevenueBalanceCardProps) {
  const { revenueInfo, isLoading, error, refetch, isRefetching } = useRevenueBalance(enabled);

  const balance = revenueInfo?.balance ?? 0;
  const ourShare = revenueInfo?.our_share ?? 0;
  const iswShare = revenueInfo?.interswitch_share ?? 0;
  const commission = revenueInfo?.commission ?? 0;
  const lien = revenueInfo?.lien ?? 0;
  const splitRatio = revenueInfo?.split_ratio ?? 0.70;
  const accountName = revenueInfo?.name ?? "QRISCORP LENDING FEES";
  const terminalId = revenueInfo?.terminal_id ?? "8FLOATFE02";
  const isCached = revenueInfo?.is_cached ?? false;

  return (
    <Card className="relative overflow-hidden border border-amber-100 dark:border-amber-900/50 bg-linear-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 dark:bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Revenue Split Account
          </CardTitle>
          {isCached && !isLoading && !error && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
              <BadgeCheck className="h-3 w-3 mr-0.5" />
              Cached
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Building2 className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-amber-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Fetching revenue balance...</span>
          </div>
        ) : error ? (
          <>
            <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">--</div>
            <p className="text-xs text-muted-foreground">Failed to load revenue balance</p>
          </>
        ) : (
          <>
            {/* Total Balance */}
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {formatCurrency(balance, "UGX", true)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {accountName} · {terminalId}
              </p>
            </div>

            {/* Split Breakdown */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Our Share ({(splitRatio * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(ourShare, "UGX", true)}
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    ISW Share ({((1 - splitRatio) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(iswShare, "UGX", true)}
                </div>
              </div>
            </div>

            {/* Commission & Lien */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-amber-100 dark:border-amber-900/30">
              <span>
                Commission: <span className="font-medium text-slate-600 dark:text-slate-300">{formatCurrency(commission, "UGX", true)}</span>
              </span>
              <span>
                Lien: <span className="font-medium text-slate-600 dark:text-slate-300">{formatCurrency(lien, "UGX", true)}</span>
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Settled weekly by Interswitch
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
