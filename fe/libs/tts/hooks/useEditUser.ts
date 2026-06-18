"use client";
import { useState, useEffect, useReducer } from "react";
import { useRouter, useParams } from "next/navigation";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";
import { userService } from "@tts/services/user.services";
import { roleService } from "@tts/services/role.services";
import DoetService from "@tts/services/doet.service";
import useLocales from "@core/hooks/useLocales";
import { useAuth } from "@core/contexts/AuthProvider";
import { getCookie } from "@core/services/cookies";
import { useNotification } from "@core/hooks/useNotification";

export const useEditUser = () => {
    const router = useRouter();
    const params = useParams();
    const userId = params?.id as string;
    const { translate } = useLocales();
    const { user, login } = useAuth();
    const { success, error: notifyError } = useNotification();

    const [state, dispatch] = useReducer(accountInfoReducer, initialAccountInfoState);

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res: any = await DoetService.getProvinces();
                const items = res?.data || res || [];
                if (Array.isArray(items)) {
                    const mapped = items.map((p: any) => ({ code: String(p.id), name: p.full_name || p.name }));
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
                    const res: any = await DoetService.getDistricts(state.city);
                    const items = res?.data || res || [];
                    if (Array.isArray(items)) {
                        const mapped = items.map((d: any) => ({ code: String(d.id), name: d.full_name || d.name }));
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
                        active: userData.status === true,
                        avatarUrl: userData.avatar || '',
                        title: userData.workUnit || ''
                    }
                });

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
                notifyError('Không thể tải dữ liệu người dùng');
            } finally {
                dispatch({ type: 'setLoading', value: false });
            }
        };

        fetchInitialData();
    }, [userId]);

    const handleInputChange = (name: keyof AccountInfoState, value: any) => {
        if (name === 'city' && String(value) !== String(state.city)) {
            dispatch({ type: 'onChange', name: 'district', value: '' });
        }
        dispatch({ type: "onChange", name, value });
    };

    const handleSave = async () => {
        if (!validate.required(state.displayName)) {
            notifyError('Họ và tên không được để trống');
            return;
        }

        if (state.email && !validate.email(state.email)) {
            notifyError('Email không hợp lệ');
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
                status: state.active
            };


            const response = await userService.update(userId, payload);

            if (response.success || response) {
                // Synchronize with AuthProvider if the edited user is the current user
                if (user && String(user.id) === String(userId)) {
                    const updatedUser = {
                        ...user,
                        fullName: state.displayName,
                        email: state.email || user.email,
                        gender: payload.gender,
                        realRole: roleNameToSave,
                        roleId: payload.roleId || (user as any).roleId,
                        province: payload.province,
                        district: payload.district,
                        address: state.address,
                        avatar: state.avatarUrl || '',
                        workUnit: state.title,
                        status: state.active
                    };
                    const token = getCookie('accessToken') || '';
                    login(updatedUser as any, token, false);
                }

                success('Cập nhật thông tin thành công!');

                // Đợi 1 giây để người dùng đọc thông báo rồi đẩy về trang danh sách
                setTimeout(() => router.push('/users'), 1000);
            }
        } catch (error: any) {
            // Bắt lỗi từ Backend trả về
            const errorMsg = error.response?.data?.message || error.response?.data?.errors || "Có lỗi xảy ra khi lưu dữ liệu";
            notifyError(String(errorMsg));
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