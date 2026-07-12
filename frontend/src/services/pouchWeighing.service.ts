import api from './api';
import type {
  ApiResponse,
  PouchWeighingSession,
  PouchWeighingSessionFormData,
} from '../types';

export const pouchWeighingService = {
  async getByDate(date: string): Promise<ApiResponse<PouchWeighingSession[]>> {
    const response = await api.get<ApiResponse<PouchWeighingSession[]>>(
      '/pouch-weighing-sessions',
      { params: { date } }
    );
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.get<ApiResponse<PouchWeighingSession>>(
      `/pouch-weighing-sessions/${id}`
    );
    return response.data;
  },

  async create(
    data: PouchWeighingSessionFormData
  ): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.post<ApiResponse<PouchWeighingSession>>(
      '/pouch-weighing-sessions',
      data
    );
    return response.data;
  },

  async update(
    id: number,
    data: PouchWeighingSessionFormData
  ): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.put<ApiResponse<PouchWeighingSession>>(
      `/pouch-weighing-sessions/${id}`,
      data
    );
    return response.data;
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(
      `/pouch-weighing-sessions/${id}`
    );
    return response.data;
  },

  async submit(id: number): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.put<ApiResponse<PouchWeighingSession>>(`/pouch-weighing-sessions/${id}/submit`);
    return response.data;
  },

  async approveByLab(id: number): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.post<ApiResponse<PouchWeighingSession>>(`/pouch-weighing-sessions/${id}/approve-lab`);
    return response.data;
  },

  async rejectByLab(id: number): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.post<ApiResponse<PouchWeighingSession>>(`/pouch-weighing-sessions/${id}/reject-lab`);
    return response.data;
  },

  async approveByAdmin(id: number): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.post<ApiResponse<PouchWeighingSession>>(`/pouch-weighing-sessions/${id}/approve-admin`);
    return response.data;
  },

  async rejectByAdmin(id: number): Promise<ApiResponse<PouchWeighingSession>> {
    const response = await api.post<ApiResponse<PouchWeighingSession>>(`/pouch-weighing-sessions/${id}/reject-admin`);
    return response.data;
  },
};
