// ============================================
// Payments API Service
// ============================================

import { apiClient } from './client';
import type {
  LoanPayment,
  PaymentCreate,
  PaginatedResponse,
  PaymentListParams,
} from '@/lib/types';

export const paymentsApi = {
  /**
   * Post a manual payment
   */
  create: async (data: PaymentCreate): Promise<LoanPayment> => {
    return apiClient.post<LoanPayment>('/payments', data);
  },

  /**
   * List all payments with pagination and filters
   */
  list: async (params?: PaymentListParams): Promise<PaginatedResponse<LoanPayment>> => {
    return apiClient.get<PaginatedResponse<LoanPayment>>('/payments', params);
  },

  /**
   * Get a single payment by ID
   */
  get: async (paymentId: string): Promise<LoanPayment> => {
    return apiClient.get<LoanPayment>(`/payments/${paymentId}`);
  },

  /**
   * Get payments for a specific loan
   */
  getByLoan: async (loanId: string): Promise<LoanPayment[]> => {
    const response = await apiClient.get<PaginatedResponse<LoanPayment>>('/payments', { loan_id: loanId, page_size: 100 });
    return response.data;
  },

  /**
   * Export payments to CSV
   */
  exportCsv: async (params?: PaymentListParams): Promise<Blob> => {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/payments/export`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('api_key') : null;
    const response = await fetch(url.toString(), {
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to export payments');
    }

    return response.blob();
  },
};
