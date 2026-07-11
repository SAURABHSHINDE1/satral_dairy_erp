import api from './api';
import type { ApiResponse } from '../types';

export interface Setting {
  setting_key: string;
  setting_value: string | null;
  description?: string;
}

export const settingsService = {
  async getAll(): Promise<ApiResponse<Setting[]>> {
    const response = await api.get<ApiResponse<Setting[]>>('/settings');
    return response.data;
  },

  async update(key: string, value: string): Promise<ApiResponse<Setting>> {
    const response = await api.put<ApiResponse<Setting>>(`/settings/${key}`, { value });
    return response.data;
  },

  async updateMultiple(settings: Record<string, string>): Promise<void> {
    await Promise.all(
      Object.entries(settings).map(([key, value]) => settingsService.update(key, value))
    );
  },
};
