'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@core/components/ErrorFallback';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return <ErrorFallback error={error} reset={reset} />;
}

