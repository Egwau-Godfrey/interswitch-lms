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
   * List all API clients
   */
  list: async (): Promise<PaginatedResponse<ApiClientType>> => {
    return apiClient.get<PaginatedResponse<ApiClientType>>('/api-clients');
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
