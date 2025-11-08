# Error Boundary Implementation Guide

This guide covers the comprehensive error boundary implementation in MariaIntelligence.

## Overview

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of the component tree that crashed.

## Components Available

### 1. ErrorBoundary (Main Component)

The main error boundary class component that wraps children and catches errors.

**Location**: `/client/src/shared/components/ErrorBoundary.tsx`

**Props**:
- `children: ReactNode` - The components to wrap
- `fallback?: ReactNode` - Custom fallback UI (optional)
- `onReset?: () => void` - Callback when user clicks reset (optional)
- `onError?: (error: Error, errorInfo: any) => void` - Error logging callback (optional)

**Features**:
- Catches all errors in child component tree
- Shows full-screen error UI with retry and home buttons
- Displays error details in development mode
- Supports custom error logging (for Sentry, etc.)

### 2. FeatureErrorFallback

Specialized fallback UI for feature pages (Properties, Reservations, etc.).

**Props**:
- `feature: string` - Name of the feature (e.g., "Propriedades", "Reservas")
- `onReset?: () => void` - Reset callback

**Usage**:
```tsx
<ErrorBoundary fallback={<FeatureErrorFallback feature="Propriedades" />}>
  <PropertiesList />
</ErrorBoundary>
```

### 3. WidgetErrorFallback

Compact error fallback for dashboard widgets and cards.

**Props**:
- `widget: string` - Name of the widget
- `onReset?: () => void` - Reset callback

**Usage**:
```tsx
<ErrorBoundary fallback={<WidgetErrorFallback widget="Estatísticas" />}>
  <StatsWidget />
</ErrorBoundary>
```

### 4. InlineErrorFallback

Small inline error message for minor components.

**Props**:
- `message?: string` - Custom error message
- `onReset?: () => void` - Reset callback

**Usage**:
```tsx
<ErrorBoundary fallback={<InlineErrorFallback message="Erro ao carregar dados" />}>
  <SmallComponent />
</ErrorBoundary>
```

### 5. withErrorBoundary (HOC)

Higher-order component for easy error boundary wrapping with query invalidation.

**Props**:
- `Component: ComponentType` - The component to wrap
- `options: { featureName, queryKey?, onError? }` - Configuration

**Usage**:
```tsx
const SafePropertiesPage = withErrorBoundary(PropertiesPage, {
  featureName: 'Propriedades',
  queryKey: ['properties'],
});
```

## Integration Points

### 1. App-Level (Highest Priority)

**File**: `/client/src/App.tsx`

Wraps the entire application to catch critical errors:

```tsx
function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
        // Send to error tracking service
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Router />
        </Layout>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 2. LazyWrapper (Route-Level)

**File**: `/client/src/shared/components/LazyWrapper.tsx`

Already includes ErrorBoundary for lazy-loaded routes:

```tsx
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <DefaultFallback />,
  errorFallback,
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};
```

### 3. Feature Pages

**Files**:
- `/client/src/pages/properties/index.tsx` ✅ Implemented
- `/client/src/pages/reservations/index.tsx` ✅ Implemented

Pattern:

```tsx
import { ErrorBoundary, FeatureErrorFallback } from '@/shared/components/ErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';

function PropertiesPageContent() {
  // Main component logic
}

export default function PropertiesPage() {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallback={
        <FeatureErrorFallback
          feature="Propriedades"
          onReset={() => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            window.location.reload();
          }}
        />
      }
    >
      <PropertiesPageContent />
    </ErrorBoundary>
  );
}
```

### 4. Dashboard Widgets (Recommended)

For critical dashboard widgets:

```tsx
import { ErrorBoundary, WidgetErrorFallback } from '@/shared/components/ErrorBoundary';

export function StatsWidget() {
  return (
    <ErrorBoundary fallback={<WidgetErrorFallback widget="Estatísticas" />}>
      <StatsContent />
    </ErrorBoundary>
  );
}
```

### 5. Small Components (Optional)

For minor components where full error UI would be excessive:

```tsx
import { ErrorBoundary, InlineErrorFallback } from '@/shared/components/ErrorBoundary';

