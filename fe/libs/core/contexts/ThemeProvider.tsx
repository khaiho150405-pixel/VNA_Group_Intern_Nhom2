"use client";

import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StylesThemeProvider } from '@mui/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import CustomSnackbar from '@core/components/CustomSnackbar';

// Tạo một theme mặc định (bạn có thể custom màu sắc tại đây sau)
// Tạo một theme mặc định với style OutlinedInput đồng bộ toàn hệ thống
const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '& fieldset': {
            borderColor: '#dfe3eb',
          },
          '&:hover fieldset': {
            borderColor: '#bcc4d3',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#2f65f0',
          },
          '&.Mui-disabled fieldset': {
            borderColor: '#eef0f4',
          },
        },
      },
    },
  },
});

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
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          autoHideDuration={3000}
          Components={{
            success: CustomSnackbar,
            error: CustomSnackbar,
            warning: CustomSnackbar,
            info: CustomSnackbar,
          }}
        >
          {children}
        </SnackbarProvider>
      </MuiThemeProvider>
    </StylesThemeProvider>
  );
}
