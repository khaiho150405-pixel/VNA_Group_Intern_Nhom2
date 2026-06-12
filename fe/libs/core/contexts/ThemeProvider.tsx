"use client";

import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StylesThemeProvider } from '@mui/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// Tạo một theme mặc định (bạn có thể custom màu sắc tại đây sau)
const theme = createTheme();

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // useEffect này giúp fix lỗi mismatch giữa Server và Client khi render MUI
  React.useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles && jssStyles.parentElement) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <StylesThemeProvider theme={theme}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Reset CSS chuẩn của MUI */}
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          {children}
        </SnackbarProvider>
      </MuiThemeProvider>
    </StylesThemeProvider>
  );
}
