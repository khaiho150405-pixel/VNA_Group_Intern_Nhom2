import axiosClient from '@core/services/axiosClient';
import { Doet, DoetFilters } from '@shared/tts/models';
import { locationService } from './location.services';

const DoetService = {
  getList: (filters: DoetFilters) => {
    return axiosClient.get('/doets', { params: filters });
  },

  getById: (id: number) => {
    return axiosClient.get(`/doets/${id}`);
  },

  create: (data: Partial<Doet>) => {
    return axiosClient.post('/doets', data);
  },

  publicRegister: (data: Partial<Doet>) => {
    return axiosClient.post('/public/doets/register', data);
  },

  update: (id: number, data: Partial<Doet>) => {
    return axiosClient.put(`/doets/${id}`, data);
  },

  getMyCompany: () => {
    return axiosClient.get('/doets/my-company');
  },

  updateMyCompany: (data: Partial<Doet>) => {
    return axiosClient.post('/doets/my-company', data);
  },

  delete: (id: number) => {
    return axiosClient.delete(`/doets/destroy/${id}`);
  },

  deleteMany: (ids: number[]) => {
    return axiosClient.delete('/doets/destroys', { data: { ids } });
  },

  getDistinctWards: () => {
    return axiosClient.get('/doets/wards/distinct');
  },

  checkEmail: (email: string, id?: number) => {
    if (id !== undefined) return axiosClient.get('/doets/check-email', { params: { email, id } });
    return axiosClient.get('/public/doets/check-email', { params: { email } });
  },

  checkTaxCode: (taxCode: string, id?: number) => {
    if (id !== undefined) return axiosClient.get('/doets/check-tax-code', { params: { taxCode, id } });
    return axiosClient.get('/public/doets/check-tax-code', { params: { taxCode } });
  },

  checkName: (name: string, id?: number) => {
    if (id !== undefined) return axiosClient.get('/doets/check-name', { params: { name, id } });
    return axiosClient.get('/public/doets/check-name', { params: { name } });
  },

  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/doets/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  adminResetPassword: (id: number, newPassword: string) => {
    return axiosClient.post(`/doets/${id}/admin-reset-password`, { newPassword });
  },

  // Helpers for dropdowns
  getLoaiHinhKinhDoanh: (isPublic = false) => {
    const url = isPublic ? '/public/loai-hinh-kinh-doanh/dropdown/active' : '/loai-hinh-kinh-doanh/dropdown/active';
    return axiosClient.get(url);
  },

  getBusinessLines: (isPublic = false) => {
    const url = isPublic ? '/public/business-line/dropdown/active' : '/business-line/dropdown/active';
    return axiosClient.get(url);
  },

  // Address API from esgoo delegated to locationService
  getProvinces: locationService.getProvinces,

  getDistricts: locationService.getDistricts,

  getWards: locationService.getWards

};

export default DoetService;
