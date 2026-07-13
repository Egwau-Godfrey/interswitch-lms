// ============================================
// Scoring Configuration API Service
// ============================================

import { apiClient } from './client';
import type {
  ScoringConfigEntry,
  ScoringConfigGroup,
  ScoringConfigResetResponse,
  MLModelInfo,
} from '@/lib/types/scoring';

export const scoringConfigApi = {
  /** Get all scoring config entries (flat list). */
  getAll: (): Promise<ScoringConfigEntry[]> =>
    apiClient.get<ScoringConfigEntry[]>('/scoring/config'),

  /** Get scoring config grouped by category with display labels. */
  getGrouped: (): Promise<ScoringConfigGroup[]> =>
    apiClient.get<ScoringConfigGroup[]>('/scoring/config/grouped'),

  /** Get a single config entry by key. */
  getEntry: (key: string): Promise<ScoringConfigEntry> =>
    apiClient.get<ScoringConfigEntry>(`/scoring/config/${key}`),

  /** Update a single config entry by key. */
  updateEntry: (key: string, value: string): Promise<ScoringConfigEntry> =>
    apiClient.put<ScoringConfigEntry>(`/scoring/config/${key}`, { value }),

  /** Bulk update multiple config entries. */
  bulkUpdate: (
    updates: { key: string; value: string }[]
  ): Promise<ScoringConfigEntry[]> =>
    apiClient.put<ScoringConfigEntry[]>('/scoring/config', { updates }),

  /** Reset all config entries to system defaults. */
  reset: (): Promise<ScoringConfigResetResponse> =>
    apiClient.post<ScoringConfigResetResponse>('/scoring/config/reset'),

  /** Get ML model metadata for informational display. */
  getMLModelInfo: (): Promise<MLModelInfo> =>
    apiClient.get<MLModelInfo>('/scoring/config/ml-model-info'),
};
