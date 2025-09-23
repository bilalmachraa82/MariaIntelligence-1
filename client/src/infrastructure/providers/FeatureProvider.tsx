import React, { createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

interface FeatureContextValue {
  queryClient: QueryClient;
  apiBaseUrl: string;
  featureFlags: Record<string, boolean>;
}

const FeatureContext = createContext<FeatureContextValue | null>(null);

interface FeatureProviderProps {
  children: ReactNode;
  queryClient: QueryClient;
  apiBaseUrl?: string;
  featureFlags?: Record<string, boolean>;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({
  children,
  queryClient,
  apiBaseUrl = '/api',
  featureFlags = {},
}) => {
  const value: FeatureContextValue = {
    queryClient,
    apiBaseUrl,
    featureFlags,
  };

  return (
    <FeatureContext.Provider value={value}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Feature Provider Error:', error, errorInfo);
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ErrorBoundary>
    </FeatureContext.Provider>
  );
};

export const useFeatureContext = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatureContext must be used within a FeatureProvider');
  }
  return context;
};

export const useFeatureFlag = (flagName: string): boolean => {
  const { featureFlags } = useFeatureContext();
  return featureFlags[flagName] ?? false;
};