// ============================================
// Users API Service
// ============================================

import { apiClient } from './client';
import type {
  User,
  UserCreate,
  UserUpdate,
  PaginatedResponse,
  ListParams,
} from '@/lib/types';

export const usersApi = {
  /**
   * Create a new user
   */
  create: async (data: UserCreate): Promise<User> => {
    return apiClient.post<User>('/users', data);
  },

  /**
   * List all users with pagination
   */
  list: async (params?: ListParams): Promise<PaginatedResponse<User>> => {
    return apiClient.get<PaginatedResponse<User>>('/users/', params);
  },

  /**
   * Get a single user by ID
   */
  get: async (userId: string): Promise<User> => {
    return apiClient.get<User>(`/users/${userId}`);
  },

  /**
   * Update a user
   */
  update: async (userId: string, data: UserUpdate): Promise<User> => {
    return apiClient.put<User>(`/users/${userId}`, data);
  },

  /**
   * Delete a user
   */
  delete: async (userId: string): Promise<void> => {
    return apiClient.delete<void>(`/users/${userId}`);
  },

  /**
   * Toggle user active status
   */
  toggleActive: async (userId: string, isActive: boolean): Promise<User> => {
    return apiClient.put<User>(`/users/${userId}`, { is_active: isActive });
  },

  /**
   * Toggle user admin status
   */
  toggleAdmin: async (userId: string, isAdmin: boolean): Promise<User> => {
    return apiClient.put<User>(`/users/${userId}`, { is_admin: isAdmin });
  },
};
