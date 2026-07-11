import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    console.log('[API Request] URL:', config.url, 'Token Present:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.log('[API Response Error] Status:', error.response?.status, 'URL:', originalRequest?.url);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        console.log('[API Interceptor] 401 encountered. Refresh token present:', !!refreshToken);
        if (refreshToken) {
          console.log('[API Interceptor] Attempting token refresh...');
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          const user = useAuthStore.getState().user;
          if (user) {
            useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);
          }
          console.log('[API Interceptor] Token refreshed successfully');

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          console.log('[API Interceptor] No refresh token found. Clearing auth and redirecting to /login...');
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('[API Interceptor] Token refresh failed:', refreshError);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
