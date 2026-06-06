"use client";
import React, { useReducer, useEffect, useState } from "react";
import { Typography, TextField, Button, InputAdornment, IconButton, Box } from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import ErrorOutlinedIcon from "@material-ui/icons/ErrorOutlined";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CloseIcon from "@material-ui/icons/Close";
import { useRouter } from "next/navigation";
import { forgotPassReducer, initialForgotPassState } from "@tts/logic/changePassword/reducer";
import { useResetPasswordStyles } from "@tts/logic/changePassword/style";

// --- CƠ SỞ DỮ LIỆU GIẢ LẬP ĐỂ TEST NGHIỆP VỤ ---
export const MOCK_USERS = [
  {
    username: "phatAdmin",         
    password: "123",              
    email: "nuyenphat2468@gmail.com",
    role: "ROLE_SO",
    displayName: "Cán Bộ Sở Quản Lý"
  },
  {
    username: "phatDN",          
    password: "123",
    email: "phatlklk321@gmail.com", 
    role: "ROLE_DN",
    displayName: "Công ty Cổ phần Mộc Test"
  }
];

export const ForgotPasswordPage = () => {
  const classes = useResetPasswordStyles();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  
  const [state, dispatch] = useReducer(forgotPassReducer, initialForgotPassState);
  const { step, email, newPassword, confirmPassword, otp, showNewPass, showConfirmPass, errorMessage, successMessage } = state;

  const [countdown, setCountdown] = useState(0);
  const [showToast, setShowToast] = useState(false);

  // Hiệu ứng tự động mờ dần Toast sau 3 giây
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showToast) {
      timer = setTimeout(() => setShowToast(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  // Bộ đếm ngược thời gian OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const triggerToast = (type: "error" | "success", message: string) => {
    setShowToast(false);
    setTimeout(() => {
      if (type === "error") dispatch({ type: "setError", message });
      else dispatch({ type: "setSuccess", message });
      setShowToast(true);
    }, 50);
  };

  // const handleSendEmail = () => {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  //   if (!email) {
  //     triggerToast("error", "Vui lòng nhập đầy đủ thông tin");
  //     return;
  //   }
    
  //   if (!emailRegex.test(email)) {
  //     triggerToast("error", "Vui lòng nhập đúng định dạng email, định dạng đúng ...@...");
  //     return;
  //   }
    
  //   // TRUY VẤN MOCK DB: Tìm xem có user nào sở hữu email này không
  //   const userExists = MOCK_USERS.find((u) => u.email === email);

  //   if (!userExists) {
  //     triggerToast("error", "Email chưa đăng ký trong hệ thống. Xin vui lòng thử lại sau");
  //     return;
  //   }

  //   // Gửi thành công cho cả Role Sở và Role Doanh Nghiệp
  //   console.log(`Đang gửi mã OTP đến: ${userExists.email} (Quyền: ${userExists.role})`);
  //   triggerToast("success", "Gửi email thành công");
    
  //   setTimeout(() => {
  //     dispatch({ type: "nextStep" });
  //     setCountdown(60);
  //   }, 1000);
  // };

  // HÀM GỬI MAIL THỰC SỰ XUỐNG BACKEND NEXT.JS (TẠM THỜI TEST VỚI MOCK DB, BƯỚC TIẾP THEO SẼ KẾT NỐI THỰC SỰ BACKEND)
  const handleSendEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      triggerToast("error", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    if (!emailRegex.test(email)) {
      triggerToast("error", "Vui lòng nhập đúng định dạng email, định dạng đúng ...@...");
      return;
    }
    
    // Tìm user trong Mock DB để lấy thông tin Tên, Username gắn vào Template
    const userExists = MOCK_USERS.find((u) => u.email === email);

    if (!userExists) {
      triggerToast("error", "Email chưa đăng ký trong hệ thống. Xin vui lòng thử lại sau");
      return;
    }

    // TẠO MÃ OTP NGẪU NHIÊN 6 SỐ
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // GỌI API GỬI MAIL XUỐNG BACKEND NEXT.JS
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userExists.email,
          displayName: userExists.displayName, 
          username: userExists.username,       
          otp: generatedOtp                    
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Lưu tạm OTP vào state hoặc LocalStorage để tí nữa Validate ở Bước 2
        localStorage.setItem("temp_otp", generatedOtp);
        
        triggerToast("success", "Gửi email thành công");
        
        setTimeout(() => {
          dispatch({ type: "nextStep" });
          setCountdown(60);
        }, 1000);
      } else {
        triggerToast("error", "Có lỗi xảy ra khi gửi email.");
      }
    } catch (error) {
      triggerToast("error", "Không thể kết nối đến máy chủ.");
    }
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword || !otp) {
      triggerToast("error", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast("error", "Mật khẩu xác nhận không khớp");
      return;
    }

    triggerToast("success", "Khôi phục mật khẩu thành công!");
    setTimeout(() => {
      dispatch({ type: "reset" });
      router.push("/login");
    }, 1500);
  };

  return (
    <div className={classes.root}>
      {/* TOAST THÔNG BÁO NỔI */}
      <div className={`${classes.toastContainer} ${!showToast ? classes.toastHidden : ""} ${errorMessage ? classes.toastError : classes.toastSuccess}`}>
        <Box display="flex" alignItems="center">
          {errorMessage ? (
            <ErrorOutlinedIcon fontSize="small" style={{ color: "#ff453a" }} />
          ) : (
            <CheckCircleOutlineIcon fontSize="small" style={{ color: "#34c759" }} />
          )}
          <Typography className={classes.toastText} style={{ color: errorMessage ? "#ff453a" : "#34c759" }}>
            {errorMessage || successMessage}
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setShowToast(false)} style={{ color: errorMessage ? "#ff453a" : "#34c759" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* CỘT TRÁI - HÌNH MINH HỌA */}
      <div className={classes.imageSection} />

      {/* CỘT PHẢI - FORM */}
      <div className={classes.formSection}>
        <div className={classes.card}>
          <div className={classes.cardContent} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}>
            <div className={classes.logoContainer}>
              <img src="/static/mock-images/logo.png" alt="Logo" className={classes.logo} />
            </div>

            <Typography className={classes.subTitle} style={{ textAlign: "center", fontSize: "1.1rem" }}>
              QUÊN MẬT KHẨU
            </Typography>

            {step === 1 ? (
              <>
                <Typography style={{ textAlign: "center", marginBottom: 24, fontSize: "0.85rem", color: "#555" }}>
                  Vui lòng nhập email đã đăng ký tài khoản
                </Typography>
                
                <TextField 
                  fullWidth variant="outlined" size="small" className={classes.field} 
                  label="Email *" 
                  value={email} 
                  onChange={(e) => dispatch({ type: "onChange", name: "email", value: e.target.value })} 
                />
                
                <Button fullWidth variant="contained" disableElevation className={classes.loginBtn} onClick={handleSendEmail}>
                  Gửi xác thực
                </Button>
              </>
            ) : (
              <>
                <Typography style={{ textAlign: "center", marginBottom: 16, fontSize: "0.85rem", color: "#555" }}>
                  Chúng tôi đã gửi mã xác minh qua email<br/>
                  <strong style={{ color: "#000" }}>{email}</strong><br/>
                  Bạn vui lòng kiểm tra và điền mã xác thực
                </Typography>
                
                <TextField 
                  fullWidth variant="outlined" size="small" className={classes.field} 
                  type={showNewPass ? "text" : "password"} label="Nhập mật khẩu mới *" 
                  value={newPassword} onChange={(e) => dispatch({ type: "onChange", name: "newPassword", value: e.target.value })} 
                  InputProps={{ endAdornment: ( <InputAdornment position="end"> <IconButton onClick={() => dispatch({ type: "toggleShowNewPass" })} size="small"> {showNewPass ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />} </IconButton> </InputAdornment> ), }} 
                />

                <TextField 
                  fullWidth variant="outlined" size="small" className={classes.field} 
                  type={showConfirmPass ? "text" : "password"} label="Xác nhận mật khẩu mới *" 
                  value={confirmPassword} onChange={(e) => dispatch({ type: "onChange", name: "confirmPassword", value: e.target.value })} 
                  InputProps={{ endAdornment: ( <InputAdornment position="end"> <IconButton onClick={() => dispatch({ type: "toggleShowConfirmPass" })} size="small"> {showConfirmPass ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />} </IconButton> </InputAdornment> ), }} 
                />

                <TextField 
                  fullWidth variant="outlined" size="small" className={classes.field} 
                  label="OTP *" value={otp} onChange={(e) => dispatch({ type: "onChange", name: "otp", value: e.target.value })} 
                />
                
                <Box display="flex" flexDirection="column" alignItems="center" marginBottom={2}>
                  <Typography style={{ color: "#2f65f0", fontWeight: "bold", fontSize: "0.9rem" }}>
                    00:{countdown < 10 ? `0${countdown}` : countdown}
                  </Typography>
                  <Button disableRipple disabled={countdown > 0} className={classes.forgotLink} style={{ color: countdown > 0 ? "#aaa" : "#2f65f0" }} onClick={() => setCountdown(60)}>
                    Chưa nhận được mã? Gửi lại
                  </Button>
                </Box>

                <Button fullWidth variant="contained" disableElevation className={classes.loginBtn} onClick={handleResetPassword}>
                  Khôi phục mật khẩu
                </Button>
              </>
            )}

            {/* Nút quay về Đăng nhập */}
            <Box display="flex" justifyContent="center" alignItems="center" marginTop={2}>
              <Typography style={{ fontSize: "0.85rem", color: "#555" }}>Bạn đã có tài khoản </Typography>
              <Button disableRipple className={classes.forgotLink} style={{ marginLeft: 4 }} onClick={() => router.push("/login")}>
                Đăng nhập
              </Button>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
};