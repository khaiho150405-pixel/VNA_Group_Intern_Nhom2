import { useState, useEffect } from 'react';
import { UserModel } from '@shared/tts/models/user.model';
import { userService } from '@/libs/tts/services/user.services';

export const useUsers = () => {
    const [totalCount, setTotalCount] = useState(0);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await userService.getUsers();
            setUsers(data.items || []);
            setTotalCount(data.count || 0);
        } catch (err: any) {
            setError(err.message || 'Đã có lỗi xảy ra khi lấy dữ liệu');
        } finally {
            setIsLoading(false);
        }
    };


    // Tự động gọi API ngay khi vào trang
    useEffect(() => {
        fetchUsers();
    }, []);

    return { users, isLoading, error, refetch: fetchUsers };
};