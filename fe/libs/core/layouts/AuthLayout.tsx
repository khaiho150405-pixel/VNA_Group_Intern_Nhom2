"use client";
import React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { VNA_COLORS } from "@core/theme";

const RootContainer = styled(Box)({
  display: "flex", 
  width: "100vw",
  height: "100vh", 
  overflow: "hidden", 
  backgroundColor: VNA_COLORS.white,
  boxSizing: "border-box"
});

const ImageSection = styled(Box)({
  flex: 1.2, 
  backgroundColor: VNA_COLORS.white,
  backgroundSize: "cover",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  height: "100%",
});

const FormSection = styled(Box)(({ theme }) => ({
  flex: 1, 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center",
  padding: theme.spacing(3),
  backgroundColor: VNA_COLORS.white,
  height: "100%",
}));

const Card = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 470, 
  minWidth: 340,
  display: "flex",
  flexDirection: "column",
  backgroundColor: VNA_COLORS.white,
  padding: theme.spacing(4, 4),
  borderRadius: 12,
  boxShadow: '0px 20px 50px rgba(0, 0, 0, 0.04), 0px 4px 16px rgba(0, 0, 0, 0.02)', 
  border: `1px solid ${VNA_COLORS.border}`,
  boxSizing: "border-box",
}));

const CardContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  transition: "opacity 240ms ease-in-out, transform 240ms ease-in-out",
});

interface AuthLayoutProps {
  children: React.ReactNode;
  visible?: boolean;
  bgImage?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, visible = true, bgImage }) => {
  return (
    <RootContainer>
      <ImageSection 
        style={{ backgroundImage: `url('${bgImage || '/static/mock-images/auth-bg.png'}')` }}
      />
      <FormSection>
        <Card>
          <CardContent 
            sx={{ 
              opacity: visible ? 1 : 0, 
              transform: visible ? 'translateY(0)' : 'translateY(8px)' 
            }}
          >
            {children}
          </CardContent>
        </Card>
      </FormSection>
    </RootContainer>
  );
};


