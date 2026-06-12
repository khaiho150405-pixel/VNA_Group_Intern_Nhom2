"use client";
import { useReducer, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginReducer, initialLoginState, LoginState } from "@tts/logic/login/reducer";
import { useAuth } from "@core/contexts/AuthProvider";
import { authService } from "@tts/services/auth.services";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";

export const useLogin = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [state, dispatch] = useReducer(loginReducer, initialLoginState);
  const [showToast, setShowToast] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    // Load remembered credentials
    const rememberedUser = localStorage.getItem("rememberedUser");
    const rememberedMemory = localStorage.getItem("isMemory") === "true";

    if (rememberedMemory && rememberedUser) {
      dispatch({
        type: "setValues",
        values: { userName: rememberedUser, isMemory: true }
      });
    }

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleInputChange = (name: keyof LoginState, value: string | boolean) => {
    dispatch({ type: "onChange", name, value });
  };

  const handleLoginSubmit = async () => {
    setShowToast(false);

    if (!validate.required(state.userName) || !validate.required(state.password)) {
      dispatch({ type: "setError", message: VALIDATION_MESSAGES.FULL_INFO_REQUIRED });
      setShowToast(true);
      return;
    }

    if (!validate.username(state.userName)) {
      dispatch({ type: "setError", message: VALIDATION_MESSAGES.USERNAME_INVALID });
      setShowToast(true);
      return;
    }

    if (!validate.minLength(state.password, 1)) { // Basic check, already covered by required
      dispatch({ type: "setError", message: VALIDATION_MESSAGES.FULL_INFO_REQUIRED });
      setShowToast(true);
      return;
    }

    try {
      const response = await authService.login({
        userName: state.userName,
        password: state.password
      });
      console.log('reponse: ', response);
      const apiData = (response as any).data || response;
      const success = response.success;
      const loginUser = apiData.user;
      const loginToken = apiData.token;

      if (success && loginToken) {
        // Handle "Remember Me"
        if (state.isMemory) {
          localStorage.setItem("rememberedUser", state.userName);
          localStorage.setItem("isMemory", "true");
        } else {
          localStorage.removeItem("rememberedUser");
          localStorage.setItem("isMemory", "false");
        }

        login(loginUser, loginToken || "");
        dispatch({ type: "reset" });
      } else {
        dispatch({ type: "setError", message: "Đăng nhập thành công nhưng không nhận được Token từ Server." });
        setShowToast(true);
      }
    } catch (error: any) {
      let message = "Đã có lỗi xảy ra";
      const errorData = error.response?.data;
      if (errorData?.errors?.message === "Wrong password" || errorData?.errors?.message === "Account not found") {
        message = "Tài khoản hoặc mật khẩu không đúng. Xin vui lòng thử lại";
      } else if (errorData?.errors?.message) {
        message = errorData.errors.message;
      } else if (error?.message) {
        message = error.message;
      }
      dispatch({ type: "setError", message });
      setShowToast(true);
    }
  };

  return {
    state,
    dispatch,
    visible,
    showToast,
    setShowToast,
    handleInputChange,
    handleLoginSubmit
  };
};
