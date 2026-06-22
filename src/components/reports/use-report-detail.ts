"use client";

import * as React from "react";
import { reportsApi, type ReportDetailParams } from "@/lib/api/reports";
import type { ReportFilters, ReportPagination } from "@/lib/types";

interface UseReportDetailOptions {
  endpoint: "disbursements" | "collections" | "revenue" | "risk" | "autostrike" | "agents";
  dateFrom?: string;
  dateTo?: string;
  timezone?: string;
  granularity?: string;
  filters: ReportFilters;
  enabled: boolean;
}

interface UseReportDetailResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  pagination: ReportPagination | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  refetch: () => void;
}

/**
 * Fetches paginated report detail data for a specific tab.
 * Re-fetches when filters, date range, granularity, or pagination changes.
 */
export function useReportDetail<T>({
  endpoint,
  dateFrom,
  dateTo,
  timezone = "Africa/Kampala",
  granularity = "day",
  filters,
  enabled,
}: UseReportDetailOptions): UseReportDetailResult<T> {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [refetchKey, setRefetchKey] = React.useState(0);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [JSON.stringify(filters), dateFrom, dateTo, granularity]);

  React.useEffect(() => {
    if (!enabled || !dateFrom || !dateTo) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    const params: ReportDetailParams = {
      date_from: dateFrom,
      date_to: dateTo,
      timezone,
      granularity: granularity as ReportDetailParams["granularity"],
      page,
      page_size: pageSize,
      ...filters,
    };

    const fetcher = {
      disbursements: () => reportsApi.getDisbursementsDetail(params),
      collections: () => reportsApi.getCollectionsDetail(params),
      revenue: () => reportsApi.getRevenueDetail(params),
      risk: () => reportsApi.getRiskDetail(params),
      autostrike: () => reportsApi.getAutostrikeDetail(params),
      agents: () => reportsApi.getAgentsDetail(params),
    }[endpoint];

    fetcher()
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result as T);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error("Failed to load report"));
          setIsLoading(false);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, dateFrom, dateTo, timezone, granularity, JSON.stringify(filters), page, pageSize, enabled, refetchKey]);

  const pagination = data ? (data as { pagination?: ReportPagination }).pagination ?? null : null;

  return {
    data,
    isLoading,
    error,
    page,
    pageSize,
    pagination,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    refetch: () => setRefetchKey((k) => k + 1),
  };
}
