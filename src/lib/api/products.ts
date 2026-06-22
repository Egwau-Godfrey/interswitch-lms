// ============================================
// Loan Products API Service
// ============================================

import { apiClient, getSecureApiBaseUrl } from './client';
import type {
  LoanProduct,
  LoanProductCreate,
  LoanProductUpdate,
  LoanType,
  PaginatedResponse,
  ListParams,
} from '@/lib/types';

export interface ProductListParams extends ListParams {
  is_active?: boolean;
  loan_type?: LoanType;
  search?: string;
}

export const productsApi = {
  /**
   * List all loan products with optional filters
   */
  list: async (params?: ProductListParams): Promise<PaginatedResponse<LoanProduct>> => {
    return apiClient.get<PaginatedResponse<LoanProduct>>('/loan-products', params as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get all active products (no pagination)
   */
  listActive: async (): Promise<LoanProduct[]> => {
    const response = await apiClient.get<PaginatedResponse<LoanProduct>>('/loan-products', { is_active: true, page_size: 100 });
    return response.data;
  },

  /**
   * Create a new loan product
   */
  create: async (data: LoanProductCreate): Promise<LoanProduct> => {
    return apiClient.post<LoanProduct>('/loan-products', data);
  },

  /**
   * Get a single loan product by ID
   */
  get: async (productId: string): Promise<LoanProduct> => {
    return apiClient.get<LoanProduct>(`/loan-products/${productId}`);
  },

  /**
   * Update a loan product
   */
  update: async (productId: string, data: LoanProductUpdate): Promise<LoanProduct> => {
    return apiClient.put<LoanProduct>(`/loan-products/${productId}`, data);
  },

  /**
   * Delete a loan product
   */
  delete: async (productId: string): Promise<void> => {
    return apiClient.delete<void>(`/loan-products/${productId}`);
  },

  /**
   * Toggle product active status
   */
  toggleActive: async (productId: string, isActive: boolean): Promise<LoanProduct> => {
    return apiClient.put<LoanProduct>(`/loan-products/${productId}`, { is_active: isActive });
  },

  /**
   * Set product as default
   */
  setDefault: async (productId: string): Promise<LoanProduct> => {
    return apiClient.put<LoanProduct>(`/loan-products/${productId}`, { is_default: true });
  },

  /**
   * Assign user to product
   */
  assignUser: async (productId: string, userId: string): Promise<void> => {
    return apiClient.post<void>(`/loan-products/${productId}/assign-user`, { user_id: userId });
  },

  exportCsv: async (params?: { is_active?: boolean }): Promise<Blob> => {
    const url = new URL(`${getSecureApiBaseUrl()}/loan-products/export`);
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
      throw new Error('Failed to export products');
    }

    return response.blob();
  },
};
