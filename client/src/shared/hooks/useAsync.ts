import { useState, useEffect, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

type AsyncFunction<T> = () => Promise<T>;

export function useAsync<T>(
  asyncFunction: AsyncFunction<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      });
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  const reset = useCallback(() => {
    setState({ data: null, loading: true, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}