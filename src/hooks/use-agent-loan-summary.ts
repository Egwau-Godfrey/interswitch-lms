"use client";

import { useApi } from "@/hooks/use-api";
import { agentsApi, apiClient } from "@/lib/api";
import type { AgentLoanSummaryParams, LoanStatusFilter } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface UseAgentLoanSummaryOptions {
  loanStatusFilter: LoanStatusFilter;
  page: number;
  pageSize: number;
  search?: string;
  statusFilter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
}

export function useAgentLoanSummary({
  loanStatusFilter,
  page,
  pageSize,
  search,
  statusFilter,
  sortBy,
  sortOrder = "desc",
  enabled = true,
}: UseAgentLoanSummaryOptions) {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.accessToken) {
      apiClient.setAccessToken(session.user.accessToken);
    } else {
      apiClient.clearAccessToken();
    }
  }, [session]);

  const isAuthenticated = status === "authenticated";
  const isReady = mounted && isAuthenticated;

  const params: AgentLoanSummaryParams = {
    page,
    page_size: pageSize,
    loan_status_filter: loanStatusFilter,
    ...(search ? { search } : {}),
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter as any } : {}),
    ...(sortBy ? { sort_by: sortBy, sort_order: sortOrder } : {}),
  };

  const cacheKey = `agents-loan-summary-${loanStatusFilter}-${page}-${pageSize}-${search || ""}-${statusFilter || "all"}-${sortBy || "default"}-${sortOrder}`;

  const { data, isLoading, error, refetch } = useApi(
    () => agentsApi.listWithLoanSummary(params),
    [loanStatusFilter, page, pageSize, search, statusFilter, sortBy, sortOrder, isReady],
    {
      cacheKey,
      enabled: isReady && enabled,
    }
  );

  return {
    data,
    agents: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.total_pages || 0,
    summary: data?.summary || null,
    isLoading,
    error,
    refetch,
    isReady,
  };
}
