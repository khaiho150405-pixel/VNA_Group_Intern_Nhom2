"use client";
import { useReducer, useEffect } from "react";
import { accountInfoReducer, initialAccountInfoState, AccountInfoState } from "@tts/logic/account-info/reducer";
import { useAuth } from "@core/contexts/AuthProvider";
import { authService } from "@tts/services/auth.services";

export const useAccountInfo = () => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(accountInfoReducer, initialAccountInfoState);

  useEffect(() => {
    if (user) {
      dispatch({
        type: 'setInitialData',
        data: {
          username: user.username || '',
          displayName: user.displayName || '',
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
    dispatch({ type: 'setLoading', value: true });
    try {
      const payload = {
        displayName: state.displayName,
        birthday: state.birthday,
        gender: state.gender,
        title: state.title,
        role: state.role,
        city: state.city,
        district: state.district,
        address: state.address,
        active: state.active,
        avatar: state.avatarFile // Added avatar file
      };
      
      const response = await authService.updateProfile(payload);
      
      if (response.success) {
        dispatch({ 
          type: 'showToast', 
          message: response.message || 'Cập nhật thành công', 
          toastType: 'success' 
        });
      }
    } catch (error: any) {
      dispatch({ 
        type: 'showToast', 
        message: error.message || 'Đã có lỗi xảy ra', 
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
