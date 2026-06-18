// ============================================
// Permissions API Service
// ============================================

import { apiClient } from './client';
import type {
  PermissionGrant,
  AuditLogEntry,
  CreateGrantRequest,
  GrantListParams,
  AuditLogParams,
  PaginatedResponse,
} from '@/lib/types';

export const permissionsApi = {
  /**
   * Create a new write-access grant for a manager.
   * Super admin only.
   */
  createGrant: async (data: CreateGrantRequest): Promise<PermissionGrant> => {
    return apiClient.post<PermissionGrant>('/permissions/grants', data);
  },

  /**
   * List all permission grants with optional filters.
   * Super admin only.
   */
  listGrants: async (
    params?: GrantListParams
  ): Promise<PaginatedResponse<PermissionGrant>> => {
    return apiClient.get<PaginatedResponse<PermissionGrant>>(
      '/permissions/grants',
      params as any
    );
  },

  /**
   * Revoke a specific grant.
   * Super admin only.
   */
  revokeGrant: async (grantId: string): Promise<void> => {
    return apiClient.delete<void>(`/permissions/grants/${grantId}`);
  },

  /**
   * Get the active grants for the currently authenticated manager.
   */
  getMyGrants: async (): Promise<PermissionGrant[]> => {
    return apiClient.get<PermissionGrant[]>('/permissions/grants/mine');
  },

  /**
   * Get the audit log (paginated, filterable).
   * Super admin only.
   */
  getAuditLog: async (
    params?: AuditLogParams
  ): Promise<PaginatedResponse<AuditLogEntry>> => {
    return apiClient.get<PaginatedResponse<AuditLogEntry>>(
      '/permissions/audit-log',
      params as any
    );
  },
};
