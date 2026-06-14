'use client';

import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider as StylesThemeProvider, StylesProvider, createGenerateClassName } from '@mui/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheets } from '@mui/styles';

const theme = createTheme();

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
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
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
