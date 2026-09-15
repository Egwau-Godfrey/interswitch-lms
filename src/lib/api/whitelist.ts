// ============================================
// Agent Whitelist API Service
// ============================================

import { apiClient } from './client';
import type {
  CreditProfile,
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

export interface PrequalificationPreview {
  filename: string; total_rows: number; valid_rows: number; selected_rows: number;
  rejected_rows: number; cutoff_score: string | null; awaiting_signup: number;
  registered: number; review_required: number; starter_limit: string; initial_exposure: string;
  already_imported: number; available_rows: number; remaining_after_import: number;
  first_selected_rank: number | null; last_selected_rank: number | null; import_all: boolean;
}

export interface PrequalifiedAgentEntry {
  id: string; batch_id: string; agent_id: string; rank: number; status: string;
  external_score: string; external_band: string | null; external_recommended_limit: string | null;
  starter_limit: string; current_external_limit: string; active_score_source: string; platform_joined_at: string | null; activated_at: string | null;
  external_decision: string; effective_loan_limit: string; available_loan_limit: string;
  qualification_expires_at: string | null; credit_profile: CreditProfile | null;
}

export const prequalificationApi = {
  preview: (file: File, requestedCount: number, importAll = false, starterLimit = 5000) => {
    const form = new FormData(); form.append('file', file); form.append('requested_count', String(requestedCount)); form.append('import_all', String(importAll)); form.append('starter_limit', String(starterLimit));
    return apiClient.postForm<PrequalificationPreview>('/prequalifications/imports/preview', form);
  },
  commit: (file: File, requestedCount: number, importAll = false, starterLimit = 5000, notes?: string) => {
    const form = new FormData(); form.append('file', file); form.append('requested_count', String(requestedCount)); form.append('import_all', String(importAll)); form.append('starter_limit', String(starterLimit)); if (notes) form.append('notes', notes);
    return apiClient.postForm<{ id: string; selected_rows: number; already_imported: number; remaining_after_import: number; first_selected_rank: number | null; last_selected_rank: number | null; awaiting_signup: number; activated: number; review_required: number }>('/prequalifications/imports', form);
  },
  listAgents: (params?: { batch_id?: string; platform_status?: string; search?: string; page?: number; page_size?: number }) => apiClient.get<{ data: PrequalifiedAgentEntry[]; total: number; page: number; page_size: number }>('/prequalifications/agents', params),
  getAgent: (agentId: string) => apiClient.get<PrequalifiedAgentEntry>(`/prequalifications/agents/${agentId}`),
  listImports: () => apiClient.get<{ data: Array<{ id: string; filename: string; selected_rows: number; starter_limit: string; uploaded_by: string | null; created_at: string | null }>; total: number }>('/prequalifications/imports'),
  stats: (batchId: string) => apiClient.get<{ total_selected: number; awaiting_signup: number; joined: number; activated: number; review_required: number; registration_conversion_rate: number }>(`/prequalifications/imports/${batchId}/stats`),
  allStats: () => apiClient.get<{ total_selected: number; awaiting_signup: number; joined: number; activated: number; review_required: number; registration_conversion_rate: number }>('/prequalifications/stats'),
  exportCsv: (batchId: string, platformStatus?: string) => apiClient.getBlob(`/prequalifications/imports/${batchId}/export`, { platform_status: platformStatus }),
  exportAll: (platformStatus?: string) => apiClient.getBlob('/prequalifications/export', { platform_status: platformStatus }),
};
