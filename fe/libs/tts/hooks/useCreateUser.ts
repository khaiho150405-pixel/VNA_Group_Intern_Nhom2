"use client";
import { useReducer, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { authService, userService, roleService, DoetService } from "@tts/services";
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
                roleList = roleList.filter((r: any) => 
                    r.role !== 'enterprise' && 
                    r.type !== 'DN' && 
                    r.id !== 5 && 
                    r.name !== 'Doanh nghiệp'
                );
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

        if (!state.role) {
            dispatch({
                type: 'showToast',
                message: 'Vui lòng chọn vai trò',
                toastType: 'error'
            });
            return;
        }

        if (!validate.username(state.username)) {
            notifyError(VALIDATION_MESSAGES.USERNAME_INVALID || 'Tên đăng nhập không hợp lệ');
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
                roleId: selectedRoleObj ? Number(selectedRoleObj.id) : null,
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
            const data = error.response?.data;
            let errorMsg = translate("notifications.error") || "Có lỗi xảy ra khi lưu dữ liệu";
            if (data) {
                if (typeof data.errors === 'string') {
                    errorMsg = data.errors;
                } else if (data.errors && typeof data.errors === 'object') {
                    if (typeof data.errors.message === 'string') {
                        errorMsg = data.errors.message;
                    } else if (Array.isArray(data.errors.message)) {
                        errorMsg = data.errors.message.join(', ');
                    } else if (typeof data.errors.error === 'string') {
                        errorMsg = data.errors.error;
                    } else {
                        errorMsg = data.message || JSON.stringify(data.errors);
                    }
                } else {
                    errorMsg = data.message || error.message || errorMsg;
                }
            } else {
                errorMsg = error.message || errorMsg;
            }
            notifyError(String(errorMsg));
        } finally {
            dispatch({ type: 'setLoading', value: false });
        }
    };

    return { state, dispatch, handleInputChange, handleSave };
};