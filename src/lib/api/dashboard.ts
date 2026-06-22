// ============================================
// Dashboard/Analytics API Service (redesigned)
// ============================================

import { apiClient } from './client';
import type {
  DashboardOverviewResponse,
  DashboardQueryParams,
  WalletInfo,
} from '@/lib/types';

export const dashboardApi = {
  /**
   * Get the redesigned dashboard overview.
   * All KPIs, charts, and breakdowns adjust to the selected date range and filters.
   * Does NOT include the ISW wallet balance (use getWalletBalance for that).
   */
  getOverview: async (params?: DashboardQueryParams): Promise<DashboardOverviewResponse> => {
    return apiClient.get<DashboardOverviewResponse>('/dashboard/overview', params as Record<string, string | number | boolean | undefined> | undefined);
  },

  /**
   * Get the ISW wallet balance independently (non-blocking).
   * Uses a 5-minute in-memory cache on the backend.
   */
  getWalletBalance: async (): Promise<WalletInfo> => {
    return apiClient.get<WalletInfo>('/dashboard/wallet');
  },
};
