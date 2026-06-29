"use client";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";

export const useEnterpriseFormStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  stepperWrapper: {
    backgroundColor: "#fff",
    padding: theme.spacing(2.5, 3),
    borderBottom: "1px solid #eef0f4",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0px 2px 12px rgba(0, 0, 0, 0.04)",
  },
  stepper: {
    maxWidth: 500,
    margin: "0 auto",
    display: "flex",
    justifyContent: "center",
    "& .MuiStep-root": {
      flex: "0 0 auto",
      padding: 0,
      display: "flex",
      alignItems: "center",
    },
    "& .MuiStep-root:last-child": {
      "&::after": {
        content: '""',
        width: 80,
        borderTop: "1px dashed #cbd5e1",
        marginLeft: theme.spacing(1.5),
      },
    },
    "& .MuiStepConnector-root": {
      flex: "0 0 40px",
      minWidth: 40,
      maxWidth: 40,
      top: 14,
      left: "calc(-50% + 24px)",
      right: "calc(50% + 24px)",
    },
    "& .MuiStepLabel-root": {
      padding: 0,
    },
    "& .MuiStepLabel-iconContainer": {
      paddingRight: theme.spacing(1.25),
    },
    "& .MuiStepLabel-label": {
      fontSize: "0.95rem",
      color: "#9ca3af",
      fontWeight: 500,
      marginTop: 0,
    },
    "& .MuiStepLabel-label.Mui-active": {
      color: "#1f2937",
      fontWeight: 600,
    },
    "& .MuiStepLabel-label.Mui-completed": {
      color: "#1f2937",
      fontWeight: 500,
    },
    "& .MuiStepConnector-line": {
      borderTopStyle: "dashed",
      borderTopWidth: 1.5,
      borderColor: "#cbd5e1",
    },
    "& .MuiStepIcon-root": {
      width: 28,
      height: 28,
      color: "#cbd5e1",
    },
    "& .MuiStepIcon-root.Mui-active": {
      color: "#2f65f0",
    },
    "& .MuiStepIcon-root.Mui-completed": {
      color: "#2f65f0",
    },
    "& .MuiStepIcon-text": {
      fontWeight: 600,
      fontSize: "0.85rem",
    },
  },
  content: {
    padding: theme.spacing(3, 3, 4, 3),
    flex: 1,
    backgroundColor: "#ffffff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: theme.spacing(2.5, 3),
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.02)",
    border: "1px solid #eef0f4",
    marginBottom: theme.spacing(2.5),
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#111827",
    marginBottom: theme.spacing(2),
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: theme.spacing(2.5),
    "@media (max-width: 900px)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (max-width: 600px)": {
      gridTemplateColumns: "1fr",
    },
  },
  fileSection: {
    marginTop: theme.spacing(1.5),
  },
  fileSubtitle: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#111827",
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
  },
  fileTitle: {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#111827",
    marginBottom: theme.spacing(1.5),
  },
  field: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
      backgroundColor: "#fff",
      fontSize: "0.875rem",
      "& fieldset": { borderColor: "#dfe3eb" },
      "&:hover fieldset": { borderColor: "#bcc4d3" },
      "&.Mui-focused fieldset": { borderColor: "#2f65f0", borderWidth: 1 },
      "&.Mui-disabled": { backgroundColor: "#f8f9fb" },
    },
    "& .MuiOutlinedInput-input": {
      padding: "10px 12px",
      fontSize: "0.875rem",
      color: "#1f2937",
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.875rem",
      color: "#9ca3af",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#2f65f0",
    },
    "& .MuiInputLabel-asterisk": {
      color: "#ef4444",
    },
    "& .MuiFormHelperText-root": {
      fontSize: "0.75rem",
      marginLeft: 4,
    },
  },
  footer: {
    backgroundColor: "#fff",
    padding: theme.spacing(1.5, 5),
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1),
    position: "sticky",
    bottom: 0,
    zIndex: 10,
    borderTop: "1px solid #eef0f4",
    boxShadow: "0px -2px 12px rgba(0, 0, 0, 0.04)",
  },
  cancelBtn: {
    textTransform: "none",
    color: "#666",
    fontSize: "0.875rem",
    borderRadius: 6,
    padding: theme.spacing(0.6, 2.25),
    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.03)",
    transition: "all 0.2s ease-in-out",
    "&:hover": { backgroundColor: "#f5f5f7", color: "#333", boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.06)" },
  },
  primaryBtn: {
    backgroundColor: "#2f65f0",
    color: "#fff",
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    padding: theme.spacing(0.6, 2.5),
    borderRadius: 6,
    boxShadow: "0px 4px 12px rgba(47, 101, 240, 0.2)",
    transition: "all 0.2s ease-in-out",
    "&:hover": { backgroundColor: "#1e4fd1", boxShadow: "0px 8px 20px rgba(47, 101, 240, 0.35)" },
    "&.Mui-disabled": { color: "#fff", backgroundColor: "#94a3b8" },
  },
  summaryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    gap: theme.spacing(2),
    padding: theme.spacing(0.75, 0),
    fontSize: "0.875rem",
  },
  summaryLabel: {
    color: "#111827",
    fontWeight: 700,
  },
  summaryValue: {
    color: "#111827",
    fontWeight: 500,
  },
}));