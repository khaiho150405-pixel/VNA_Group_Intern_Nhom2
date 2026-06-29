import axiosClient from '@core/services/axiosClient';

export const injuryTypeService = {
  getAll: async (params?: any) => {
    return await axiosClient.get('/injury-types', { params });
  },
  getActiveDropdown: async () => {
    return await axiosClient.get('/injury-types/dropdown/active');
  },
  checkCode: async (code: string, id?: number | string) => {
    return await axiosClient.get('/injury-types/check-code', { params: { code, id } });
  },
  getById: async (id: number | string) => {
    return await axiosClient.get(`/injury-types/${id}`);
  },
  create: async (data: any) => {
    return await axiosClient.post('/injury-types', data);
  },
  update: async (id: number | string, data: any) => {
    return await axiosClient.put(`/injury-types/${id}`, data);
  },
  delete: async (id: number | string) => {
    return await axiosClient.delete(`/injury-types/${id}`);
  },
  deleteMany: async (ids: number[]) => {
    return await axiosClient.delete('/injury-types/destroys', { data: { ids } });
  }
};
