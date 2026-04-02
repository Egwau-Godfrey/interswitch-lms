// ============================================
// API Clients Management Service
// ============================================

import { apiClient } from './client';
import type {
  ApiClient as ApiClientType,
  ApiClientCreate,
  PaginatedResponse,
} from '@/lib/types';

export const apiClientsApi = {
  /**
   * Issue a new API key
   */
  create: async (data: ApiClientCreate): Promise<ApiClientType & { api_key: string }> => {
    return apiClient.post<ApiClientType & { api_key: string }>('/api-clients', data);
  },

  /**
   * List all API clients with optional filtering and pagination
   */
  list: async (params?: { page?: number; page_size?: number; is_active?: boolean }): Promise<PaginatedResponse<ApiClientType>> => {
    return apiClient.get<PaginatedResponse<ApiClientType>>('/api-clients/', params as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Revoke an API client
   */
  revoke: async (clientId: string): Promise<void> => {
    return apiClient.delete<void>(`/api-clients/${clientId}`);
  },

  /**
   * Update API client (e.g., allowed IPs)
   */
  update: async (clientId: string, data: Partial<ApiClientCreate>): Promise<ApiClientType> => {
    return apiClient.put<ApiClientType>(`/api-clients/${clientId}`, data);
  },
};
