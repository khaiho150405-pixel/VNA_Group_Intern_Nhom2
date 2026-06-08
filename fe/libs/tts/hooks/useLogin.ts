"use client";
import { useReducer, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginReducer, initialLoginState, LoginState } from "@tts/logic/login/reducer";
import { useAuth } from "@core/contexts/AuthProvider";
import { authService } from "@tts/services/auth.services";

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
    
    if (!state.userName || !state.password) {
      dispatch({ type: "setError", message: "Vui lòng nhập đầy đủ thông tin" });
      setShowToast(true);
      return;
    }

    try {
      const response = await authService.login({ 
        userName: state.userName, 
        password: state.password 
      });
      
      if (response.success && response.user) {
        // Handle "Remember Me"
        if (state.isMemory) {
          localStorage.setItem("rememberedUser", state.userName);
          localStorage.setItem("isMemory", "true");
        } else {
          localStorage.removeItem("rememberedUser");
          localStorage.setItem("isMemory", "false");
        }

        login(response.user, response.token);
        dispatch({ type: "reset" });
        router.push("/"); // Redirect to home after login
      }
    } catch (error: any) {
      dispatch({ type: "setError", message: error.message || "Đã có lỗi xảy ra" });
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
