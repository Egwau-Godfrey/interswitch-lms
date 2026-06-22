"use client";

import * as React from "react";
import { useApi } from "@/hooks/use-api";
import { useApiAuth } from "@/hooks/use-api-auth";
import { dashboardApi } from "@/lib/api";
import type { DashboardOverviewResponse, DashboardQueryParams } from "@/lib/types";

interface UseDashboardDataParams extends DashboardQueryParams {
  enabled?: boolean;
}

/**
 * Fetches the dashboard overview data.
 * All KPIs, charts, and breakdowns adjust to the selected date range and filters.
 * Does NOT include the ISW wallet balance (use useWalletBalance for that).
 */
export function useDashboardData(params: UseDashboardDataParams) {
  const { status, isReady } = useApiAuth();
  const { enabled = true, ...queryParams } = params;

  const queryKey = JSON.stringify(queryParams);

  const { data, isLoading, error, refetch, isRefetching } = useApi<DashboardOverviewResponse>(
    () => dashboardApi.getOverview(queryParams),
    [queryKey, isReady],
    {
      enabled: enabled && status === "authenticated" && isReady,
      cacheKey: `dashboard-overview-${queryKey}`,
    },
  );

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
}
