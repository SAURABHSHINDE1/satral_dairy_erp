import api from './api';
import type { ApiResponse, ActivityLog } from '../types';

export const activityService = {
  async getAll(filters?: {
    user_id?: number;
    action?: string;
    entity_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ActivityLog[]>> {
    const response = await api.get<ApiResponse<ActivityLog[]>>('/activities', { params: filters });
    return response.data;
  },

  async getCount(filters?: {
    user_id?: number;
    action?: string;
    entity_type?: string;
  }): Promise<ApiResponse<{ count: number }>> {
    const response = await api.get<ApiResponse<{ count: number }>>('/activity-logs/count', { params: filters });
    return response.data;
  },
};
