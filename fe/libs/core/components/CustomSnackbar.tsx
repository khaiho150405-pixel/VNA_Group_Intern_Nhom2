"use client";

import React, { forwardRef } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import ErrorIcon from '@mui/icons-material/ErrorOutlined';
import SuccessIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import WarningIcon from '@mui/icons-material/WarningAmberOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { CustomContentProps, useSnackbar } from 'notistack';
import { VNA_COLORS } from '@core/theme';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '@media (min-width:600px)': {
      minWidth: '320px !important',
    },
  },
  paper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff !important',
    borderRadius: '8px !important',
    padding: '12px 16px !important',
    boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1) !important',
    width: '100%',
    border: (props: any) => `1px solid ${props.color}`,
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  message: {
    fontSize: '0.875rem !important',
    fontWeight: '500 !important',
    color: (props: any) => `${props.color} !important`,
  },
  closeButton: {
    padding: '4px !important',
    marginLeft: '8px !important',
    color: (props: any) => `${props.color} !important`,
    '&:hover': {
      backgroundColor: (props: any) => `${props.lightColor} !important`,
    },
  },
}));

const CustomSnackbar = forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => {
  const { id, message, variant } = props;
  const { closeSnackbar } = useSnackbar();

  let Icon = InfoIcon;
  let color = VNA_COLORS.primary || '#2f65f0';
  let lightColor = 'rgba(47, 101, 240, 0.1)';

  switch (variant) {
    case 'success':
      Icon = SuccessIcon;
      color = VNA_COLORS.success || '#4caf50';
      lightColor = 'rgba(76, 175, 80, 0.1)';
      break;
    case 'error':
      Icon = ErrorIcon;
      color = VNA_COLORS.error || '#f44336';
      lightColor = 'rgba(244, 67, 54, 0.1)';
      break;
    case 'warning':
      Icon = WarningIcon;
      color = '#ff9800';
      lightColor = 'rgba(255, 152, 0, 0.1)';
      break;
  }

  const classes = useStyles({ color, lightColor });

  const handleClose = () => {
    closeSnackbar(id);
  };

  return (
    <Box ref={ref} className={classes.root}>
      <Paper className={classes.paper}>
        <Box className={classes.content}>
          <Icon fontSize="small" style={{ color }} />
          <Typography className={classes.message}>
            {message}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} className={classes.closeButton}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Box>
  );
});

CustomSnackbar.displayName = 'CustomSnackbar';

export default CustomSnackbar;
