"use client";

import { useApi } from "@/hooks/use-api";
import { loansApi } from "@/lib/api";
import type { LoanSummaryParams, LoanStatusTab } from "@/lib/types";

interface UseLoanSummaryOptions {
  statusTab: LoanStatusTab;
  page: number;
  pageSize: number;
  search?: string;
  isReady: boolean;
  enabled?: boolean;
}

export function useLoanSummary({
  statusTab,
  page,
  pageSize,
  search,
  isReady,
  enabled = true,
}: UseLoanSummaryOptions) {
  const params: LoanSummaryParams = {
    page,
    page_size: pageSize,
    ...(search ? { search } : {}),
    ...(statusTab !== "all" ? { status: statusTab as any } : {}),
  };

  const cacheKey = `loans-summary-${statusTab}-${page}-${pageSize}-${search || ""}`;

  const { data, isLoading, error, refetch } = useApi(
    () => loansApi.listWithSummary(params),
    [statusTab, page, pageSize, search, isReady],
    {
      cacheKey,
      enabled: isReady && enabled,
    }
  );

  return {
    data,
    loans: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.total_pages || 0,
    summary: data?.summary || null,
    isLoading,
    error,
    refetch,
    isReady,
  };
}
