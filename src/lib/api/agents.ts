// ============================================
// Agents API Service
// ============================================

import { apiClient, getSecureApiBaseUrl } from './client';
import type {
  Agent,
  AgentCreate,
  AgentUpdate,
  AgentTransaction,
  Loan,
  PaginatedResponse,
  AgentListParams,
  EligibleProductsResponse,
  BulkDeactivateRequest,
  BulkDeactivateResponse,
  BulkActivateRequest,
  BulkActivateResponse,
  BulkActivateResult,
} from '@/lib/types';

export const agentsApi = {
  /**
   * Create a new agent
   */
  create: async (data: AgentCreate): Promise<Agent> => {
    return apiClient.post<Agent>('/agents/', data);
  },

  /**
   * List all agents with pagination and filters
   */
  list: async (params?: AgentListParams): Promise<PaginatedResponse<Agent>> => {
    return apiClient.get<PaginatedResponse<Agent>>('/agents/', params);
  },

  /**
   * Get a single agent by ID
   */
  get: async (agentId: string): Promise<Agent> => {
    return apiClient.get<Agent>(`/agents/${agentId}`);
  },

  /**
   * Update an agent
   */
  update: async (agentId: string, data: AgentUpdate): Promise<Agent> => {
    return apiClient.put<Agent>(`/agents/${agentId}`, data);
  },

  /**
   * Deactivate/Deep delete an agent
   */
  delete: async (agentId: string): Promise<void> => {
    return apiClient.delete<void>(`/agents/${agentId}`);
  },

  /**
   * Get eligible loan products for an agent
   */
  getEligibleProducts: async (agentId: string): Promise<EligibleProductsResponse> => {
    return apiClient.get<EligibleProductsResponse>(`/agents/${agentId}/eligible-products`);
  },

  /**
   * Get agent transaction history
   */
  getTransactions: async (
    agentId: string,
    params?: {
      page?: number;
      page_size?: number;
      date_from?: string;
      date_to?: string;
      status?: string;
      terminal?: string;
      biller?: string;
      search?: string;
    }
  ): Promise<PaginatedResponse<AgentTransaction>> => {
    return apiClient.get<PaginatedResponse<AgentTransaction>>(`/agents/${agentId}/transactions`, params);
  },

  /**
   * Get agent loan history
   */
  getLoanHistory: async (
    agentId: string,
    params?: { page?: number; page_size?: number }
  ): Promise<PaginatedResponse<Loan>> => {
    return apiClient.get<PaginatedResponse<Loan>>(`/agents/${agentId}/loans`, params);
  },

  /**
   * Bulk deactivate agents
   */
  bulkDeactivate: async (data: BulkDeactivateRequest): Promise<BulkDeactivateResponse> => {
    return apiClient.post<BulkDeactivateResponse>('/agents/bulk-deactivate', data);
  },

  /**
   * Bulk activate agents (with credit scoring)
   */
  bulkActivate: async (data: BulkActivateRequest): Promise<BulkActivateResponse> => {
    return apiClient.post<BulkActivateResponse>('/agents/bulk-activate', data);
  },

  /**
   * Activate a single agent with credit scoring
   */
  activateWithScoring: async (agentId: string, skipScoring = false): Promise<BulkActivateResult> => {
    return apiClient.post<BulkActivateResult>(`/agents/${agentId}/activate`, undefined, {
      params: { skip_scoring: skipScoring }
    });
  },

  /**
   * Export agents to CSV
   */
  exportCsv: async (params?: AgentListParams): Promise<Blob> => {
    const url = new URL(`${getSecureApiBaseUrl()}/agents/export`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const accessToken = apiClient.getAccessToken();
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error('Failed to export agents');
    }

    return response.blob();
  },
};
