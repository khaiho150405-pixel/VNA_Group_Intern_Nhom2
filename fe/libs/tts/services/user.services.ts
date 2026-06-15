import axiosClient from '@core/services/axiosClient';

export const userService = {
    getUsers: async (params: any = {}): Promise<{ items: any[], count: number }> => {
        const response = await axiosClient.get('/users', {
            params: {
                pageNumber: params.page ? params.page - 1 : 0,
                pageSize: params.limit || 10,
                relation: '["role"]',
                ...params
            }
        });
        return response.data || response;
    },
    getById: async (id: string) => {
        const response = await axiosClient.get(`/users/${id}`);
        return response.data || response;
    },
    update: async (id: string, data: any) => {
        const response = await axiosClient.put(`/users/${id}`, data);
        return response.data || response;
    },
    create: async (data: any) => {
        const response = await axiosClient.post('/users', data);
        return response.data || response;
    },
    delete: async (id: string) => {
        const response = await axiosClient.delete(`/users/${id}`);
        return response.data || response;
    },
    deleteMany: async (ids: string[]) => {
        const response = await axiosClient.delete('/users/destroys', { data: { ids } });
        return response.data || response;
    },
    import: async (data: any[]) => {
        const response = await axiosClient.post('/users/import', data);
        return response.data || response;
    },

};