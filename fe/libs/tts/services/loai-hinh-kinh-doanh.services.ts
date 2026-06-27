import axiosClient from '@core/services/axiosClient';

export const loaiHinhKinhDoanhService = {
  getAll: async (params?: any) => {
    return await axiosClient.get('/loai-hinh-kinh-doanh', { params });
  },
  getById: async (id: number | string) => {
    return await axiosClient.get(`/loai-hinh-kinh-doanh/${id}`);
  },
  create: async (data: any) => {
    return await axiosClient.post('/loai-hinh-kinh-doanh', data);
  },
  update: async (id: number | string, data: any) => {
    return await axiosClient.put(`/loai-hinh-kinh-doanh/${id}`, data);
  },
  delete: async (id: number | string) => {
    return await axiosClient.delete(`/loai-hinh-kinh-doanh/${id}`);
  },
  deleteMany: async (ids: number[]) => {
    return await axiosClient.delete('/loai-hinh-kinh-doanh/destroys', { data: { ids } });
  }
};
