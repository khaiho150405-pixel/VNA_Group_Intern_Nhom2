"use client";
import React from "react";
import { Box, TextField, Button, Checkbox, InputAdornment, IconButton, Typography } from "@mui/material";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { useRouter } from "next/navigation";
import { useLoginStyles } from "@tts/logic/login/style";
import { AuthLogo } from "@tts/components/AuthLogo";
import { AppToast } from "@tts/components/AppToast";
import { AuthLayout } from "@core/layouts/AuthLayout";
import { useLogin } from "@tts/hooks/useLogin";

export const LoginPage = () => {
  const classes = useLoginStyles();
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

  const { userName, password, isShow, isMemory, errorMessage } = state;

  return (
    <>
      <AppToast 
        show={showToast} 
        message={errorMessage} 
        type="error" 
        onClose={() => setShowToast(false)} 
      />

      <AuthLayout visible={visible}>
        <AuthLogo 
          title="Phần Mềm Quản Lý - Tạo Lập Cơ Sở Dữ Liệu<br/>An Toàn Vệ Sinh Lao Động"
          subTitle="Đăng nhập"
          subTitleAlign="left"
        />

        <form onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(); }}>
          <TextField
            fullWidth 
            variant="outlined" 
            size="small" 
            className={classes.field} 
            label="Tên tài khoản *"
            name="username"
            value={userName} 
            onChange={(e) => handleInputChange("userName", e.target.value)}
            autoComplete="username"
            inputProps={{ suppressHydrationWarning: true }}
          />

          <TextField
            fullWidth 
            variant="outlined" 
            size="small" 
            className={classes.field} 
            type={isShow ? "text" : "password"} 
            label="Mật khẩu *"
            name="password"
            value={password} 
            onChange={(e) => handleInputChange("password", e.target.value)}
            autoComplete="current-password"
            inputProps={{ suppressHydrationWarning: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => dispatch({ type: "showPassword" })} size="small" suppressHydrationWarning>
                    {isShow ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box className={classes.flexSpace}>
            <Box display="flex" alignItems="center">
              <Checkbox 
                id="remember-me"
                checked={isMemory} 
                onChange={(e) => handleInputChange("isMemory", e.target.checked)} 
                color="primary" 
                size="small" 
                style={{ padding: 4 }} 
              />
              <Typography 
                component="label" 
                htmlFor="remember-me" 
                className={classes.checkboxLabel}
                style={{ cursor: 'pointer', userSelect: 'none', lineHeight: 1 }}
              >
                Nhớ đăng nhập
              </Typography>
            </Box>
            
            <Button 
              disableRipple 
              className={classes.forgotLink} 
              style={{ textDecoration: 'none' }} 
              onClick={() => router.push('/forgot-password')} 
              suppressHydrationWarning
            >
              Quên mật khẩu
            </Button>
          </Box>

          <Button 
            fullWidth 
            variant="contained" 
            disableElevation 
            className={classes.loginBtn} 
            type="submit"
            suppressHydrationWarning
          >
            Đăng nhập
          </Button>
        </form>
        <Button 
          fullWidth 
          variant="outlined" 
          className={classes.registerBtn} 
          suppressHydrationWarning
        >
          Đăng ký tài khoản doanh nghiệp
        </Button>
      </AuthLayout>
    </>
  );
};
