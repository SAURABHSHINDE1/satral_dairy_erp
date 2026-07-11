import api from './api';
import type { ApiResponse, PackingMilkReport, PackingMilkFormData } from '../types';

export const packingMilkReportService = {
  async getAll(filters?: {
    date?: string;
    date_from?: string;
    date_to?: string;
    product_name?: string;
    tank_no?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PackingMilkReport[]>> {
    const response = await api.get<ApiResponse<PackingMilkReport[]>>(
      '/packing-milk-reports',
      { params: filters }
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<PackingMilkReport>> {
    const response = await api.get<ApiResponse<PackingMilkReport>>(
      `/packing-milk-reports/${id}`
    );
    return response.data;
  },

  async create(data: PackingMilkFormData): Promise<ApiResponse<PackingMilkReport>> {
    const response = await api.post<ApiResponse<PackingMilkReport>>(
      '/packing-milk-reports',
      data
    );
    return response.data;
  },

  async update(
    id: number,
    data: Partial<PackingMilkFormData>
  ): Promise<ApiResponse<PackingMilkReport>> {
    const response = await api.put<ApiResponse<PackingMilkReport>>(
      `/packing-milk-reports/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(
      `/packing-milk-reports/${id}`
    );
    return response.data;
  },
};
