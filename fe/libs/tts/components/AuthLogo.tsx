"use client";
import React from "react";
import { Typography, Box } from "@mui/material";
import { VNA_COLORS, VNA_TYPOGRAPHY } from "@core/theme";

interface AuthLogoProps {
  title?: string;
  subTitle?: string;
  subTitleAlign?: "left" | "center" | "right";
}

export const AuthLogo: React.FC<AuthLogoProps> = ({ title, subTitle, subTitleAlign }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Box 
          component="img" 
          src="/static/mock-images/logo.png" 
          alt="Logo" 
          sx={{ width: 90, height: "auto" }} 
        />
      </Box>
      {title && (
        <Typography sx={{ 
          fontSize: VNA_TYPOGRAPHY.mainTitleSize, 
          fontWeight: 700, 
          textAlign: "center", 
          mb: 2, 
          lineHeight: 1.45, 
          color: VNA_COLORS.black 
        }}>
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
          sx={{ 
            width: "100%", 
            fontSize: VNA_TYPOGRAPHY.subTitleSize, 
            fontWeight: 700, 
            color: VNA_COLORS.primary, 
            mb: 2.5, 
            textTransform: "uppercase", 
            textAlign: subTitleAlign || "center" 
          }}
        >
          {subTitle}
        </Typography>
      )}
    </Box>
  );
};


