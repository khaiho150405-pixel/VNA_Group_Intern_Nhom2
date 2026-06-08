'use client';

import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StylesThemeProvider } from '@material-ui/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheets } from '@material-ui/styles';

const theme = createTheme();

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [sheets] = React.useState(() => new ServerStyleSheets());

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
    <StylesThemeProvider theme={theme}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          {children}
        </SnackbarProvider>
      </MuiThemeProvider>
    </StylesThemeProvider>
  );
}
