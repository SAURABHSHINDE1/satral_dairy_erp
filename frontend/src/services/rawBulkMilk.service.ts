import api from './api';
import type { ApiResponse, RawBulkMilkRecord, RawBulkMilkFormData } from '../types';

export const rawBulkMilkService = {
  async getAll(filters?: {
    date?: string;
    date_from?: string;
    date_to?: string;
    sample_name?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<RawBulkMilkRecord[]>> {
    const response = await api.get<ApiResponse<RawBulkMilkRecord[]>>(
      '/raw-bulk-milk-records',
      { params: filters }
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<RawBulkMilkRecord>> {
    const response = await api.get<ApiResponse<RawBulkMilkRecord>>(
      `/raw-bulk-milk-records/${id}`
    );
    return response.data;
  },

  async create(data: RawBulkMilkFormData): Promise<ApiResponse<RawBulkMilkRecord>> {
    const response = await api.post<ApiResponse<RawBulkMilkRecord>>(
      '/raw-bulk-milk-records',
      data
    );
    return response.data;
  },

  async update(
    id: number,
    data: Partial<RawBulkMilkFormData>
  ): Promise<ApiResponse<RawBulkMilkRecord>> {
    const response = await api.put<ApiResponse<RawBulkMilkRecord>>(
      `/raw-bulk-milk-records/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(
      `/raw-bulk-milk-records/${id}`
    );
    return response.data;
  },

  async approve(
    id: number,
    action: 'approved' | 'rejected',
    comment?: string
  ): Promise<ApiResponse<RawBulkMilkRecord>> {
    const response = await api.post<ApiResponse<RawBulkMilkRecord>>(
      `/raw-bulk-milk-records/${id}/approve`,
      { action, comment }
    );
    return response.data;
  },
};
