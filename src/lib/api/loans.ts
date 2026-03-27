// ============================================
// Loans API Service
// ============================================

import { apiClient } from './client';
import type {
  Loan,
  LoanApplication,
  LoanDetailResponse,
  LoanBalanceResponse,
  LoanStatementResponse,
  PaginatedResponse,
  LoanListParams,
} from '@/lib/types';

export const loansApi = {
  /**
   * Create a new loan application (auto-approves and disburses)
   */
  create: async (data: LoanApplication): Promise<Loan> => {
    return apiClient.post<Loan>('/loans/applications', data);
  },

  /**
   * Apply for a loan (alias for create)
   */
  applyLoan: async (data: LoanApplication): Promise<Loan> => {
    return apiClient.post<Loan>('/loans/applications', data);
  },

  /**
   * List all loans with pagination and filters
   */
  list: async (params?: LoanListParams): Promise<PaginatedResponse<Loan>> => {
    return apiClient.get<PaginatedResponse<Loan>>('/loans', params);
  },

  /**
   * Get loan by ID
   */
  get: async (loanId: string): Promise<Loan> => {
    return apiClient.get<Loan>(`/loans/${loanId}`);
  },

  /**
   * Get loan details with payments, agent, and product info
   */
  getDetail: async (loanId: string): Promise<LoanDetailResponse> => {
    return apiClient.get<LoanDetailResponse>(`/loans/${loanId}/detail`);
  },

  /**
   * Get loan balance summary for an agent
   */
  getBalance: async (agentId: string): Promise<LoanBalanceResponse> => {
    return apiClient.get<LoanBalanceResponse>(`/loans/${agentId}/balance`);
  },

  /**
   * Get loan statement history for a loan
   */
  getStatement: async (loanId: string): Promise<LoanStatementResponse> => {
    return apiClient.get<LoanStatementResponse>(`/loans/${loanId}/ledger`);
  },

  /**
   * Mark loan as cleared
   */
  clearLoan: async (loanId: string): Promise<Loan> => {
    return apiClient.patch<Loan>(`/loans/${loanId}/clear`, {});
  },

  /**
   * Write off a defaulted loan
   */
  writeOff: async (loanId: string): Promise<Loan> => {
    return apiClient.patch<Loan>(`/loans/${loanId}/write-off`, {});
  },

  /**
   * Export loans to CSV
   */
  exportCsv: async (params?: LoanListParams): Promise<Blob> => {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/loans/export`);
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
      throw new Error('Failed to export loans');
    }

    return response.blob();
  },

  /**
   * Download loan statement as PDF
   */
  downloadStatement: async (loanId: string): Promise<Blob> => {
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/loans/${loanId}/ledger/download`;

    const accessToken = apiClient.getAccessToken();
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error('Failed to download statement');
    }

    return response.blob();
  },
};
