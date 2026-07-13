// ============================================
// Scoring Dashboard API Service
// ============================================

import { apiClient, getSecureApiBaseUrl } from './client';
import type {
  ScoredAgent,
  ScoredAgentListParams,
  PaginatedResponse,
  CreditScoreHistoryEntry,
  ScoringStats,
  BulkScoreRequest,
  BulkScoreResponse,
  RescoreAllResponse,
} from '@/lib/types';
import type { ScoreBreakdown, AgentBehavior, ModelPerformanceResponse } from '@/lib/types/scoring';

export const scoringDashboardApi = {
  /**
   * List scored agents with pagination and filters
   */
  listScoredAgents: (params?: ScoredAgentListParams): Promise<PaginatedResponse<ScoredAgent>> =>
    apiClient.get<PaginatedResponse<ScoredAgent>>('/scoring/scored-agents', params as any),

  /**
   * Get aggregate scoring statistics
   */
  getStats: (): Promise<ScoringStats> =>
    apiClient.get<ScoringStats>('/scoring/stats'),

  /**
   * Get credit score history for a specific agent
   */
  getScoreHistory: (agentId: string, limit = 10): Promise<CreditScoreHistoryEntry[]> =>
    apiClient.get<CreditScoreHistoryEntry[]>(`/scoring/agents/${agentId}/history`, { limit }),

  /**
   * Get detailed factor-level score breakdown for an agent
   */
  getScoreBreakdown: (agentId: string): Promise<ScoreBreakdown> =>
    apiClient.get<ScoreBreakdown>(`/scoring/agents/${agentId}/breakdown`),

  /**
   * Get loan repayment behavior metrics for an agent
   */
  getAgentBehavior: (agentId: string): Promise<AgentBehavior> =>
    apiClient.get<AgentBehavior>(`/scoring/agents/${agentId}/behavior`),

  /**
   * Trigger a credit score calculation for a single agent
   */
  triggerScore: (agentId: string): Promise<{ success: boolean; score?: number; loan_limit?: number; risk_level?: string; message: string }> =>
    apiClient.post(`/scoring/agents/${agentId}/score`),

  /**
   * Trigger bulk credit score calculation for multiple agents
   */
  bulkScore: (payload: BulkScoreRequest): Promise<BulkScoreResponse> =>
    apiClient.post<BulkScoreResponse>('/scoring/agents/bulk-score', payload),

  /**
   * Rescore ALL agents in the system (super admin only)
   */
  rescoreAll: (): Promise<RescoreAllResponse> =>
    apiClient.post<RescoreAllResponse>('/scoring/rescore-all'),

  /**
   * Export scored agents list as CSV or XLSX
   */
  exportScoredAgents: async (
    params?: Omit<ScoredAgentListParams, 'page' | 'page_size'>,
    format: 'csv' | 'xlsx' = 'csv'
  ): Promise<Blob> => {
    const url = new URL(`${getSecureApiBaseUrl()}/scoring/scored-agents/export`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    url.searchParams.append('format', format);

    const accessToken = apiClient.getAccessToken();
    const headers: HeadersInit = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error('Failed to export scored agents');
    return response.blob();
  },

  /**
   * Get model performance analytics (prediction vs outcome)
   */
  getModelPerformance: (params?: {
    date_from?: string;
    date_to?: string;
    scoring_method?: string;
  }): Promise<ModelPerformanceResponse> =>
    apiClient.get<ModelPerformanceResponse>('/scoring/model-performance', params),
};
