"use client";
import { useReducer, useEffect, useMemo } from "react";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { useAuth } from "@core/contexts/AuthProvider";
import { authService } from "@tts/services/auth.services";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";
import useLocales from "@core/hooks/useLocales";
import { getCookie } from '@core/services/cookies';

export const useAccountInfo = () => {
  const { user, login } = useAuth();
  const { translate } = useLocales();
  const [state, dispatch] = useReducer(accountInfoReducer, initialAccountInfoState);

  useEffect(() => {
    // Fetch dynamic roles
    const fetchRoles = async () => {
      try {
        const roles = await authService.getRoles();
        if (Array.isArray(roles)) {
          dispatch({ type: 'onChange', name: 'roles', value: roles });
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    // Fetch provinces
    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://esgoo.net/api-tinhthanh-new/1/0.htm');
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          const mapped = data.data.map((p: any) => ({
            code: String(p.id),
            name: p.full_name
          }));
          const sorted = mapped.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
          dispatch({ type: 'onChange', name: 'provinces', value: sorted });
        }
      } catch (error) {
        console.error('Failed to fetch provinces:', error);
      }
    };

    fetchRoles();
    fetchProvinces();
  }, []);

  // Fetch districts based on selected province code
  useEffect(() => {
    if (state.city) {
      const fetchDistricts = async () => {
        try {
          const res = await fetch(`https://esgoo.net/api-tinhthanh-new/2/${state.city}.htm`);
          const data = await res.json();
          if (data && Array.isArray(data.data)) {
            const mapped = data.data.map((d: any) => ({
              code: String(d.id),
              name: d.full_name
            }));
            const sorted = mapped.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
            dispatch({ type: 'onChange', name: 'districts', value: sorted });
          }
        } catch (error) {
          console.error('Failed to fetch districts:', error);
        }
      };
      fetchDistricts();
    } else {
      dispatch({ type: 'onChange', name: 'districts', value: [] });
    }
  }, [state.city]);

  useEffect(() => {
    if (user) {
      const roleObj = typeof (user as any).role === 'object' && (user as any).role !== null ? (user as any).role : null;
      const userRoleId = (user as any).roleId || roleObj?.id;
      let userRoleKey = userRoleId === 4 ? 'superAdmin'
        : userRoleId === 3 ? 'leader'
          : userRoleId === 2 ? 'expert'
            : userRoleId === 1 ? 'employee'
              : (user as any).realRole || roleObj?.role || (typeof (user as any).role === 'string' ? (user as any).role : '');

      if (userRoleKey === 'Admin' || userRoleKey === 'ROLE_ADMIN') {
        userRoleKey = 'superAdmin';
      } else if (userRoleKey === 'User' || userRoleKey === 'ROLE_USER') {
        userRoleKey = 'employee';
      }

      let formattedBirthday = '';
      const rawBirthday = (user as any).dateOfBirth || (user as any).birthday;
      if (rawBirthday) {
        const date = new Date(rawBirthday);
        if (!isNaN(date.getTime())) {
          formattedBirthday = date.toISOString().split('T')[0];
        }
      }

      let initialCity = (user as any).province?.key || (user as any).province || '';
      let initialDistrict = (user as any).district?.key || (user as any).district || '';

      // Backward compatibility for hardcoded legacy data
      if (initialCity === 'HCM') {
        initialCity = '79'; // HCMC code
      }
      if (initialDistrict === 'GV') {
        initialDistrict = '764'; // Go Vap district code
      }

      dispatch({
        type: 'setInitialData',
        data: {
          username: user.username || '',
          displayName: (user as any).fullName || user.fullName || user.displayName || '',
          email: user.email || '',
          avatarUrl: user.avatar || '',
          birthday: formattedBirthday,
          gender: (user as any).gender === 1 ? 'Nam' : ((user as any).gender === 0 ? 'Nữ' : ''),
          address: (user as any).address || '',
          city: initialCity,
          district: initialDistrict,
          role: userRoleKey,
          title: (user as any).workUnit || '',
          active: (user as any).status === false || (user as any).status === null || (user as any).status === undefined,
        }
      });
    }
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.toast.show) {
      timer = setTimeout(() => {
        dispatch({ type: 'hideToast' });
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [state.toast.show]);

  // Compute whether the form has unsaved changes
  const hasChanges = useMemo(() => {
    if (!state.initialSnapshot) return false;
    const editableKeys = ['displayName', 'birthday', 'gender', 'title', 'role', 'city', 'district', 'address', 'avatarUrl', 'active'];
    return editableKeys.some((key) => {
      const current = (state as any)[key];
      const initial = state.initialSnapshot![key];
      return String(current ?? '') !== String(initial ?? '');
    });
  }, [state]);
  const handleInputChange = (name: keyof AccountInfoState, value: any) => {
    // If city changes to a different value, reset district
    if (name === 'city' && String(value) !== String(state.city)) {
      dispatch({ type: 'onChange', name: 'district', value: '' });
    }
    dispatch({ type: 'onChange', name, value });
  };

  const handleSave = async () => {
    // Basic validation
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
        message: VALIDATION_MESSAGES.EMAIL_INVALID,
        toastType: 'error'
      });
      return;
    }

    dispatch({ type: 'setLoading', value: true });
    try {
      // Check email uniqueness if it has changed
      if (state.email && state.email !== user?.email) {
        const checkRes = await authService.checkEmail(state.email, user?.id);
        if (checkRes && checkRes.existed) {
          dispatch({
            type: 'showToast',
            message: 'Email này đã được sử dụng bởi một tài khoản khác',
            toastType: 'error'
          });
          dispatch({ type: 'setLoading', value: false });
          return;
        }
      }

      // Find selected province/city name from fetched provinces list
      const selectedProvince = state.provinces.find(p => String(p.code) === String(state.city));
      const provinceVal = selectedProvince ? selectedProvince.name : (state.city === 'HCM' ? 'Thành phố Hồ Chí Minh' : state.city);

      // Find selected district name from fetched districts list
      const selectedDistrict = state.districts.find(d => String(d.code) === String(state.district));
      const districtVal = selectedDistrict ? selectedDistrict.name : (state.district === 'GV' ? 'Phường Gò Vấp' : state.district);
      const payload: Record<string, any> = {
        fullName: state.displayName,
        dateOfBirth: state.birthday ? new Date(state.birthday) : null,
        gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),
        realRole: state.role,
        province: state.city ? { key: String(state.city), value: provinceVal } : null,
        district: state.district ? { key: String(state.district), value: districtVal } : null,
        address: state.address,
        workUnit: state.title,
        // NOTE: Do NOT send 'status' here — in the DB status=true means "account locked"
      };

      // If email changed, include it in payload
      if (state.email && state.email !== user?.email) {
        payload.email = state.email;
      }

      // include avatar (data URL) or empty string to signal removal
      payload.avatar = state.avatarUrl || '';

      const response = await authService.updateProfile(user?.id || '', payload);

      if (response.success) {
        if (user) {
          const selectedRoleObj = state.roles?.find((r: any) => r.role === state.role);
          const fallbackRoles: Record<string, { id: number; role: string; name: string }> = {
            'employee': { id: 1, role: 'employee', name: 'Nhân viên' },
            'expert': { id: 2, role: 'expert', name: 'Chuyên viên' },
            'leader': { id: 3, role: 'leader', name: 'Lãnh đạo' },
            'superAdmin': { id: 4, role: 'superAdmin', name: 'Quản trị viên' }
          };
          const mappedRole = selectedRoleObj || fallbackRoles[state.role];

          const updatedUser = {
            ...user,
            fullName: state.displayName,
            email: state.email || user.email,
            gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),
            realRole: mappedRole ? mappedRole.name : state.role,
            roleId: mappedRole ? mappedRole.id : (user as any).roleId,
            role: mappedRole ? mappedRole : (user as any).role,
            province: state.city ? { key: String(state.city), value: provinceVal } : null,
            district: state.district ? { key: String(state.district), value: districtVal } : null,
            address: state.address,
            workUnit: state.title,
            avatar: state.avatarUrl || '',
          };
          const token = getCookie('accessToken') || '';
          login(updatedUser as any, token, false);
        }
        // Update the snapshot to reflect the newly saved values
        const newSnapshot: Record<string, any> = {};
        const editableKeys = ['displayName', 'birthday', 'gender', 'title', 'role', 'city', 'district', 'address', 'avatarUrl', 'active'];
        editableKeys.forEach((key) => {
          newSnapshot[key] = (state as any)[key];
        });
        dispatch({ type: 'onChange', name: 'initialSnapshot', value: newSnapshot });

        dispatch({
          type: 'showToast',
          message: response.message || translate("notifications.profileUpdateSuccess"),
          toastType: 'success'
        });
      }
    } catch (error: any) {
      let errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || translate("notifications.error");
      if (typeof errorMsg === 'object' && errorMsg !== null) {
        errorMsg = errorMsg.message || JSON.stringify(errorMsg);
      }
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.join(', ');
      }
      dispatch({
        type: 'showToast',
        message: String(errorMsg),
        toastType: 'error'
      });
    } finally {
      dispatch({ type: 'setLoading', value: false });
    }
  };

  return {
    state,
    dispatch,
    handleInputChange,
    handleSave,
    hasChanges
  };
};
