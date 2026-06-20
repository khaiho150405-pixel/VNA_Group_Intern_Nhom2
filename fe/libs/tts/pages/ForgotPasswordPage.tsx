"use client";
import React from "react";
import { Typography, TextField, Button, InputAdornment, IconButton, Box, Collapse } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import { useRouter } from "next/navigation";
import { useResetPasswordStyles } from "@tts/logic/forgot-password/style";
import { AuthLogo } from "@tts/components/AuthLogo";
import { AppToast } from "@tts/components/AppToast";
import { AuthLayout } from "@core/layouts/AuthLayout";
import { useForgotPassword } from "@tts/hooks/useForgotPassword";
import { RequiredLabel } from "@core/components/RequiredLabel";
import { VNA_COLORS } from "@core/theme";

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

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: 'transparent', score: 0 };
    if (password.length < 8) return { label: 'Yếu (Yêu cầu ít nhất 8 kí tự)', color: '#f44336', score: 1 };

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (password.length >= 8 && hasLower && hasUpper && hasNumber && hasSpecial) {
      return { label: 'Rất mạnh', color: '#4caf50', score: 3 };
    }
    if (hasLower && hasUpper && hasNumber) {
      return { label: 'Đạt yêu cầu', color: '#2f65f0', score: 2 };
    }
    return { label: 'Yếu (Cần chữ thường, chữ hoa và số)', color: '#f44336', score: 1 };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <>
      <AuthLayout visible={visible}>
        <AuthLogo subTitle="QUÊN MẬT KHẨU" />

        <Collapse in={showToast && !!errorMessage}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            bgcolor: 'rgba(255, 69, 58, 0.05)', 
            border: `1px solid ${VNA_COLORS.error}`, 
            borderRadius: 1, 
            p: 1.5, 
            mb: 2 
          }}>
            <ErrorOutlinedIcon sx={{ color: VNA_COLORS.error, fontSize: '1.2rem' }} />
            <Typography style={{ color: VNA_COLORS.error, fontSize: "0.85rem", fontWeight: 500 }}>
              {errorMessage}
            </Typography>
          </Box>
        </Collapse>
        <Collapse in={showToast && !!successMessage}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            bgcolor: 'rgba(52, 199, 89, 0.05)', 
            border: `1px solid ${VNA_COLORS.success}`, 
            borderRadius: 1, 
            p: 1.5, 
            mb: 2 
          }}>
            <CheckCircleOutlinedIcon sx={{ color: VNA_COLORS.success, fontSize: '1.2rem' }} />
            <Typography style={{ color: VNA_COLORS.success, fontSize: "0.85rem", fontWeight: 500 }}>
              {successMessage}
            </Typography>
          </Box>
        </Collapse>

        {step === 1 ? (
          <>
            <Typography 
              style={{ textAlign: "center", marginBottom: 24, fontSize: "0.85rem", color: "#555" }}
            >
              Vui lòng nhập email đã đăng ký tài khoản
            </Typography>
            
            <TextField 
              fullWidth variant="outlined" size="small" className={classes.field} 
              label={<RequiredLabel label="Email" />} 
              value={email} 
              onChange={(e) => handleInputChange("email", e.target.value)} 
              onFocus={() => setShowToast(false)}
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
            
            <Box sx={{ mb: 3 }}>
              <TextField 
                fullWidth variant="outlined" size="small" className={classes.field} 
                style={{ marginBottom: 0 }}
                type={showNewPass ? "text" : "password"} 
                label={<RequiredLabel label="Mật khẩu mới" />} 
                value={newPassword} 
                onChange={(e) => handleInputChange("newPassword", e.target.value)} 
                onFocus={() => setShowToast(false)}
                slotProps={{ 
                  input: { 
                    endAdornment: ( 
                      <InputAdornment position="end"> 
                        <IconButton onClick={() => dispatch({ type: "toggleShowNewPass" })} size="small"> 
                          {showNewPass ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />} 
                        </IconButton> 
                      </InputAdornment> 
                    ), 
                  }
                }} 
              />
              {newPassword && (
                <Box sx={{ mt: 1, ml: 1 }}>
                  <Typography style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>
                    Độ mạnh: {strength.label}
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField 
              fullWidth variant="outlined" size="small" className={classes.field} 
              type={showConfirmPass ? "text" : "password"} 
              label={<RequiredLabel label="Xác nhận mật khẩu mới" />} 
              value={confirmPassword} 
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)} 
              onFocus={() => setShowToast(false)}
              slotProps={{ 
                input: { 
                  endAdornment: ( 
                    <InputAdornment position="end"> 
                      <IconButton onClick={() => dispatch({ type: "toggleShowConfirmPass" })} size="small"> 
                        {showConfirmPass ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />} 
                      </IconButton> 
                    </InputAdornment> 
                  ), 
                }
              }} 
            />

            <TextField 
              fullWidth variant="outlined" size="small" className={classes.field} 
              label={<RequiredLabel label="Mã OTP" />} 
              value={otp} 
              onChange={(e) => handleInputChange("otp", e.target.value)} 
              onFocus={() => setShowToast(false)}
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
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

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
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