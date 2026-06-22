import axiosClient from '@core/services/axiosClient';

export const periodicReportService = {
  getSummary: async (params: any) => {
    return await axiosClient.get('/periodic-reports/summary', { params });
  },
  getAll: async (params: any) => {
    return await axiosClient.get('/periodic-reports', { params });
  },
  getById: async (id: number | string) => {
    return await axiosClient.get(`/periodic-reports/${id}`);
  },
  create: async (data: any) => {
    return await axiosClient.post('/periodic-reports', data);
  },
  update: async (id: number | string, data: any) => {
    return await axiosClient.put(`/periodic-reports/${id}`, data);
  },
  delete: async (id: number | string) => {
    return await axiosClient.delete(`/periodic-reports/${id}`);
  }
};
