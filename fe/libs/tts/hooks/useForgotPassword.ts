"use client";
import { useReducer, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { forgotPassReducer, initialForgotPassState, ForgotPassState } from "@tts/logic/forgot-password/reducer";
import { authService } from "@tts/services/auth.services";
import { validate, VALIDATION_MESSAGES } from "@core/utils/validation";
import useLocales from "@core/hooks/useLocales";

export const useForgotPassword = () => {
  const router = useRouter();
  const { translate } = useLocales();
  const [state, dispatch] = useReducer(forgotPassReducer, initialForgotPassState);
  const [showToast, setShowToast] = useState(false);
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showToast) {
      timer = setTimeout(() => setShowToast(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

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

  const handleInputChange = (name: keyof ForgotPassState, value: string | boolean | number) => {
    dispatch({ type: "onChange", name, value });
  };

  const handleSendEmail = async () => {
    if (!validate.required(state.email)) {
      triggerToast("error", VALIDATION_MESSAGES.FULL_INFO_REQUIRED);
      return;
    }

    if (!validate.email(state.email)) {
      triggerToast("error", VALIDATION_MESSAGES.EMAIL_INVALID);
      return;
    }
    try {
      // Check if email exists in the system first
      const checkRes = await authService.checkEmailPublic(state.email);
      if (checkRes && !checkRes.existed) {
        triggerToast("error", "Email chưa đăng ký trong hệ thống. Vui lòng kiểm tra lại.");
        return;
      }

      const response = await authService.sendOtp(state.email);
      if (response.success) {
        triggerToast("success", translate("notifications.otpSentSuccess"));
        setTimeout(() => {
          dispatch({ type: "nextStep" });
          setCountdown(60);
        }, 1000);
      }
    } catch (error: any) {
      let errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || translate("notifications.error");
      if (typeof errorMsg === 'object' && errorMsg !== null) {
        errorMsg = errorMsg.message || JSON.stringify(errorMsg);
      }
      triggerToast("error", String(errorMsg));
    }
  };

  const handleResetPassword = async () => {
    if (!validate.required(state.newPassword) || !validate.required(state.confirmPassword) || !validate.required(state.otp)) {
      triggerToast("error", VALIDATION_MESSAGES.FULL_INFO_REQUIRED);
      return;
    }

    if (!validate.minLength(state.newPassword, 6)) {
      triggerToast("error", VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH(6));
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      triggerToast("error", VALIDATION_MESSAGES.PASSWORD_CONFIRM_NOT_MATCH);
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(state.newPassword);
    const hasNumber = /[0-9]/.test(state.newPassword);
    if (!hasLetter || !hasNumber) {
      triggerToast("error", 'Mật khẩu mới quá yếu. Cần chứa ít nhất chữ và số.');
      return;
    }
    if (!validate.otp(state.otp)) {
      triggerToast("error", VALIDATION_MESSAGES.OTP_INVALID);
      return;
    }

    try {
      const response = await authService.resetPassword({
        email: state.email,
        otp: state.otp,
        newPassword: state.newPassword
      });
      if (response && response.success) {
        triggerToast("success", translate("notifications.forgotPasswordSuccess"));
        setTimeout(() => {
          dispatch({ type: "reset" });
          router.push("/login");
        }, 1500);
      } else {
        triggerToast("error", translate("notifications.otpError"));
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || translate("notifications.error");
      triggerToast("error", errorMsg);
    }
  };

  return {
    state,
    dispatch,
    visible,
    showToast,
    setShowToast,
    countdown,
    setCountdown,
    handleInputChange,
    handleSendEmail,
    handleResetPassword
  };
};
