"use client";
import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ErrorOutlinedIcon from "@material-ui/icons/ErrorOutlined";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import CloseIcon from "@material-ui/icons/Close";
import { makeStyles } from "@material-ui/styles";
import { Theme } from "@mui/material/styles";
import { VNA_COLORS } from "@core/theme";

const useStyles = makeStyles((theme: Theme) => ({
  toastContainer: {
    position: "fixed",
    top: "10vh",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: VNA_COLORS.white,
    border: (props: any) => `1px solid ${props.isError ? VNA_COLORS.error : VNA_COLORS.success}`,
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
    boxShadow: (props: any) => `0px 10px 40px ${props.isError ? "rgba(255, 69, 58, 0.15)" : "rgba(52, 199, 89, 0.15)"}`,
    minWidth: 320,
    opacity: 1,
    visibility: "visible",
    transition: "all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
  },
  toastHidden: {
    top: "0vh",
    opacity: 0,
    visibility: "hidden",
  },
  toastText: {
    fontSize: "0.85rem",
    fontWeight: 500,
    marginLeft: theme.spacing(1),
    flex: 1,
    color: (props: any) => props.isError ? VNA_COLORS.error : VNA_COLORS.success,
  },
  closeBtn: {
    padding: 0,
    marginLeft: theme.spacing(1),
    color: (props: any) => props.isError ? VNA_COLORS.error : VNA_COLORS.success,
    "&:hover": { backgroundColor: (props: any) => props.isError ? VNA_COLORS.errorLight : VNA_COLORS.successLight },
  },
}));

interface AppToastProps {
  show: boolean;
  message: string | null;
  type?: "error" | "success";
  onClose: () => void;
}

export const AppToast: React.FC<AppToastProps> = ({ show, message, type = "error", onClose }) => {
  const isError = type === "error";
  const classes = useStyles({ isError });

  if (!message) return null;

  return (
    <div className={`${classes.toastContainer} ${!show ? classes.toastHidden : ""}`}>
      <Box display="flex" alignItems="center">
        {isError ? (
          <ErrorOutlinedIcon fontSize="small" style={{ color: VNA_COLORS.error }} />
        ) : (
          <CheckCircleOutlineIcon fontSize="small" style={{ color: VNA_COLORS.success }} />
        )}
        <Typography className={classes.toastText}>{message}</Typography>
      </Box>
      <IconButton className={classes.closeBtn} size="small" onClick={onClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  );
};
