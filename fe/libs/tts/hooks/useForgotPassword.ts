"use client";
import { useReducer, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { forgotPassReducer, initialForgotPassState, ForgotPassState } from "@tts/logic/forgot-password/reducer";
import { authService } from "@tts/services/auth.services";

export const useForgotPassword = () => {
  const router = useRouter();
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!state.email) {
      triggerToast("error", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    if (!emailRegex.test(state.email)) {
      triggerToast("error", "Vui lòng nhập đúng định dạng email, định dạng đúng ...@...");
      return;
    }
    
    try {
      const response = await authService.sendOtp(state.email);
      if (response.success) {
        triggerToast("success", response.message || "Gửi email thành công");
        setTimeout(() => {
          dispatch({ type: "nextStep" });
          setCountdown(60);
        }, 1000);
      }
    } catch (error: any) {
      triggerToast("error", error.message || "Có lỗi xảy ra khi gửi email.");
    }
  };

  const handleResetPassword = async () => {
    if (!state.newPassword || !state.confirmPassword || !state.otp) {
      triggerToast("error", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      triggerToast("error", "Mật khẩu xác nhận không khớp. Vui lòng nhập lại");
      return;
    }

    try {
      const response = await authService.resetPassword({ 
        email: state.email, 
        otp: state.otp, 
        newPassword: state.newPassword 
      });
      if (response && response.success) {
        triggerToast("success", "Khôi phục mật khẩu thành công!");
        setTimeout(() => {
          dispatch({ type: "reset" });
          router.push("/login");
        }, 1500);
      } else {
        alert("Mã OTP không chính xác");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors || error.response?.data?.message || error.message || "Có lỗi xảy ra";
      alert(errorMsg);
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
