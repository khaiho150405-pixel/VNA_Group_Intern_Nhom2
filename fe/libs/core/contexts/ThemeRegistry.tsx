'use client';

import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StylesThemeProvider, StylesProvider, createGenerateClassName } from '@mui/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import CustomSnackbar from '@core/components/CustomSnackbar';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheets } from '@mui/styles';

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

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [sheets] = React.useState(() => new ServerStyleSheets());
  const [generateClassName] = React.useState(() => createGenerateClassName({
    seed: 'vna',
  }));

  useServerInsertedHTML(() => {
    // Thu thập JSS styles từ makeStyles
    const jssStyles = sheets.getStyleElement();
    return (
      <>
        {jssStyles}
      </>
    );
  });

  return (
    <StylesProvider generateClassName={generateClassName}>
      <StylesThemeProvider theme={theme}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
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
            {sheets.collect(
              <>
                {children}
              </>
            )}
          </SnackbarProvider>
        </MuiThemeProvider>
      </StylesThemeProvider>
    </StylesProvider>
  );
}
