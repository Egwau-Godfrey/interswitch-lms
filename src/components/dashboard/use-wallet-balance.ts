"use client";

import * as React from "react";
import { useApi } from "@/hooks/use-api";
import { useApiAuth } from "@/hooks/use-api-auth";
import { dashboardApi } from "@/lib/api";
import type { WalletInfo } from "@/lib/types";

const WALLET_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the ISW wallet balance independently (non-blocking).
 * The main dashboard loads instantly; this hook fills in the wallet card
 * when the external Interswitch API responds.
 * Auto-refreshes every 5 minutes.
 */
export function useWalletBalance(enabled: boolean = true) {
  const { status, isReady } = useApiAuth();

  const { data, isLoading, error, refetch, isRefetching } = useApi<WalletInfo>(
    () => dashboardApi.getWalletBalance(),
    [isReady],
    {
      enabled: enabled && status === "authenticated" && isReady,
      cacheKey: "dashboard-wallet-balance",
      refetchInterval: WALLET_REFRESH_INTERVAL,
    },
  );

  return {
    balance: data?.balance ?? 0,
    walletInfo: data,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
}
