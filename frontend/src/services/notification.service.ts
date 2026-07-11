import api from './api';
import type { ApiResponse, ActivityLog } from '../types';

// Derive notifications from recent activity logs since no dedicated notifications endpoint exists
export const notificationService = {
  async getRecentActivities(limit = 10): Promise<ApiResponse<ActivityLog[]>> {
    const response = await api.get<ApiResponse<ActivityLog[]>>('/activities', {
      params: { limit },
    });
    return response.data;
  },
};
