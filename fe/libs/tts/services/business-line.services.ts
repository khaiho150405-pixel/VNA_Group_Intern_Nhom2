import axiosClient from '@core/services/axiosClient';

export const businessLineService = {
  getAll: async (params?: any) => {
    return await axiosClient.get('/business-line', { params });
  },
  getById: async (id: number | string) => {
    return await axiosClient.get(`/business-line/${id}`);
  },
  create: async (data: any) => {
    return await axiosClient.post('/business-line', data);
  },
  update: async (id: number | string, data: any) => {
    return await axiosClient.put(`/business-line/${id}`, data);
  },
  delete: async (id: number | string) => {
    return await axiosClient.delete(`/business-line/${id}`);
  },
  deleteMany: async (ids: number[]) => {
    return await axiosClient.delete('/business-line/destroys', { data: { ids } });
  }
};
