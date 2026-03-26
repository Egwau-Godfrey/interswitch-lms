import { apiClient } from './client';

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export const settingsApi = {
  /**
   * Get all system settings
   */
  list: async (): Promise<SystemSetting[]> => {
    return apiClient.get<SystemSetting[]>('/settings');
  },

  /**
   * Get a specific setting by key
   */
  get: async (key: string): Promise<SystemSetting> => {
    return apiClient.get<SystemSetting>(`/settings/${key}`);
  },

  /**
   * Update a setting
   */
  update: async (key: string, value: string, description?: string): Promise<SystemSetting> => {
    return apiClient.patch<SystemSetting>(`/settings/${key}`, { value, description });
  },

  /**
   * Test the configured webhook URL
   */
  testWebhook: async (): Promise<{ status: string; status_code?: number; response?: string; message?: string }> => {
    return apiClient.post('/settings/test-webhook', {});
  }
};
