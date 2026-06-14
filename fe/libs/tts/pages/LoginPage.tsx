"use client";
import React from "react";
import { Box, TextField, Button, Checkbox, InputAdornment, IconButton, Typography, Collapse } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import { useRouter } from "next/navigation";
import { loginSx } from "@tts/logic/login/style";
import { AuthLogo } from "@tts/components/AuthLogo";
import { AppToast } from "@tts/components/AppToast";
import { AuthLayout } from "@core/layouts/AuthLayout";
import { useLogin } from "@tts/hooks/useLogin";
import { RequiredLabel } from "@core/components/RequiredLabel";
import { VNA_COLORS } from "@core/theme";

export const LoginPage = () => {
  const router = useRouter();
  const {
    state,
    dispatch,
    visible,
    showToast,
    setShowToast,
    handleInputChange,
    handleLoginSubmit
  } = useLogin();

  const { userName, password, isShow, isMemory, errorMessage, successMessage } = state;

  return (
    <>
      <AuthLayout visible={visible}>
        <AuthLogo
          title="Phần Mềm Quản Lý - Tạo Lập Cơ Sở Dữ Liệu<br/>An Toàn Vệ Sinh Lao Động"
          subTitle="Đăng nhập"
          subTitleAlign="left"
        />

        <form
          onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(); }}
          suppressHydrationWarning
        >
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

          <TextField
            id="login-username"
            fullWidth
            variant="outlined"
            size="small"
            sx={loginSx.field}
            label={<RequiredLabel label="Tên tài khoản" />}
            name="username"
            value={userName}
            onChange={(e) => handleInputChange("userName", e.target.value)}
            onFocus={() => setShowToast(false)}
            autoComplete="username"
            slotProps={{
              htmlInput: {
                suppressHydrationWarning: true
              }
            }}
          />

          <TextField
            id="login-password"
            fullWidth
            variant="outlined"
            size="small"
            sx={loginSx.field}
            type={isShow ? "text" : "password"}
            label={<RequiredLabel label="Mật khẩu" />}
            name="password"
            value={password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            onFocus={() => setShowToast(false)}
            autoComplete="current-password"
            slotProps={{
              htmlInput: {
                suppressHydrationWarning: true
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => dispatch({ type: "showPassword" })}
                      size="small"
                      suppressHydrationWarning
                    >
                      {isShow ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
          />

          <Box sx={loginSx.flexSpace}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                id="remember-me"
                checked={isMemory}
                onChange={(e) => handleInputChange("isMemory", e.target.checked)}
                color="primary"
                size="small"
                style={{ padding: 4 }}
                suppressHydrationWarning
              />
              <Typography
                component="label"
                htmlFor="remember-me"
                sx={loginSx.checkboxLabel}
                style={{ cursor: 'pointer', userSelect: 'none', lineHeight: 1 }}
              >
                Nhớ đăng nhập
              </Typography>
            </Box>

            <Button
              id="forgot-password-btn"
              disableRipple
              sx={loginSx.forgotLink}
              style={{ textDecoration: 'none' }}
              onClick={() => router.push('/forgot-password')}
              suppressHydrationWarning
            >
              Quên mật khẩu
            </Button>
          </Box>

          <Button
            id="login-btn"
            fullWidth
            variant="contained"
            disableElevation
            sx={loginSx.loginBtn}
            type="submit"
            suppressHydrationWarning
          >
            Đăng nhập
          </Button>
        </form>
        <Button
          id="register-btn"
          fullWidth
          variant="outlined"
          sx={loginSx.registerBtn}
          suppressHydrationWarning
        >
          Đăng ký tài khoản doanh nghiệp
        </Button>
      </AuthLayout>
    </>
  );
};