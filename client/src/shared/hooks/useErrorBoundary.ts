import { useState, useCallback } from 'react';

interface ErrorInfo {
  componentStack: string;
}

export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error captured by error boundary:', error, errorInfo);
    setError(error);
  }, []);

  return {
    error,
    resetError,
    captureError,
    hasError: error !== null,
  };
}