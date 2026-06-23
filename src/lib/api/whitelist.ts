// ============================================
// Agent Whitelist API Service
// ============================================

import { apiClient } from './client';
import type {
  WhitelistEntry,
  WhitelistListResponse,
  NonWhitelistedListResponse,
  WhitelistStatus,
  WhitelistAddRequest,
  WhitelistBulkAddRequest,
  WhitelistBulkRemoveRequest,
  WhitelistBulkResponse,
  WhitelistListParams,
} from '@/lib/types';

export const whitelistApi = {
  /**
   * List all whitelisted agents with pagination and search
   */
  list: async (params?: WhitelistListParams): Promise<WhitelistListResponse> => {
    return apiClient.get<WhitelistListResponse>('/whitelist/', params);
  },

  /**
   * List active agents NOT on the whitelist
   */
  listNonWhitelisted: async (params?: WhitelistListParams): Promise<NonWhitelistedListResponse> => {
    return apiClient.get<NonWhitelistedListResponse>('/whitelist/non-whitelisted', params);
  },

  /**
   * Check whitelist status for a single agent
   */
  getStatus: async (agentId: string): Promise<WhitelistStatus> => {
    return apiClient.get<WhitelistStatus>(`/whitelist/${agentId}`);
  },

  /**
   * Add a single agent to the whitelist
   */
  add: async (data: WhitelistAddRequest): Promise<WhitelistEntry> => {
    return apiClient.post<WhitelistEntry>('/whitelist/', data);
  },

  /**
   * Remove a single agent from the whitelist
   */
  remove: async (agentId: string): Promise<WhitelistEntry> => {
    return apiClient.delete<WhitelistEntry>(`/whitelist/${agentId}`);
  },

  /**
   * Bulk add agents to the whitelist
   */
  bulkAdd: async (data: WhitelistBulkAddRequest): Promise<WhitelistBulkResponse> => {
    return apiClient.post<WhitelistBulkResponse>('/whitelist/bulk-add', data);
  },

  /**
   * Bulk remove agents from the whitelist
   */
  bulkRemove: async (data: WhitelistBulkRemoveRequest): Promise<WhitelistBulkResponse> => {
    return apiClient.post<WhitelistBulkResponse>('/whitelist/bulk-remove', data);
  },
};
