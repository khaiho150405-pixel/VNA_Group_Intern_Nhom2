import { makeStyles } from "@material-ui/styles";
import { Theme } from "@material-ui/core/styles";

export const useLoginStyles = makeStyles((theme: Theme) => ({
  // --- ROOT WRAPPER: KHÓA CHẶT KHÔNG CHO CUỘN TRANG ---
  root: { 
    display: "flex", 
    width: "100vw",
    height: "100vh", 
    overflow: "hidden", 
    backgroundColor: "#ffffff",
    boxSizing: "border-box"
  },
  
  imageSection: { 
    flex: 1.2, 
    backgroundColor: "#ffffff",
    backgroundImage: "url('/static/mock-images/auth-bg.png')", 
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    height: "100%",
  },
  
  formSection: { 
    flex: 1, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    padding: theme.spacing(3),
    backgroundColor: "#ffffff",
    height: "100%",
  },
  
  card: {
    width: "100%",
    maxWidth: 470, 
    minWidth: 340,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: theme.spacing(4, 4),
    borderRadius: 12,
    boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.06)", 
    border: "1px solid #f5f5f5",
    boxSizing: "border-box",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    transition: "opacity 240ms ease-in-out, transform 240ms ease-in-out",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: theme.spacing(2),
  },
  logo: {
    width: 90,
    height: "auto",
  },
  mainTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: theme.spacing(2),
    lineHeight: 1.45,
    color: "#000000"
  },
  subTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#2f65f0", 
    marginBottom: theme.spacing(2.5),
    textTransform: "uppercase",
  },
  field: {
    marginBottom: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
    },
  },
  flexSpace: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: theme.spacing(2.5) 
  },
  checkboxLabel: { fontSize: "0.85rem", color: "#333333" },
  forgotLink: {
    color: "#2f65f0",
    fontSize: "0.85rem",
    textTransform: "none",
    fontWeight: "bold",
    padding: 0,
    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" }
  },
  loginBtn: {
    padding: theme.spacing(0.5),
    backgroundColor: "#2f65f0",
    color: "#fff",
    fontWeight: 600,
    borderRadius: 6,
    marginBottom: theme.spacing(2),
    textTransform: "none",
    fontSize: "0.95rem",
    "&:hover": { backgroundColor: "#1e4fd1" },
  },
  registerBtn: { 
    padding: theme.spacing(0.5), 
    fontWeight: 600, 
    borderRadius: 6, 
    textTransform: "none", 
    fontSize: "0.95rem",
    color: "#2f65f0",
    borderColor: "#2f65f0",
  },

  // --- STYLE CHO TOAST POP-UP LỖI MỚI ---
  toastContainer: {
    position: "fixed",
    top: "10vh", // Xuất hiện đúng 1/4 màn hình theo trục Y
    left: "50%",
    transform: "translateX(-50%)", // Căn giữa màn hình
    zIndex: 9999, // Đảm bảo luôn nằm trên cùng
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    border: "1px solid #ff453a",
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
    boxShadow: "0px 10px 40px rgba(255, 69, 58, 0.15)", // Đổ bóng nổi bật
    minWidth: 320,
    
    // Hiệu ứng mượt mà (smooth transition)
    opacity: 1,
    visibility: "visible",
    transition: "all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
  },
  toastHidden: {
    top: "5vh", // Rút lên trên một chút khi ẩn đi
    opacity: 0, // Mờ dần
    visibility: "hidden", // Ẩn khỏi DOM để không chặn thao tác chuột
  },
  errorText: {
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#ff453a",
    marginLeft: theme.spacing(1),
    flex: 1,
  },
  closeError: {
    color: "#ff453a",
    padding: 0,
    marginLeft: theme.spacing(1),
    "&:hover": { backgroundColor: "rgba(255, 69, 58, 0.1)" },
  },
}));