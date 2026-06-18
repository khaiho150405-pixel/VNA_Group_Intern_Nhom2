"use client";
import { useReducer, useEffect, useMemo } from "react";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { useAuth } from "@core/contexts/AuthProvider";
import { authService } from "@tts/services/auth.services";
import { roleService } from "@tts/services/role.services";
import { userService } from "@tts/services/user.services";
import DoetService from "@tts/services/doet.service";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";
import useLocales from "@core/hooks/useLocales";
import { getCookie } from '@core/services/cookies';
import { useNotification } from "@core/hooks/useNotification";

export const useAccountInfo = () => {
  const { user, login } = useAuth();
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

    const refreshUser = async () => {
      if (user?.id) {
        try {
          const latestUserRes = await userService.getById(user.id);
          const userData = latestUserRes.data || latestUserRes;
          const token = getCookie('accessToken') || '';
          if (userData) {
            login(userData, token, false);
          }
        } catch (error) {
          console.error("Failed to refresh user data", error);
        }
      }
    };
    refreshUser();
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

  useEffect(() => {
    if (user && state.roles.length > 0) {
      const roleObj = (user as any).role || {};
      const matchedRole = state.roles.find((r: any) => r.name === (user as any).realRole || r.id === (user as any).roleId || r.id === roleObj.id);
      const currentRoleId = matchedRole ? matchedRole.id : '';

      let formattedBirthday = '';
      const rawBirthday = (user as any).dateOfBirth || (user as any).birthday;
      if (rawBirthday) {
        const date = new Date(rawBirthday);
        if (!isNaN(date.getTime())) {
          formattedBirthday = date.toISOString().split('T')[0];
        }
      }

      let genderStr = '';
      if ((user as any).gender === 1) genderStr = 'Nam';
      else if ((user as any).gender === 0) genderStr = 'Nữ';

      dispatch({
        type: 'setInitialData',
        data: {
          username: user.username || '',
          displayName: (user as any).fullName || '',
          email: user.email || '',
          avatarUrl: (user as any).avatar || '',
          birthday: formattedBirthday,
          gender: genderStr,
          address: (user as any).address || '',
          city: (user as any).province?.key || '',
          district: (user as any).district?.key || '',
          role: currentRoleId,
          title: (user as any).workUnit || '',
          active: (user as any).status === true
        }
      });
    }
  }, [user, state.roles]);

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
      notifyError('Họ và tên không được để trống');
      return;
    }

    if (state.email && !validate.email(state.email)) {
      notifyError(VALIDATION_MESSAGES.EMAIL_INVALID);
      return;
    }

    dispatch({ type: 'setLoading', value: true });
    try {
      // Check email uniqueness if it has changed
      if (state.email && state.email !== user?.email) {
        const checkRes = await authService.checkEmail(state.email, user?.id);
        if (checkRes && checkRes.existed) {
          notifyError('Email này đã được sử dụng bởi một tài khoản khác');
          dispatch({ type: 'setLoading', value: false });
          return;
        }
      }

      // Find selected province/city name from fetched provinces list
      const selectedProvince = state.provinces.find(p => String(p.code) === String(state.city));
      const provinceVal = selectedProvince ? selectedProvince.name : state.city;

      // Find selected district name from fetched districts list
      const selectedDistrict = state.districts.find(d => String(d.code) === String(state.district));
      const districtVal = selectedDistrict ? selectedDistrict.name : state.district;

      const selectedRoleObj = state.roles?.find((r: any) => String(r.id) === String(state.role));
      const roleNameToSave = selectedRoleObj ? selectedRoleObj.name : '';

      const payload: Record<string, any> = {
        fullName: state.displayName,
        dateOfBirth: state.birthday ? new Date(state.birthday) : null,
        gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),
        realRole: roleNameToSave,
        roleId: selectedRoleObj ? Number(selectedRoleObj.id) : null,
        province: state.city ? { key: String(state.city), value: provinceVal } : null,
        district: state.district ? { key: String(state.district), value: districtVal } : null,
        address: state.address,
        workUnit: state.title,
        status: state.active
      };

      // If email changed, include it in payload
      if (state.email && state.email !== user?.email) {
        payload.email = state.email;
      }

      // include avatar (data URL) or empty string to signal removal
      payload.avatar = state.avatarUrl || '';

      const response = await authService.updateProfile(user?.id || '', payload);

      if (response.success || response) {
        if (user) {
          const updatedUser = {
            ...user,
            fullName: state.displayName,
            email: state.email || user.email,
            gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),
            realRole: roleNameToSave,
            roleId: selectedRoleObj ? Number(selectedRoleObj.id) : (user as any).roleId,
            province: state.city ? { key: String(state.city), value: provinceVal } : null,
            district: state.district ? { key: String(state.district), value: districtVal } : null,
            address: state.address,
            avatar: state.avatarUrl || '',
            workUnit: state.title,
            status: state.active
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

        success(response.message || translate("notifications.profileUpdateSuccess"));
      }
    } catch (error: any) {
      let errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || translate("notifications.error");
      if (typeof errorMsg === 'object' && errorMsg !== null) {
        errorMsg = errorMsg.message || JSON.stringify(errorMsg);
      }
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.join(', ');
      }
      notifyError(String(errorMsg));
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
