import api from './api';
import type { ApiResponse, BiProductReport, BiProductFormData } from '../types';

export const biProductService = {
  async getAll(filters?: {
    date?: string;
    date_from?: string;
    date_to?: string;
    product_name?: string;
    batch_no?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<BiProductReport[]>> {
    const response = await api.get<ApiResponse<BiProductReport[]>>(
      '/bi-product-reports',
      { params: filters }
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<BiProductReport>> {
    const response = await api.get<ApiResponse<BiProductReport>>(
      `/bi-product-reports/${id}`
    );
    return response.data;
  },

  async create(data: BiProductFormData): Promise<ApiResponse<BiProductReport>> {
    const response = await api.post<ApiResponse<BiProductReport>>(
      '/bi-product-reports',
      data
    );
    return response.data;
  },

  async update(
    id: number,
    data: Partial<BiProductFormData>
  ): Promise<ApiResponse<BiProductReport>> {
    const response = await api.put<ApiResponse<BiProductReport>>(
      `/bi-product-reports/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(
      `/bi-product-reports/${id}`
    );
    return response.data;
  },

  async approve(
    id: number,
    action: 'approved' | 'rejected',
    comment?: string
  ): Promise<ApiResponse<BiProductReport>> {
    const response = await api.post<ApiResponse<BiProductReport>>(
      `/bi-product-reports/${id}/approve`,
      { action, comment }
    );
    return response.data;
  },
};
