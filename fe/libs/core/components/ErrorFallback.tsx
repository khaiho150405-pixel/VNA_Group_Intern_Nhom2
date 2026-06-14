import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import { VNA_COLORS } from '@core/theme';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  icon: {
    fontSize: '64px',
    color: VNA_COLORS.error,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    color: VNA_COLORS.black,
  },
  message: {
    color: VNA_COLORS.gray,
    marginBottom: theme.spacing(3),
    maxWidth: '500px',
  },
  button: {
    backgroundColor: VNA_COLORS.primary,
    color: '#fff',
    fontWeight: 600,
    textTransform: 'none',
    padding: theme.spacing(1, 4),
    '&:hover': {
      backgroundColor: VNA_COLORS.primaryHover,
    },
  },
}));

interface ErrorFallbackProps {
  error?: Error;
  reset?: () => void;
  title?: string;
  message?: string;
}

/**
 * A standard, visually appealing UI component to display when an error occurs.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  reset, 
  title = "Đã có lỗi xảy ra", 
  message = "Hệ thống gặp sự cố bất ngờ. Vui lòng thử lại hoặc liên hệ quản trị viên." 
}) => {
  const classes = useStyles();

  return (
    <Container maxWidth="sm">
      <Box className={classes.root}>
        <Typography className={classes.icon}>⚠️</Typography>
        <Typography variant="h5" className={classes.title}>
          {title}
        </Typography>
        <Typography variant="body2" className={classes.message} component="div">
          {message}
          {error && process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#f8f8f8", textAlign: "left" }} style={{ overflowX: 'auto', fontSize: '12px', border: '1px solid #ddd' }}>
              <code>{error.message}</code>
            </Box>
          )}
        </Typography>
        {reset && (
          <Button variant="contained" className={classes.button} onClick={reset}>
            Thử lại
          </Button>
        )}
      </Box>
    </Container>
  );
};
