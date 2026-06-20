"use client";

import { useSnackbar, VariantType } from 'notistack';
import { useCallback } from 'react';

/**
 * A hook that provides a consistent interface for showing notifications
 * across the application, using the project's established styling.
 */
export const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const notify = useCallback((message: string, variant: VariantType = 'info') => {
    enqueueSnackbar(message, { variant });
  }, [enqueueSnackbar]);

  const success = useCallback((message: string) => {
    notify(message, 'success');
  }, [notify]);

  const error = useCallback((message: string) => {
    notify(message, 'error');
  }, [notify]);

  const warning = useCallback((message: string) => {
    notify(message, 'warning');
  }, [notify]);

  const info = useCallback((message: string) => {
    notify(message, 'info');
  }, [notify]);

  return {
    success,
    error,
    warning,
    info,
    notify,
    close: closeSnackbar
  };
};
