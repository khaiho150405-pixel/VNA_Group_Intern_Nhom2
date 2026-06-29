import axiosClient from '@core/services/axiosClient';

export const injuryFactorService = {
  getAll: async (params?: any) => {
    return await axiosClient.get('/injury-factors', { params });
  },
  getActiveDropdown: async () => {
    return await axiosClient.get('/injury-factors/dropdown/active');
  },
  checkCode: async (code: string, id?: number | string) => {
    return await axiosClient.get('/injury-factors/check-code', { params: { code, id } });
  },
  getById: async (id: number | string) => {
    return await axiosClient.get(`/injury-factors/${id}`);
  },
  create: async (data: any) => {
    return await axiosClient.post('/injury-factors', data);
  },
  update: async (id: number | string, data: any) => {
    return await axiosClient.put(`/injury-factors/${id}`, data);
  },
  delete: async (id: number | string) => {
    return await axiosClient.delete(`/injury-factors/${id}`);
  },
  deleteMany: async (ids: number[]) => {
    return await axiosClient.delete('/injury-factors/destroys', { data: { ids } });
  }
};
