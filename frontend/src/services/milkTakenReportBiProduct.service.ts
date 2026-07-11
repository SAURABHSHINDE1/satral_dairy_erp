import api from './api';
import type { ApiResponse, MilkTakenReportBiProduct, MilkTakenReportBiProductFormData } from '../types';

export const milkTakenReportBiProductService = {
  async getAll(filters?: {
    date?: string;
    date_from?: string;
    date_to?: string;
    product_name?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<MilkTakenReportBiProduct[]>> {
    const response = await api.get<ApiResponse<MilkTakenReportBiProduct[]>>(
      '/milk-taken-reports-bi-product',
      { params: filters }
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<MilkTakenReportBiProduct>> {
    const response = await api.get<ApiResponse<MilkTakenReportBiProduct>>(
      `/milk-taken-reports-bi-product/${id}`
    );
    return response.data;
  },

  async create(data: MilkTakenReportBiProductFormData): Promise<ApiResponse<MilkTakenReportBiProduct>> {
    const response = await api.post<ApiResponse<MilkTakenReportBiProduct>>(
      '/milk-taken-reports-bi-product',
      data
    );
    return response.data;
  },

  async update(
    id: number,
    data: Partial<MilkTakenReportBiProductFormData>
  ): Promise<ApiResponse<MilkTakenReportBiProduct>> {
    const response = await api.put<ApiResponse<MilkTakenReportBiProduct>>(
      `/milk-taken-reports-bi-product/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(
      `/milk-taken-reports-bi-product/${id}`
    );
    return response.data;
  },
};