export function SmallDataDisplay() {
  return (
    <ErrorBoundary
      fallback={<InlineErrorFallback message="Erro ao carregar" />}
    >
      <DataContent />
    </ErrorBoundary>
  );
}
```

## Best Practices

### 1. Granularity

- **App-Level**: Catch catastrophic errors
- **Route-Level**: Already handled by LazyWrapper
- **Feature-Level**: Wrap each major feature page
- **Widget-Level**: Wrap critical dashboard widgets
- **Component-Level**: Use sparingly for particularly error-prone components

### 2. Query Invalidation

Always invalidate relevant queries on reset to ensure fresh data:

```tsx
<ErrorBoundary
  onReset={() => {
    queryClient.invalidateQueries({ queryKey: ['myData'] });
    window.location.reload();
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### 3. Error Logging

Use the `onError` prop to log errors to monitoring services:

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Example with Sentry
    // Sentry.captureException(error, { extra: errorInfo });

    // Or custom logging
    console.error('Error caught:', { error, errorInfo });
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### 4. Custom Fallbacks

Create custom fallbacks for specific scenarios:

```tsx
function CustomFallback() {
  return (
    <div className="custom-error-ui">
      <h2>Oops! Something went wrong</h2>
      <p>Please contact support if this persists</p>
      <Button onClick={() => window.location.reload()}>
        Reload
      </Button>
    </div>
  );
}

<ErrorBoundary fallback={<CustomFallback />}>
  <MyComponent />
</ErrorBoundary>
```

## Testing Error Boundaries

### Manual Testing

Create a component that throws an error:

```tsx
function ErrorThrower() {
  throw new Error('Test error');
  return null;
}

// Then wrap it
<ErrorBoundary>
  <ErrorThrower />
</ErrorBoundary>
```

### Conditional Errors

```tsx
function ConditionalError({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error('Conditional error triggered');
  }
  return <div>No error</div>;
}
```

## Common Patterns

### Pattern 1: Feature Page with Multiple Queries

```tsx
export default function FeaturePage() {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallback={
        <FeatureErrorFallback
          feature="Funcionalidade"
          onReset={() => {
            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ['data1'] });
            queryClient.invalidateQueries({ queryKey: ['data2'] });
            queryClient.invalidateQueries({ queryKey: ['data3'] });
            window.location.reload();
          }}
        />
      }
      onError={(error) => {
        // Log to monitoring service
        console.error('Feature error:', error);
      }}
    >
      <FeaturePageContent />
    </ErrorBoundary>
  );
}
```

### Pattern 2: Widget Grid with Individual Boundaries

```tsx
export function DashboardGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <ErrorBoundary fallback={<WidgetErrorFallback widget="Widget 1" />}>
        <Widget1 />
      </ErrorBoundary>

      <ErrorBoundary fallback={<WidgetErrorFallback widget="Widget 2" />}>
        <Widget2 />
      </ErrorBoundary>

      <ErrorBoundary fallback={<WidgetErrorFallback widget="Widget 3" />}>
        <Widget3 />
      </ErrorBoundary>
    </div>
  );
}
```

### Pattern 3: Using withErrorBoundary HOC

```tsx
import { withErrorBoundary } from '@/shared/components';

// Define your component
function MyFeaturePage() {
  // Component logic
}

// Export wrapped version
export default withErrorBoundary(MyFeaturePage, {
  featureName: 'Minha Funcionalidade',
  queryKey: ['myFeature'],
  onError: (error) => console.error('Feature error:', error),
});
```

## Error Boundary Hierarchy

```
App
├── ErrorBoundary (App-level)
    └── QueryClientProvider
        └── Layout
            └── Router
                └── LazyWrapper (Per route)
                    └── ErrorBoundary (Route-level)
                        └── FeaturePage
                            └── ErrorBoundary (Feature-level)
                                └── FeatureContent
                                    └── Widget
                                        └── ErrorBoundary (Widget-level)
                                            └── WidgetContent
```

## Future Enhancements

1. **Error Tracking Integration**
   - Add Sentry or similar service
   - Automatic error reporting
   - User feedback collection

2. **Error Analytics**
   - Track error frequency
   - Identify problematic components
   - Monitor error trends

3. **Smart Recovery**
   - Automatic retry logic
   - Progressive fallback strategies
   - Offline mode detection

4. **User Feedback**
   - Allow users to report errors
   - Collect reproduction steps
   - Submit error details to support

## Troubleshooting

### Error Boundary Not Catching Errors

**Problem**: Error boundary doesn't catch certain errors.

**Common Causes**:
- Event handlers (use try-catch)
- Async code (use try-catch)
- Server-side rendering
- Errors in error boundary itself

**Solution**: Use try-catch for event handlers and async operations:

```tsx
const handleClick = async () => {
  try {
    await riskyOperation();
  } catch (error) {
    console.error('Operation failed:', error);
    // Show user-friendly message
  }
};
```

### Infinite Error Loop

**Problem**: Error boundary catches error, resets, error occurs again.

**Solution**: Add retry limit:

```tsx
const [retryCount, setRetryCount] = useState(0);

if (retryCount > 3) {
  return <div>Too many errors, please contact support</div>;
}
```

## Conclusion

Error boundaries are now implemented throughout the application at multiple levels:

1. ✅ App-level boundary for catastrophic errors
2. ✅ Route-level boundaries via LazyWrapper
3. ✅ Feature-level boundaries on key pages (Properties, Reservations)
4. ✅ Multiple fallback components for different scenarios
5. ✅ HOC for easy integration
6. ✅ Query invalidation on reset

All components are documented and ready to use across the application.
