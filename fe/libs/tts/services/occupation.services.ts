import axiosClient from '@core/services/axiosClient';

export const occupationService = {
  getAll: async (params?: any) => {
    return await axiosClient.get('/occupation', { params });
  },
  getById: async (id: number | string) => {
    return await axiosClient.get(`/occupation/${id}`);
  },
  create: async (data: any) => {
    return await axiosClient.post('/occupation', data);
  },
  update: async (id: number | string, data: any) => {
    return await axiosClient.put(`/occupation/${id}`, data);
  },
  delete: async (id: number | string) => {
    return await axiosClient.delete(`/occupation/${id}`);
  },
  deleteMany: async (ids: number[]) => {
    return await axiosClient.delete('/occupation/destroys', { data: { ids } });
  }
};
