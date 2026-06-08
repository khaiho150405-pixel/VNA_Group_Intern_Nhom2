"use client";
import React from "react";
import { makeStyles } from "@material-ui/styles";
import { Theme } from "@mui/material/styles";
import { VNA_COLORS } from "@core/theme";

const useStyles = makeStyles((theme: Theme) => ({
  root: { 
    display: "flex", 
    width: "100vw",
    height: "100vh", 
    overflow: "hidden", 
    backgroundColor: VNA_COLORS.white,
    boxSizing: "border-box"
  },
  imageSection: { 
    flex: 1.2, 
    backgroundColor: VNA_COLORS.white,
    backgroundSize: "cover",
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
    backgroundColor: VNA_COLORS.white,
    height: "100%",
  },
  card: {
    width: "100%",
    maxWidth: 470, 
    minWidth: 340,
    display: "flex",
    flexDirection: "column",
    backgroundColor: VNA_COLORS.white,
    padding: theme.spacing(4, 4),
    borderRadius: 12,
    boxShadow: `0px 8px 30px ${VNA_COLORS.shadow}`, 
    border: `1px solid ${VNA_COLORS.border}`,
    boxSizing: "border-box",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    transition: "opacity 240ms ease-in-out, transform 240ms ease-in-out",
  },
}));

interface AuthLayoutProps {
  children: React.ReactNode;
  visible?: boolean;
  bgImage?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, visible = true, bgImage }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div 
        className={classes.imageSection} 
        style={{ backgroundImage: `url('${bgImage || '/static/mock-images/auth-bg.png'}')` }}
      />
      <div className={classes.formSection}>
        <div className={classes.card}>
          <div 
            className={classes.cardContent} 
            style={{ 
              opacity: visible ? 1 : 0, 
              transform: visible ? 'translateY(0)' : 'translateY(8px)' 
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
