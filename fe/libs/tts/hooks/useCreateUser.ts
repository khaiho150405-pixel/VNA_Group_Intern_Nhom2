"use client";
import { useReducer, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { authService } from "@tts/services/auth.services";
import { userService } from "@tts/services/user.services";
import { roleService } from '@tts/services/role.services';
import DoetService from "@tts/services/doet.service";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";
import useLocales from "@core/hooks/useLocales";
import { useNotification } from "@core/hooks/useNotification";

export const useCreateUser = () => {
    const router = useRouter();
    const { translate } = useLocales();
    const { success, error: notifyError } = useNotification();

    const [state, dispatch] = useReducer(accountInfoReducer, initialAccountInfoState);


    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await roleService.getAll();
                let roleList = [];
                if (Array.isArray(response)) {
                    roleList = response;
                } else {
                    roleList = response?.data?.items || response?.items || [];
                }
                dispatch({ type: 'onChange', name: 'roles', value: roleList });
            } catch (error) { console.error(error); }
        };

        const fetchProvinces = async () => {
            try {
                const res: any = await DoetService.getProvinces();
                const items = res?.data || res || [];
                if (Array.isArray(items)) {
                    const mapped = items.map((p: any) => ({ code: String(p.id), name: p.full_name || p.name }));
                    const sorted = mapped.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
                    dispatch({ type: 'onChange', name: 'provinces', value: sorted });
                }
            } catch (error) { console.error(error); }
        };

        fetchRoles();
        fetchProvinces();

        dispatch({ type: 'onChange', name: 'initialSnapshot', value: { ...initialAccountInfoState } });
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
                } catch (error) { console.error(error); }
            };
            fetchDistricts();
        } else {
            dispatch({ type: 'onChange', name: 'districts', value: [] });
        }
    }, [state.city]);

    const handleInputChange = (name: keyof AccountInfoState, value: any) => {
        if (name === 'city' && String(value) !== String(state.city)) {
            dispatch({ type: 'onChange', name: 'district', value: '' });
        }
        dispatch({ type: 'onChange', name, value });
    };

    const handleSave = async () => {
        if (!validate.required(state.username) || !validate.required(state.password) || !validate.required(state.displayName)) {
            notifyError(VALIDATION_MESSAGES.FULL_INFO_REQUIRED || 'Vui lòng nhập đầy đủ thông tin bắt buộc');
            return;
        }

        if (!validate.username(state.username)) {
            notifyError(VALIDATION_MESSAGES.USERNAME_INVALID || 'Tên đăng nhập không hợp lệ');
            return;
        }

        if (!validate.password(state.password)) {
            notifyError(VALIDATION_MESSAGES.PASSWORD_INVALID);
            return;
        }
        if (state.email && !validate.email(state.email)) {
            notifyError(VALIDATION_MESSAGES.EMAIL_INVALID || 'Email không hợp lệ');
            return;
        }

        dispatch({ type: 'setLoading', value: true });

        try {
            const selectedProvince = state.provinces.find(p => String(p.code) === String(state.city));
            const selectedDistrict = state.districts.find(d => String(d.code) === String(state.district));
            const selectedRoleObj = state.roles.find((r: any) => String(r.id) === String(state.role));
            const roleNameToSave = selectedRoleObj ? selectedRoleObj.name : '';

            const payload = {
                username: state.username,
                password: state.password,
                email: state.email,
                fullName: state.displayName,
                dateOfBirth: state.birthday ? new Date(state.birthday) : null,
                gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),
                realRole: roleNameToSave,
                role: state.role ? { id: state.role } : null,
                province: state.city ? { key: String(state.city), value: selectedProvince?.name || state.city } : null,
                district: state.district ? { key: String(state.district), value: selectedDistrict?.name || state.district } : null,
                address: state.address,
                avatar: state.avatarUrl || '',
                status: state.active
            };

            const response = await userService.create(payload);

            if (response.success || response) {
                success('Thêm người dùng thành công');
                setTimeout(() => router.push('/users'), 1000);
            }
        } catch (error: any) {
            let errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || translate("notifications.error");
            notifyError(String(errorMsg));
        } finally {
            dispatch({ type: 'setLoading', value: false });
        }
    };

    return { state, dispatch, handleInputChange, handleSave };
};