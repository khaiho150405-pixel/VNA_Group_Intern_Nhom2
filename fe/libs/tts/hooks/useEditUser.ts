"use client";
import { useState, useEffect, useReducer } from "react";
import { useRouter, useParams } from "next/navigation";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";
import { userService } from "@tts/services/user.services";
import { roleService } from "@tts/services/role.services";
import useLocales from "@core/hooks/useLocales";

export const useEditUser = () => {
    const router = useRouter();
    const params = useParams();
    const userId = params?.id as string;
    const { translate } = useLocales();

    const [state, dispatch] = useReducer(accountInfoReducer, initialAccountInfoState);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const data = await userService.getProvinces();
                if (data && Array.isArray(data.data)) {
                    const mapped = data.data.map((p: any) => ({ code: String(p.id), name: p.full_name }));
                    const sorted = mapped.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
                    dispatch({ type: 'onChange', name: 'provinces', value: sorted });
                }
            } catch (error) { console.error("Lỗi khi tải tỉnh thành:", error); }
        };
        fetchProvinces();
    }, []);

    useEffect(() => {
        if (state.city) {
            const fetchDistricts = async () => {
                try {
                    const data = await userService.getDistricts(String(state.city));
                    if (data && Array.isArray(data.data)) {
                        const mapped = data.data.map((d: any) => ({ code: String(d.id), name: d.full_name }));
                        const sorted = mapped.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
                        dispatch({ type: 'onChange', name: 'districts', value: sorted });
                    }
                } catch (error) { console.error("Lỗi khi tải quận huyện:", error); }
            };
            fetchDistricts();
        } else {
            dispatch({ type: 'onChange', name: 'districts', value: [] });
        }
    }, [state.city]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!userId) return;
            dispatch({ type: 'setLoading', value: true });

            try {
                const [rolesRes, userRes] = await Promise.all([
                    roleService.getAll(),
                    userService.getById(userId)
                ]);
                let roleList = [];
                if (Array.isArray(rolesRes)) {
                    roleList = rolesRes;
                } else {
                    roleList = rolesRes?.data?.items || rolesRes?.items || [];
                }

                const userData = userRes.data || userRes;
                const matchedRole = roleList.find((r: any) => r.name === userData.realRole);
                const currentRoleId = matchedRole ? matchedRole.id : '';

                let genderStr = '';
                if (userData.gender === 1) genderStr = 'Nam';
                else if (userData.gender === 0 || userData.gender === null) genderStr = 'Nữ';
                dispatch({
                    type: 'setInitialData',
                    data: {
                        roles: roleList,
                        username: userData.username || '',
                        displayName: userData.fullName || '',
                        email: userData.email || '',
                        birthday: userData.dateOfBirth || '',
                        gender: genderStr || '',
                        role: currentRoleId || '',
                        city: userData.province?.key || '',
                        district: userData.district?.key || '',
                        address: userData.address || '',
                        active: userData.status === false || userData.status === null || userData.status === undefined,
                        avatarUrl: userData.avatar || '',
                        title: userData.workUnit || ''
                    }
                });

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
                dispatch({ type: 'showToast', message: 'Không thể tải dữ liệu người dùng', toastType: 'error' });
            } finally {
                dispatch({ type: 'setLoading', value: false });
            }
        };

        fetchInitialData();
    }, [userId]);

    const handleInputChange = (name: keyof AccountInfoState, value: any) => {
        dispatch({ type: "onChange", name, value });
    };

    const handleSave = async () => {
        if (!validate.required(state.displayName)) {
            dispatch({
                type: 'showToast',
                message: 'Họ và tên không được để trống',
                toastType: 'error'
            });
            return;
        }

        if (state.email && !validate.email(state.email)) {
            dispatch({
                type: 'showToast',
                message: 'Email không hợp lệ',
                toastType: 'error'
            });
            return;
        }

        dispatch({ type: 'setLoading', value: true });

        try {
            const selectedProvince = state.provinces?.find((p: any) => String(p.code) === String(state.city));
            const selectedDistrict = state.districts?.find((d: any) => String(d.code) === String(state.district));

            const selectedRoleObj = state.roles?.find((r: any) => String(r.id) === String(state.role));
            const roleNameToSave = selectedRoleObj ? selectedRoleObj.name : '';

            const payload = {
                fullName: state.displayName,
                email: state.email ? state.email.trim() : null,
                dateOfBirth: state.birthday ? new Date(state.birthday) : null,
                gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),

                realRole: roleNameToSave,
                roleId: selectedRoleObj ? Number(selectedRoleObj.id) : null,

                province: state.city ? { key: String(state.city), value: selectedProvince?.name || state.city } : null,
                district: state.district ? { key: String(state.district), value: selectedDistrict?.name || state.district } : null,
                address: state.address || null,
                avatar: state.avatarUrl || null,
                workUnit: state.title,
                status: state.active ? false : true
            };


            const response = await userService.update(userId, payload);

            if (response.success || response) {
                dispatch({ type: 'showToast', message: 'Cập nhật thông tin thành công!', toastType: 'success' });

                // Đợi 1 giây để người dùng đọc thông báo rồi đẩy về trang danh sách
                setTimeout(() => router.push('/users'), 1000);
            }
        } catch (error: any) {
            // Bắt lỗi từ Backend trả về
            const errorMsg = error.response?.data?.message || error.response?.data?.errors || "Có lỗi xảy ra khi lưu dữ liệu";
            dispatch({ type: 'showToast', message: String(errorMsg), toastType: 'error' });
        } finally {
            dispatch({ type: 'setLoading', value: false });
        }
    };

    return {
        state,
        dispatch,
        handleInputChange,
        handleSave
    };
};