// ============================================
// Payments API Service
// ============================================

import { apiClient, getSecureApiBaseUrl } from './client';
import type {
  LoanPayment,
  PaymentCreate,
  PaginatedResponse,
  PaymentListParams,
  PaymentActionResult,
  PaymentReversalAuditEntry,
  PaymentReversalPreview,
} from '@/lib/types';

export const paymentsApi = {
  /**
   * Post a manual payment
   */
  create: async (data: PaymentCreate): Promise<LoanPayment> => {
    return apiClient.post<LoanPayment>('/payments/', data);
  },

  /**
   * List all payments with pagination and filters
   */
  list: async (params?: PaymentListParams): Promise<PaginatedResponse<LoanPayment>> => {
    return apiClient.get<PaginatedResponse<LoanPayment>>('/payments/', params);
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
    const response = await apiClient.get<PaginatedResponse<LoanPayment>>('/payments/', { loan_id: loanId, page_size: 100 });
    return response.data;
  },

  /**
   * Export payments to CSV
   */
  exportCsv: async (params?: PaymentListParams): Promise<Blob> => {
    const url = new URL(`${getSecureApiBaseUrl()}/payments/export`);
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
      throw new Error('Failed to export payments');
    }

    return response.blob();
  },

  delete: async (paymentId: string): Promise<void> => {
    return apiClient.delete(`/payments/${paymentId}`);
  },

  /**
   * Dry-run the impact of reversing a posted payment (no changes written).
   */
  reversalPreview: async (paymentId: string): Promise<PaymentReversalPreview> => {
    return apiClient.get<PaymentReversalPreview>(`/payments/${paymentId}/reversal-preview`);
  },

  /**
   * Reverse a posted payment: audited, compensates revenue splits, rebuilds the loan.
   * Autostrike stays frozen on the loan unless rearm_autostrike is true.
   */
  reverse: async (paymentId: string, reason: string, rearmAutostrike = false): Promise<PaymentActionResult> => {
    return apiClient.post<PaymentActionResult>(`/payments/${paymentId}/reverse`, {
      reason,
      rearm_autostrike: rearmAutostrike,
    });
  },

  /**
   * Flip a reversed/void payment back to posted (undo a reversal).
   */
  restore: async (paymentId: string, reason: string, rearmAutostrike = false): Promise<PaymentActionResult> => {
    return apiClient.post<PaymentActionResult>(`/payments/${paymentId}/restore`, {
      reason,
      rearm_autostrike: rearmAutostrike,
    });
  },

  /**
   * Mark a posted payment as void (never represented real money movement).
   */
  voidPayment: async (paymentId: string, reason: string): Promise<PaymentActionResult> => {
    return apiClient.post<PaymentActionResult>(`/payments/${paymentId}/void`, { reason });
  },

  /**
   * Reverse an overstated booking and re-book the true debited amount atomically.
   */
  correct: async (paymentId: string, trueAmount: number, reason: string, newReference?: string): Promise<PaymentActionResult> => {
    return apiClient.post<PaymentActionResult>(`/payments/${paymentId}/correct`, {
      reason,
      true_amount: trueAmount,
      new_reference: newReference,
    });
  },

  /**
   * Audit trail of every reversal-family action taken on this payment.
   */
  audit: async (paymentId: string): Promise<PaymentReversalAuditEntry[]> => {
    const response = await apiClient.get<{ data: PaymentReversalAuditEntry[] }>(`/payments/${paymentId}/audit`);
    return response.data;
  },
};
