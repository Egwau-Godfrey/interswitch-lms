"use client";

import { useApi, useMutation } from "./use-api";
import { apiClientsApi } from "@/lib/api/api-clients";
import type { ApiClient, ApiClientCreate, PaginatedResponse } from "@/lib/types";

export interface UseApiClientsParams {
  page?: number;
  page_size?: number;
  is_active?: boolean;
}

/**
 * Hook to fetch paginated API clients
 */
export function useApiClients(params: UseApiClientsParams = {}, options: { enabled?: boolean } = {}) {
  // Use a stringified version of params as part of the cache key
  const cacheKey = `api-clients-${JSON.stringify(params)}`;

  return useApi<PaginatedResponse<ApiClient>>(
    () => apiClientsApi.list(params),
    [params.page, params.page_size, params.is_active, options.enabled],
    {
      cacheKey,
      refetchInterval: 30000, // Optional: auto-refresh every 30s
      enabled: options.enabled,
    }
  );
}

/**
 * Hook to issue a new API key
 */
export function useIssueApiKey() {
  return useMutation<ApiClient & { api_key: string }, ApiClientCreate>(
    (data: ApiClientCreate) => apiClientsApi.create(data),
    {
      successMessage: "API key issued successfully.",
      errorMessage: "Failed to issue API key. Please try again.",
    }
  );
}

/**
 * Hook to revoke an existing API key
 */
export function useRevokeApiKey() {
  return useMutation<void, string>(
    (clientId: string) => apiClientsApi.revoke(clientId),
    {
      successMessage: "API key revoked successfully.",
      errorMessage: "Failed to revoke API key. Please try again.",
    }
  );
}
