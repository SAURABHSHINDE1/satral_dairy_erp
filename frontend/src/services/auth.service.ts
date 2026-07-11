import api from './api';
import type { ApiResponse, AuthResponse, LoginCredentials, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
