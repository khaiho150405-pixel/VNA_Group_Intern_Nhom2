"use client";
import { useReducer, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginReducer, initialLoginState, LoginState } from "@tts/logic/login/reducer";
import { useAuth } from "@core/contexts/AuthProvider";
import { authService } from "@tts/services/auth.services";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";
import useLocales from "@core/hooks/useLocales";

export const useLogin = () => {
  const { login } = useAuth();
  const router = useRouter();
  const { translate } = useLocales();
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
        values: { userName: rememberedUser, password: "", isMemory: true }
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

  const triggerToast = (type: "error" | "success", message: string) => {
    setShowToast(false);
    setTimeout(() => {
      if (type === "error") {
        dispatch({ type: "setError", message });
      } else {
        dispatch({ type: "setSuccess", message });
      }
      setShowToast(true);
    }, 50);
  };

  const handleLoginSubmit = async () => {
    setShowToast(false);

    if (!validate.required(state.userName) || !validate.required(state.password)) {
      triggerToast("error", VALIDATION_MESSAGES.FULL_INFO_REQUIRED);
      return;
    }

    if (!validate.username(state.userName)) {
      triggerToast("error", VALIDATION_MESSAGES.USERNAME_INVALID);
      return;
    }

    if (!validate.minLength(state.password, 1)) { // Basic check, already covered by required
      triggerToast("error", VALIDATION_MESSAGES.FULL_INFO_REQUIRED);
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
          localStorage.removeItem("rememberedPassword");
          localStorage.setItem("isMemory", "true");
        } else {
          localStorage.removeItem("rememberedUser");
          localStorage.removeItem("rememberedPassword");
          localStorage.setItem("isMemory", "false");
        }

        triggerToast("success", translate("notifications.loginSuccess"));
        setTimeout(() => {
          login(loginUser, loginToken || "");
          dispatch({ type: "reset" });
        }, 1000);
      } else {
        triggerToast("error", translate("notifications.tokenError"));
      }
    } catch (error: any) {
      let message = translate("notifications.error");
      const errorData = error.response?.data;
      const errorMessage = errorData?.errors?.message || errorData?.errors || errorData?.message;

      if (errorMessage === "Wrong password" || errorMessage === "Account not found") {
        message = translate("notifications.loginError");
      } else if (errorMessage === "Account is locked") {
        message = translate("notifications.accountLocked");
      } else if (errorMessage) {
        message = errorMessage;
      } else if (error?.message) {
        message = error.message;
      }
      triggerToast("error", message);
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
