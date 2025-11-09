// Shared components for the feature-based architecture

export {
  ErrorBoundary,
  FeatureErrorFallback,
  WidgetErrorFallback,
  InlineErrorFallback
} from './ErrorBoundary';
export { LazyWrapper } from './LazyWrapper';
export { LoadingSpinner } from './LoadingSpinner';
export { FeatureToggle } from './FeatureToggle';
export { withErrorBoundary } from './withErrorBoundary';