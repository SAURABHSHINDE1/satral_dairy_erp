import api from './api';
import type { ApiResponse, FinalProductRecord, FinalProductFormData } from '../types';

export const finalProductService = {
  async getAll(filters?: {
    date?: string;
    shift?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<FinalProductRecord[]>> {
    const response = await api.get<ApiResponse<FinalProductRecord[]>>(
      '/final-product-records',
      { params: filters }
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<FinalProductRecord>> {
    const response = await api.get<ApiResponse<FinalProductRecord>>(
      `/final-product-records/${id}`
    );
    return response.data;
  },

  async create(data: FinalProductFormData): Promise<ApiResponse<FinalProductRecord>> {
    const response = await api.post<ApiResponse<FinalProductRecord>>(
      '/final-product-records',
      data
    );
    return response.data;
  },

  async update(
    id: number,
    data: Partial<FinalProductFormData>
  ): Promise<ApiResponse<FinalProductRecord>> {
    const response = await api.put<ApiResponse<FinalProductRecord>>(
      `/final-product-records/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(
      `/final-product-records/${id}`
    );
    return response.data;
  },

  async approve(
    id: number,
    action: 'approved' | 'rejected',
    comment?: string
  ): Promise<ApiResponse<FinalProductRecord>> {
    const response = await api.post<ApiResponse<FinalProductRecord>>(
      `/final-product-records/${id}/approve`,
      { action, comment }
    );
    return response.data;
  },
};
