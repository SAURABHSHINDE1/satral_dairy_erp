import api from './api';
import type { ApiResponse } from '../types';

export const searchService = {
  async globalSearch(query: string): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/search', {
      params: { q: query },
    });
    return response.data;
  },
};
