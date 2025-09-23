import React from 'react';

interface FeatureToggleProps {
  feature: string;
  enabled?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Simple feature toggle component for progressive rollouts
export const FeatureToggle: React.FC<FeatureToggleProps> = ({
  feature,
  enabled = true,
  children,
  fallback = null,
}) => {
  // In a real implementation, this would check against feature flags
  // from a feature flag service or environment variables
  const isFeatureEnabled = enabled;

  return isFeatureEnabled ? <>{children}</> : <>{fallback}</>;
};