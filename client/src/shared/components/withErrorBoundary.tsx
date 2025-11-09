import { ComponentType } from 'react';
import { ErrorBoundary, FeatureErrorFallback } from './ErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';

interface WithErrorBoundaryOptions {
  featureName: string;
  queryKey?: string[];
  onError?: (error: Error, errorInfo: any) => void;
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * and provides automatic query invalidation on reset
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions
) {
  const WrappedComponent = (props: P) => {
    const queryClient = useQueryClient();

    const handleReset = () => {
      // Invalidate queries if queryKey is provided
      if (options.queryKey) {
        queryClient.invalidateQueries({ queryKey: options.queryKey });
      }

      // Reload the page as a last resort
      window.location.reload();
    };

    return (
      <ErrorBoundary
        fallback={<FeatureErrorFallback feature={options.featureName} onReset={handleReset} />}
        onReset={handleReset}
        onError={options.onError}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}
