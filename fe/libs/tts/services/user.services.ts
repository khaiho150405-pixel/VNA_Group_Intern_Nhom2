import axiosClient from '@core/services/axiosClient';

export const userService = {
    getUsers: async (pageNumber: number = 0, pageSize: number = 10): Promise<{ items: any[], count: number }> => {
        const response = await axiosClient.get('/users', {
            params: { pageNumber, pageSize, relation: '["role"]' }
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
    import: async (data: any[]) => {
        const response = await axiosClient.post('/users/import', data);
        return response.data || response;
    },

};