import api from './api';
import type { ApiResponse } from '../types';

export const reportService = {
  async getDailyReport(date: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/reports/daily', { params: { date } });
    return response.data;
  },

  async getWeeklyReport(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/reports/weekly', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  async getMonthlyReport(year: string, month: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/reports/monthly', {
      params: { year, month },
    });
    return response.data;
  },

  async getCustomReport(startDate: string, endDate: string, filters?: any): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/reports/custom', {
      params: { start_date: startDate, end_date: endDate, ...filters },
    });
    return response.data;
  },

  async getApprovalStatistics(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/reports/approval-statistics', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  async getUserActivityReport(userId: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/reports/user-activity', {
      params: { user_id: userId, start_date: startDate, end_date: endDate },
    });
    return response.data;
  },
};
