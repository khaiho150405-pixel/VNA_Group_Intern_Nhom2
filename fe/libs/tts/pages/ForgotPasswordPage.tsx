"use client";
import React from "react";
import { Typography, TextField, Button, InputAdornment, IconButton, Box } from "@mui/material";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { useRouter } from "next/navigation";
import { useResetPasswordStyles } from "@tts/logic/forgot-password/style";
import { AuthLogo } from "@tts/components/AuthLogo";
import { AppToast } from "@tts/components/AppToast";
import { AuthLayout } from "@core/layouts/AuthLayout";
import { useForgotPassword } from "@tts/hooks/useForgotPassword";

export const ForgotPasswordPage = () => {
  const classes = useResetPasswordStyles();
  const router = useRouter();
  
  const {
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
  } = useForgotPassword();

  const { 
    step, 
    email, 
    newPassword, 
    confirmPassword, 
    otp, 
    showNewPass, 
    showConfirmPass, 
    errorMessage, 
    successMessage 
  } = state;

  return (
    <>
      <AppToast 
        show={showToast} 
        message={errorMessage || successMessage} 
        type={errorMessage ? "error" : "success"} 
        onClose={() => setShowToast(false)} 
      />

      <AuthLayout visible={visible}>
        <AuthLogo subTitle="QUÊN MẬT KHẨU" />

        {step === 1 ? (
          <>
            <Typography 
              style={{ textAlign: "center", marginBottom: 24, fontSize: "0.85rem", color: "#555" }}
            >
              Vui lòng nhập email đã đăng ký tài khoản
            </Typography>
            
            <TextField 
              fullWidth variant="outlined" size="small" className={classes.field} 
              label="Email *" 
              value={email} 
              onChange={(e) => handleInputChange("email", e.target.value)} 
            />
            
            <Button 
              fullWidth variant="contained" disableElevation className={classes.loginBtn} 
              onClick={handleSendEmail}
            >
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
              value={newPassword} 
              onChange={(e) => handleInputChange("newPassword", e.target.value)} 
              InputProps={{ 
                endAdornment: ( 
                  <InputAdornment position="end"> 
                    <IconButton onClick={() => dispatch({ type: "toggleShowNewPass" })} size="small"> 
                      {showNewPass ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />} 
                    </IconButton> 
                  </InputAdornment> 
                ), 
              }} 
            />

            <TextField 
              fullWidth variant="outlined" size="small" className={classes.field} 
              type={showConfirmPass ? "text" : "password"} label="Xác nhận mật khẩu mới *" 
              value={confirmPassword} 
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)} 
              InputProps={{ 
                endAdornment: ( 
                  <InputAdornment position="end"> 
                    <IconButton onClick={() => dispatch({ type: "toggleShowConfirmPass" })} size="small"> 
                      {showConfirmPass ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />} 
                    </IconButton> 
                  </InputAdornment> 
                ), 
              }} 
            />

            <TextField 
              fullWidth variant="outlined" size="small" className={classes.field} 
              label="OTP *" 
              value={otp} 
              onChange={(e) => handleInputChange("otp", e.target.value)} 
            />
            
            <Box display="flex" flexDirection="column" alignItems="center" marginBottom={2}>
              <Typography style={{ color: "#2f65f0", fontWeight: "bold", fontSize: "0.9rem" }}>
                00:{countdown < 10 ? `0${countdown}` : countdown}
              </Typography>
              <Button 
                disableRipple 
                disabled={countdown > 0} 
                className={classes.forgotLink} 
                style={{ color: countdown > 0 ? "#aaa" : "#2f65f0" }} 
                onClick={() => setCountdown(60)}
              >
                Chưa nhận được mã? Gửi lại
              </Button>
            </Box>

            <Button 
              fullWidth variant="contained" disableElevation className={classes.loginBtn} 
              onClick={handleResetPassword}
            >
              Khôi phục mật khẩu
            </Button>
          </>
        )}

        <Box display="flex" justifyContent="center" alignItems="center" marginTop={2}>
          <Typography style={{ fontSize: "0.85rem", color: "#555" }}>Bạn đã có tài khoản </Typography>
          <Button 
            disableRipple 
            className={classes.forgotLink} 
            style={{ marginLeft: 4 }} 
            onClick={() => router.push("/login")}
          >
            Đăng nhập
          </Button>
        </Box>
      </AuthLayout>
    </>
  );
};
