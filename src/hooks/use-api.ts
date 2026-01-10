"use client";

import * as React from "react";
import { toast } from "sonner";

// ============================================
// Generic data fetching hook with caching
// ============================================

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  refetchInterval?: number;
  cacheKey?: string;
}

interface UseApiResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

// Simple cache implementation
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    onSuccess,
    onError,
    enabled = true,
    refetchInterval,
    cacheKey,
  } = options;

  const [data, setData] = React.useState<T | undefined>(() => {
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
      }
    }
    return undefined;
  });
  const [isLoading, setIsLoading] = React.useState(!data);
  const [isRefetching, setIsRefetching] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(
    async (isRefetch = false) => {
      if (!enabled) return;

      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await fetcher();
        setData(result);
        if (cacheKey) {
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("An error occurred");
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
      }
    },
    [fetcher, enabled, cacheKey, onSuccess, onError]
  );

  // Initial fetch
  React.useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  // Refetch interval
  React.useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  const refetch = React.useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return { data, isLoading, error, refetch, isRefetching };
}

// ============================================
// Mutation hook for POST/PUT/DELETE operations
// ============================================

interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | undefined>;
  mutateAsync: (variables: V) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  data: T | undefined;
  reset: () => void;
}

export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, successMessage, errorMessage } = options;

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | undefined>();

  const mutateAsync = React.useCallback(
    async (variables: V): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        onSuccess?.(result, variables);
        if (successMessage) {
          toast.success(successMessage);
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("An error occurred");
        setError(error);
        onError?.(error, variables);
        toast.error(errorMessage || error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, successMessage, errorMessage]
  );

  const mutate = React.useCallback(
    async (variables: V): Promise<T | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch {
        return undefined;
      }
    },
    [mutateAsync]
  );

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(undefined);
  }, []);

  return { mutate, mutateAsync, isLoading, error, data, reset };
}

// ============================================
// Pagination hook
// ============================================

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialPageSize = 10 } = options;

  const [page, setPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const handlePageChange = React.useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = React.useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const reset = React.useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    reset,
  };
}

// ============================================
// Filters hook with URL persistence
// ============================================

interface UseFiltersOptions<T> {
  initialFilters: T;
  persistToUrl?: boolean;
}

export function useFilters<T extends Record<string, unknown>>(
  options: UseFiltersOptions<T>
) {
  const { initialFilters, persistToUrl = false } = options;
  const [filters, setFiltersState] = React.useState<T>(initialFilters);

  const setFilters = React.useCallback((newFilters: Partial<T>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFiltersState(initialFilters);
  }, [initialFilters]);

  const clearFilter = React.useCallback((key: keyof T) => {
    setFiltersState((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return { ...initialFilters, ...newFilters };
    });
  }, [initialFilters]);

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (key in initialFilters && value === initialFilters[key]) return false;
      return true;
    }).length;
  }, [filters, initialFilters]);

  return {
    filters,
    setFilters,
    resetFilters,
    clearFilter,
    activeFiltersCount,
  };
}
