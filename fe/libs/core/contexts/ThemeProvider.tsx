"use client";

import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
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
    <MuiThemeProvider theme={theme}>
      <CssBaseline /> {/* Reset CSS chuẩn của MUI */}
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        {children}
      </SnackbarProvider>
    </MuiThemeProvider>
  );
}