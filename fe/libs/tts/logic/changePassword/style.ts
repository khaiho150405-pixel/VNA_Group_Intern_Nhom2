import { makeStyles } from "@material-ui/styles";
import { Theme } from "@material-ui/core/styles";

export const useResetPasswordStyles = makeStyles((theme: Theme) => ({
  // --- LAYOUT CHỐNG CUỘN TRANG ---
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

  // --- CARD FORM ---
  card: {
    width: "100%",
    maxWidth: 420, 
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
  subTitle: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#2f65f0", 
    marginBottom: theme.spacing(2),
    textTransform: "uppercase",
  },
  field: {
    marginBottom: theme.spacing(2),
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
    },
  },
  forgotLink: {
    color: "#2f65f0",
    fontSize: "0.85rem",
    textTransform: "none",
    fontWeight: 500,
    padding: 0,
    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" }
  },
  loginBtn: {
    padding: theme.spacing(1.2),
    backgroundColor: "#2f65f0",
    color: "#fff",
    fontWeight: 600,
    borderRadius: 6,
    textTransform: "none",
    fontSize: "0.95rem",
    "&:hover": { backgroundColor: "#1e4fd1" },
  },

  // --- STYLE CHO TOAST POP-UP (THÀNH CÔNG & LỖI) ---
  toastContainer: {
    position: "fixed",
    top: "10vh", 
    left: "50%",
    transform: "translateX(-50%)", 
    zIndex: 9999, 
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
    minWidth: 320,
    opacity: 1,
    visibility: "visible",
    transition: "all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
  },
  toastHidden: {
    top: "15vh", 
    opacity: 0, 
    visibility: "hidden", 
  },
  toastError: {
    backgroundColor: "#fbecec",
    border: "1px solid #ff453a",
    boxShadow: "0px 10px 40px rgba(255, 69, 58, 0.15)",
  },
  toastSuccess: {
    backgroundColor: "#eefaf1",
    border: "1px solid #34c759",
    boxShadow: "0px 10px 40px rgba(52, 199, 89, 0.15)",
  },
  toastText: {
    fontSize: "0.85rem",
    fontWeight: 500,
    marginLeft: theme.spacing(1),
    flex: 1,
  },
}));