import axiosClient from '@core/services/axiosClient';

export const permissionService = {
    getAll: async () => {
        const response = await axiosClient.get('/permissions', {
            params: {
                pageSize: 1000
            }
        });
        return response.data || response;
    },
    getPermissions: async (params: any = {}): Promise<{ items: any[], count: number }> => {
        const response = await axiosClient.get('/permissions', {
            params: {
                pageNumber: params.page ? params.page - 1 : 0,
                pageSize: params.limit || 100, // Load all by default as they are hierarchy configurations
                ...params
            }
        });
        return response.data || response;
    }
};
