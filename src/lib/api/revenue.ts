// ============================================
// Revenue Split Balance API Service
// ============================================

import { apiClient } from './client';
import type { RevenueAccountBalance } from '@/lib/types';

export const revenueApi = {
  /**
   * Get the revenue-split account balance (8FLOATFE02) independently.
   * Uses a 5-minute in-memory cache on the backend.
   * Returns balance, commission, lien, name, terminal_id, and 70/30 split.
   */
  getBalance: async (): Promise<RevenueAccountBalance> => {
    return apiClient.get<RevenueAccountBalance>('/dashboard/revenue-balance');
  },
};
