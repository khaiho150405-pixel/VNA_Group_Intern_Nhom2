"use client";
import React, { useReducer, useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Checkbox, InputAdornment, IconButton } from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import ErrorOutlinedIcon from "@material-ui/icons/ErrorOutlined";
import CloseIcon from "@material-ui/icons/Close";
import { useRouter } from "next/navigation";
import { loginReducer, initialLoginState } from "@tts/logic/login/reducer";
import { useLoginStyles } from "@tts/logic/login/style";

// --- CƠ SỞ DỮ LIỆU GIẢ LẬP ĐỂ TEST NGHIỆP VỤ ---
export const MOCK_USERS = [
  {
    username: "phatAdmin",         
    password: "123",              
    email: "phatnuyen0802@gmail.com",
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

export const LoginPage = () => {
  const classes = useLoginStyles();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [state, dispatch] = useReducer(loginReducer, initialLoginState);
  
  const [showToast, setShowToast] = useState(false);
  const { userName, password, isShow, isMemory, errorMessage } = state as any;

  // 1. SỬA LẠI USEEFFECT: Chỉ dùng để đếm 3 giây tự động tắt
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  // 2. SỬA LẠI HÀM SUBMIT: Chủ động bật tắt Toast tại đây
  const handleLoginSubmit = () => {
    // 1. Tắt Toast cũ (nếu có)
    setShowToast(false);
    
    setTimeout(() => {
      // 2. Validate trống
      if (!userName || !password) {
        dispatch({ type: "setError", message: "Vui lòng nhập đầy đủ thông tin" });
        setShowToast(true);
        return;
      }
      
      // 3. Truy vấn Mock DB kiểm tra thông tin
      const validUser = MOCK_USERS.find(
        (u) => u.username === userName && u.password === password
      );

      if (!validUser) {
         dispatch({ type: "setError", message: "Tài khoản hoặc mật khẩu không đúng. Xin vui lòng thử lại" });
         setShowToast(true);
         return;
      }

      // 4. TEST NGHIỆP VỤ: Đăng nhập thành công
      // Lưu tạm role vào LocalStorage để các trang khác biết là ai đang đăng nhập
      localStorage.setItem("userRole", validUser.role);
      localStorage.setItem("userName", validUser.displayName);

      // (Tùy chọn) - Nếu bạn đã cài đặt Toast Success bên login thì hiển thị, 
      // ở đây mình reset form và chuyển trang luôn theo logic cũ
      dispatch({ type: "reset" });
      
      // Console log để bạn dễ debug theo dõi quyền
      console.log(`Đăng nhập thành công! Quyền: ${validUser.role} - Tên: ${validUser.displayName}`);
      
      router.push("/"); 
    }, 50);
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={classes.root}>
      {/* --- TOAST THÔNG BÁO LỖI NỔI LÊN TRÊN --- */}
      <div className={`${classes.toastContainer} ${!showToast ? classes.toastHidden : ""}`}>
        <Box display="flex" alignItems="center">
          <ErrorOutlinedIcon fontSize="small" style={{ color: "#ff453a" }} />
          <Typography className={classes.errorText}>{errorMessage}</Typography>
        </Box>
        <IconButton 
          className={classes.closeError} 
          size="small" 
          onClick={() => setShowToast(false)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* CỘT TRÁI */}
      <div className={classes.imageSection} />

      {/* CỘT PHẢI */}
      <div className={classes.formSection}>
        <div className={classes.card}>
          <div 
            className={classes.cardContent} 
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)' }}
          >
            <div className={classes.logoContainer}>
              <img src="/static/mock-images/logo.png" alt="Logo" className={classes.logo} />
            </div>
            
            <Typography className={classes.mainTitle}>
              Phần Mềm Quản Lý - Tạo Lập Cơ Sở Dữ Liệu<br/>
              An Toàn Vệ Sinh Lao Động
            </Typography>

            <Typography className={classes.subTitle}>Đăng nhập</Typography>

            <TextField
              fullWidth variant="outlined" size="small" className={classes.field} label="Tên tài khoản *"
              value={userName} onChange={(e) => dispatch({ type: "onChange", name: "userName", value: e.target.value })}
            />

            <TextField
              fullWidth variant="outlined" size="small" className={classes.field} type={isShow ? "text" : "password"} label="Mật khẩu *"
              value={password} onChange={(e) => dispatch({ type: "onChange", name: "password", value: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => dispatch({ type: "showPassword" })} size="small">
                      {isShow ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box className={classes.flexSpace}>
              <Box display="flex" alignItems="center">
                <Checkbox checked={isMemory} onChange={(e) => dispatch({ type: "onChange", name: "isMemory", value: e.target.checked })} color="primary" size="small" style={{ padding: 4 }} />
                <Typography className={classes.checkboxLabel}>Nhớ đăng nhập</Typography>
              </Box>
              
              <Button disableRipple className={classes.forgotLink} style={{ textDecoration: 'none' }} onClick={() => router.push('/forgot-password')}>
                Quên mật khẩu
              </Button>
            </Box>

            <Button fullWidth variant="contained" disableElevation className={classes.loginBtn} onClick={handleLoginSubmit}>
              Đăng nhập
            </Button>
            <Button fullWidth variant="outlined" className={classes.registerBtn}>
              Đăng ký tài khoản doanh nghiệp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};