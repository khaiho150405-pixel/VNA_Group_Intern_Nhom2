import axiosClient from '@core/services/axiosClient';

export const roleService = {
    getAll: async () => {
        const response = await axiosClient.get('/roles', {
            params: {
                pageSize: 1000
            }
        });
        return response.data || response;
    },
    getRoles: async (params: any = {}): Promise<{ items: any[], count: number }> => {
        const response = await axiosClient.get('/roles', {
            params: {
                pageNumber: params.page ? params.page - 1 : 0,
                pageSize: params.limit || 10,
                ...params
            }
        });
        return response.data || response;
    },
    getById: async (id: string | number) => {
        const response = await axiosClient.get(`/roles/${id}`);
        return response.data || response;
    },
    update: async (id: string | number, data: any) => {
        const response = await axiosClient.put(`/roles/${id}`, data);
        return response.data || response;
    },
    create: async (data: any) => {
        const response = await axiosClient.post('/roles', data);
        return response.data || response;
    },
    delete: async (id: string | number) => {
        const response = await axiosClient.delete(`/roles/${id}`);
        return response.data || response;
    },
    deleteMany: async (ids: Array<string | number>) => {
        const response = await axiosClient.delete('/roles/deletes', { data: { ids } });
        return response.data || response;
    }
};