import api from './api';
import type { ApiResponse, TankRecord, TankRecordFormData, Statistics } from '../types';

export const tankService = {
  async getAll(filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    process_operator_id?: number;
    tank_number?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<TankRecord[]>> {
    const response = await api.get<ApiResponse<TankRecord[]>>('/tank-records', { params: filters });
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<TankRecord>> {
    const response = await api.get<ApiResponse<TankRecord>>(`/tank-records/${id}`);
    return response.data;
  },

  async create(data: TankRecordFormData): Promise<ApiResponse<TankRecord>> {
    const response = await api.post<ApiResponse<TankRecord>>('/tank-records', data);
    return response.data;
  },

  async update(id: number, data: Partial<TankRecordFormData>): Promise<ApiResponse<TankRecord>> {
    const response = await api.put<ApiResponse<TankRecord>>(`/tank-records/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/tank-records/${id}`);
    return response.data;
  },

  async approveByLab(id: number, remarks?: string): Promise<ApiResponse<TankRecord>> {
    const response = await api.post<ApiResponse<TankRecord>>(`/tank-records/${id}/approve-lab`, { remarks });
    return response.data;
  },

  async rejectByLab(id: number, remarks?: string): Promise<ApiResponse<TankRecord>> {
    const response = await api.post<ApiResponse<TankRecord>>(`/tank-records/${id}/reject-lab`, { remarks });
    return response.data;
  },

  async approveByAdmin(id: number, remarks?: string): Promise<ApiResponse<TankRecord>> {
    const response = await api.post<ApiResponse<TankRecord>>(`/tank-records/${id}/approve-admin`, { remarks });
    return response.data;
  },

  async rejectByAdmin(id: number, remarks?: string): Promise<ApiResponse<TankRecord>> {
    const response = await api.post<ApiResponse<TankRecord>>(`/tank-records/${id}/reject-admin`, { remarks });
    return response.data;
  },

  async getStatistics(dateFrom?: string, dateTo?: string): Promise<ApiResponse<Statistics>> {
    const response = await api.get<ApiResponse<Statistics>>('/tank-records/statistics', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },

  async getDailyTrend(dateFrom?: string, dateTo?: string): Promise<ApiResponse<any[]>> {
    const response = await api.get<ApiResponse<any[]>>('/tank-records/daily-trend', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },
};
