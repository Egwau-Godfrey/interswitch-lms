"use client";

import * as React from "react";
import { useApi } from "@/hooks/use-api";
import { useApiAuth } from "@/hooks/use-api-auth";
import { revenueApi } from "@/lib/api";
import type { RevenueAccountBalance } from "@/lib/types";

const REVENUE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the revenue-split account balance (8FLOATFE02) independently.
 * The main dashboard loads instantly; this hook fills in the revenue card
 * when the external Infinity API responds.
 * Auto-refreshes every 5 minutes.
 */
export function useRevenueBalance(enabled: boolean = true) {
  const { status, isReady } = useApiAuth();

  const { data, isLoading, error, refetch, isRefetching } = useApi<RevenueAccountBalance>(
    () => revenueApi.getBalance(),
    [isReady],
    {
      enabled: enabled && status === "authenticated" && isReady,
      cacheKey: "dashboard-revenue-balance",
      refetchInterval: REVENUE_REFRESH_INTERVAL,
    },
  );

  return {
    balance: data?.balance ?? 0,
    revenueInfo: data,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
}
