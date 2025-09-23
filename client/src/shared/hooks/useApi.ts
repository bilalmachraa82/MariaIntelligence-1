import { useState, useCallback } from 'react';
import { ApiResponse } from '../types';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();

      if (response.success) {
        setState({ data: response.data, loading: false, error: null });
        options.onSuccess?.(response.data);
      } else {
        const error = new Error(response.message || 'API call failed');
        setState({ data: null, loading: false, error });
        options.onError?.(error);
      }
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: apiError });
      options.onError?.(apiError);
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}