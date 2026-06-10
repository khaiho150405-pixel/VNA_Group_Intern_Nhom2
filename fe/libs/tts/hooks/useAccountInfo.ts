"use client";
import { useReducer, useEffect } from "react";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { useAuth } from "@core/contexts/AuthProvider";
import { authService } from "@tts/services/auth.services";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";

import { getCookie } from '@core/services/cookies';

export const useAccountInfo = () => {
  const { user, login } = useAuth();
  const [state, dispatch] = useReducer(accountInfoReducer, initialAccountInfoState);

  useEffect(() => {
    if (user) {
      dispatch({
        type: 'setInitialData',
        data: {
          username: user.username || '',
          displayName: (user as any).fullName || user.fullName || user.displayName || '',
          email: user.email || '',
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

      // include avatar (data URL) when present so backend can persist or frontend can immediately reflect it
      if (state.avatarUrl) {
        payload.avatar = state.avatarUrl;
      }

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
            // if avatarUrl exists update local user object so sidebar/avatar syncs immediately
            ...(state.avatarUrl ? { avatar: state.avatarUrl } : {}),
          };
          const token = getCookie('accessToken') || '';
          login(updatedUser as any, token);
        }
        dispatch({
          type: 'showToast',
          message: response.message || 'Cập nhật thành công',
          toastType: 'success'
        });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
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
