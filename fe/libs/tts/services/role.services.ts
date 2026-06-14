import axiosClient from '@core/services/axiosClient';

export const roleService = {
    getAll: async () => {
        const response = await axiosClient.get('/roles');
        return response.data || response;
    }
};