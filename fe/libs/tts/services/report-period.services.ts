import axiosClient from '@core/services/axiosClient';

export const reportPeriodService = {
  getAll: async (params?: any) => {
    return await axiosClient.get('/report-periods', { params });
  },
  getForEnterprise: async (params?: any) => {
    return await axiosClient.get('/report-periods/for-enterprise', { params });
  },
  getById: async (id: number | string) => {
    return await axiosClient.get(`/report-periods/${id}`);
  },
  create: async (data: any) => {
    return await axiosClient.post('/report-periods', data);
  },
  update: async (id: number | string, data: any) => {
    return await axiosClient.put(`/report-periods/${id}`, data);
  },
  delete: async (id: number | string) => {
    return await axiosClient.delete(`/report-periods/${id}`);
  }
};
