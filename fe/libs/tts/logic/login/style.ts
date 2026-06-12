"use client";
import { VNA_COLORS } from "@core/theme";

export const loginSx = {
  field: {
    marginBottom: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: '6px',
    },
  },
  flexSpace: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 2.5 
  },
  checkboxLabel: { 
    fontSize: "0.85rem", 
    color: "#333333",
    display: "flex",
    alignItems: "center",
    userSelect: "none"
  },
  forgotLink: {
    color: VNA_COLORS.primary,
    fontSize: "0.85rem",
    textTransform: "none",
    fontWeight: "bold",
    padding: 0,
    "&:hover": { backgroundColor: "transparent", color: VNA_COLORS.primaryHover }
  },
  loginBtn: {
    paddingY: 0.5,
    backgroundColor: VNA_COLORS.primary,
    color: "#fff",
    fontWeight: 600,
    borderRadius: '6px',
    marginBottom: 2,
    textTransform: "none",
    fontSize: "0.95rem",
    "&:hover": { backgroundColor: VNA_COLORS.primaryHover },
  },
  registerBtn: { 
    paddingY: 0.5, 
    fontWeight: 600, 
    borderRadius: '6px', 
    textTransform: "none", 
    fontSize: "0.95rem",
    color: VNA_COLORS.primary,
    borderColor: VNA_COLORS.primary,
  },
};
