"use client";
import { makeStyles } from "@material-ui/styles";
import { Theme } from "@mui/material/styles";

export const useResetPasswordStyles = makeStyles((theme: Theme) => ({
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
}));