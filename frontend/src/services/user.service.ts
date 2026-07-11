import api from './api';
import type { ApiResponse, User } from '../types';

export const userService = {
  async getAll(filters?: {
    role?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<User[]>> {
    const response = await api.get<ApiResponse<User[]>>('/users', { params: filters });
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  async create(data: {
    username: string;
    password: string;
    email?: string;
    full_name: string;
    role: 'admin' | 'lab_incharge' | 'quality_incharge' | 'operator' | 'qc_manager';
  }): Promise<ApiResponse<User>> {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  async update(
    id: number,
    data: {
      username?: string;
      password?: string;
      email?: string;
      full_name?: string;
      role?: 'admin' | 'lab_incharge' | 'quality_incharge' | 'operator' | 'qc_manager';
      is_active?: boolean;
    }
  ): Promise<ApiResponse<User>> {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  },

  async getStatistics(): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/users/statistics');
    return response.data;
  },
};
