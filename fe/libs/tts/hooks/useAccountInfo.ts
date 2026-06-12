"use client";
import { useReducer, useEffect } from "react";
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
    fetchRoles();
  }, []);

  useEffect(() => {
    if (user) {
      const userRoleKey = (user as any).roleId === 4 ? 'superAdmin' 
                       : (user as any).roleId === 3 ? 'leader' 
                       : (user as any).roleId === 2 ? 'expert' 
                       : (user as any).roleId === 1 ? 'employee' 
                       : (user as any).realRole || '';

      let formattedBirthday = '1995-06-01';
      const rawBirthday = (user as any).dateOfBirth || (user as any).birthday;
      if (rawBirthday) {
        const date = new Date(rawBirthday);
        if (!isNaN(date.getTime())) {
          formattedBirthday = date.toISOString().split('T')[0];
        }
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
          city: (user as any).province?.key || (user as any).province || '',
          district: (user as any).district?.key || (user as any).district || '',
          role: userRoleKey,
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

  const handleInputChange = (name: keyof AccountInfoState, value: any) => {
    dispatch({ type: 'onChange', name, value });
    
    // If city changes, reset district
    if (name === 'city') {
      dispatch({ type: 'onChange', name: 'district', value: '' });
    }
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

      const payload: Record<string, any> = {
        fullName: state.displayName,
        dateOfBirth: state.birthday ? new Date(state.birthday) : null,
        gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),
        realRole: state.role,
        province: state.city ? { key: state.city, value: state.city === 'HCM' ? 'Thành phố Hồ Chí Minh' : state.city } : null,
        district: state.district ? { key: state.district, value: state.district === 'GV' ? 'Phường Gò Vấp' : state.district } : null,
        address: state.address,
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
          const updatedUser = {
            ...user,
            fullName: state.displayName,
            email: state.email || user.email,
            gender: state.gender === 'Nam' ? 1 : (state.gender === 'Nữ' ? 0 : null),
            realRole: state.role,
            province: state.city ? { key: state.city, value: state.city === 'HCM' ? 'Thành phố Hồ Chí Minh' : state.city } : null,
            district: state.district ? { key: state.district, value: state.district === 'GV' ? 'Phường Gò Vấp' : state.district } : null,
            address: state.address,
            avatar: state.avatarUrl || '',
          };
          const token = getCookie('accessToken') || '';
          login(updatedUser as any, token, false);
        }
        dispatch({
          type: 'showToast',
          message: response.message || translate("notifications.profileUpdateSuccess"),
          toastType: 'success'
        });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || translate("notifications.error");
      dispatch({
        type: 'showToast',
        message: errorMsg,
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
    handleSave
  };
};
