"use client";
import React from "react";
import { Typography, Box } from "@mui/material";
import { makeStyles } from "@material-ui/styles";
import { Theme } from "@mui/material/styles";
import { VNA_COLORS, VNA_TYPOGRAPHY } from "@core/theme";

const useStyles = makeStyles((theme: Theme) => ({
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
    fontSize: VNA_TYPOGRAPHY.mainTitleSize,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: theme.spacing(2),
    lineHeight: 1.45,
    color: VNA_COLORS.black
  },
  subTitle: {
    width: "100%",
    fontSize: VNA_TYPOGRAPHY.subTitleSize,
    fontWeight: 700,
    color: VNA_COLORS.primary, 
    marginBottom: theme.spacing(2.5),
    textTransform: "uppercase",
    textAlign: "center",
  },
}));

interface AuthLogoProps {
  title?: string;
  subTitle?: string;
  subTitleAlign?: "left" | "center" | "right";
}

export const AuthLogo: React.FC<AuthLogoProps> = ({ title, subTitle, subTitleAlign }) => {
  const classes = useStyles();
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <div className={classes.logoContainer}>
        <img src="/static/mock-images/logo.png" alt="Logo" className={classes.logo} />
      </div>
      {title && (
        <Typography className={classes.mainTitle}>
          {title.split('<br/>').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < title.split('<br/>').length - 1 && <br />}
            </React.Fragment>
          ))}
        </Typography>
      )}
      {subTitle && (
        <Typography 
          className={classes.subTitle} 
          style={subTitleAlign ? { textAlign: subTitleAlign } : {}}
        >
          {subTitle}
        </Typography>
      )}
    </Box>
  );
};
