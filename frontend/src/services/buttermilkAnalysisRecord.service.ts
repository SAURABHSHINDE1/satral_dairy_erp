import api from './api';
import type { PaginatedApiResponse, ButtermilkAnalysisRecord, ButtermilkAnalysisFormData } from '../types';

export const buttermilkAnalysisRecordService = {
  async getAll(filters?: {
    date?: string;
    shift?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedApiResponse<ButtermilkAnalysisRecord>> {
    const response = await api.get<PaginatedApiResponse<ButtermilkAnalysisRecord>>(
      '/buttermilk-analysis-records',
      { params: filters }
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<ButtermilkAnalysisRecord>> {
    const response = await api.get<ApiResponse<ButtermilkAnalysisRecord>>(
      `/buttermilk-analysis-records/${id}`
    );
    return response.data;
  },

  async create(data: ButtermilkAnalysisFormData): Promise<ApiResponse<ButtermilkAnalysisRecord>> {
    const response = await api.post<ApiResponse<ButtermilkAnalysisRecord>>(
      '/buttermilk-analysis-records',
      data
    );
    return response.data;
  },

  async update(
    id: number,
    data: Partial<ButtermilkAnalysisFormData>
  ): Promise<ApiResponse<ButtermilkAnalysisRecord>> {
    const response = await api.put<ApiResponse<ButtermilkAnalysisRecord>>(
      `/buttermilk-analysis-records/${id}`,
      data
    );
    return response.data;
  },
};
