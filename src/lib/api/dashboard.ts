// ============================================
// Dashboard/Analytics API Service
// ============================================

import { apiClient } from './client';
import type {
  DashboardStats,
  PortfolioReport,
  CollectionsReport,
  DisbursementReport,
} from '@/lib/types';

export const dashboardApi = {
  /**
   * Get dashboard statistics (all-in-one endpoint)
   * Returns: stats, disbursement_trend, loan_status_distribution, overdue_aging, recent_activity
   */
  getStats: async (): Promise<DashboardStats> => {
    return apiClient.get<DashboardStats>('/dashboard/stats');
  },
};

export const reportsApi = {
  /**
   * Get portfolio report
   */
  getPortfolioReport: async (params?: { date_from?: string; date_to?: string }): Promise<PortfolioReport> => {
    return apiClient.get<PortfolioReport>('/reports/portfolio', params);
  },

  /**
   * Get collections report
   */
  getCollectionsReport: async (params?: { period?: 'daily' | 'weekly' | 'monthly'; date_from?: string; date_to?: string }): Promise<CollectionsReport> => {
    return apiClient.get<CollectionsReport>('/reports/collections', params);
  },

  /**
   * Get disbursement report
   */
  getDisbursementReport: async (params?: { period?: 'daily' | 'weekly' | 'monthly'; date_from?: string; date_to?: string }): Promise<DisbursementReport> => {
    return apiClient.get<DisbursementReport>('/reports/disbursements', params);
  },
};
