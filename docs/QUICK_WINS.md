# Quick Wins: Architecture Improvements

This document outlines **immediate, low-effort improvements** that can be implemented quickly to improve the codebase.

## 1. Add Optimistic Updates to TanStack Query (1 day)

**Impact**: Better user experience with instant UI updates

**Implementation**:

```typescript
// client/src/features/properties/hooks/useProperties.ts

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PropertyFormData) => propertyApi.createProperty(data),

    // Add optimistic update
    onMutate: async (newProperty) => {
      await queryClient.cancelQueries({ queryKey: ['properties'] });

      const previousProperties = queryClient.getQueryData(['properties']);

      queryClient.setQueryData(['properties'], (old: any) => ({
        ...old,
        data: {
          ...old.data,
          data: [...(old.data?.data || []), { ...newProperty, id: Date.now() }]
        }
      }));

      return { previousProperties };
    },

    onError: (err, newProperty, context) => {
      queryClient.setQueryData(['properties'], context.previousProperties);
      toast.error('Failed to create property');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
```

**Result**: Users see immediate feedback, with automatic rollback on errors.

---

## 2. Add React Suspense Boundaries (2 hours)

**Impact**: Cleaner loading states, better code organization

**Implementation**:

```typescript
// client/src/pages/properties/PropertiesPage.tsx

import { Suspense } from 'react';
import { PropertyList } from '@/features/properties';
import { PropertyListSkeleton } from '@/shared/ui/skeletons';

export function PropertiesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Properties</h1>

      <Suspense fallback={<PropertyListSkeleton />}>
        <PropertyList />
      </Suspense>
    </div>
  );
}

// Update component to use useSuspenseQuery
function PropertyList() {
  const { data } = useSuspenseQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  // No isLoading check needed!
  return <div>{data.map(...)}</div>;
}
```

**Result**: Cleaner component code, automatic loading states.

---

## 3. Configure Query Cache Times (1 hour)

**Impact**: Better performance through intelligent caching

**Implementation**:

```typescript
// client/src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults
      staleTime: 1 * 60 * 1000,    // 1 minute
      cacheTime: 5 * 60 * 1000,    // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Feature-specific overrides
export const CACHE_TIMES = {
  properties: {
    staleTime: 5 * 60 * 1000,   // 5 minutes (rarely change)
    cacheTime: 10 * 60 * 1000,  // 10 minutes
  },
  reservations: {
    staleTime: 30 * 1000,       // 30 seconds (frequently change)
    cacheTime: 2 * 60 * 1000,   // 2 minutes
  },
  dashboard: {
    staleTime: 10 * 1000,       // 10 seconds (real-time stats)
    cacheTime: 1 * 60 * 1000,   // 1 minute
  },
};

// Usage:
const { data } = useQuery({
  queryKey: ['properties'],
  queryFn: fetchProperties,
  ...CACHE_TIMES.properties,
});
```

**Result**: Reduced API calls, faster perceived performance.

---

## 4. Add Error Boundaries (2 hours)

**Impact**: Better error handling, improved user experience

**Implementation**:

```typescript
// client/src/shared/components/ErrorBoundary.tsx

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx:
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

**Result**: Graceful error handling, better debugging.

---

## 5. Modularize Schema File (3 hours)

**Impact**: Better organization, easier to maintain

**Current**: 342 lines in single `shared/schema.ts`

**New Structure**:

```
shared/
├── schemas/
│   ├── properties.schema.ts
│   ├── owners.schema.ts
│   ├── reservations.schema.ts
│   ├── financial.schema.ts
│   ├── ai-knowledge.schema.ts
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts
```

**Implementation**:

```typescript
// shared/schemas/properties.schema.ts
import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull(),
  // ... rest of schema
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof insertPropertySchema._type;

// shared/schemas/index.ts
export * from './properties.schema';
export * from './owners.schema';
export * from './reservations.schema';
export * from './financial.schema';
export * from './ai-knowledge.schema';

// Relations in separate file
export * from './relations';
```

**Migration Steps**:
1. Create `shared/schemas/` directory
2. Split schema.ts by domain
3. Update imports across codebase
4. Test that everything works
5. Delete old schema.ts

**Result**: Easier to find and modify schemas, better separation of concerns.

---

## 6. Add Path Alias for Shared Code (30 minutes)

**Impact**: Cleaner imports

**Implementation**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"],
      "@server/*": ["./server/*"]  // Add this
    }
  }
}

// server/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"],
      "@server/*": ["./server/*"]
    }
  }
}
```

**Before**:
```typescript
import { properties } from '../../../shared/schema';
```

**After**:
```typescript
import { properties } from '@shared/schemas';
```

**Result**: Cleaner, more maintainable imports.

---

## 7. Add ESLint Rules for Architecture (1 hour)

**Impact**: Enforce architectural boundaries automatically

**Implementation**:

```javascript
// eslint.config.js
import boundaries from 'eslint-plugin-boundaries';

export default [
  {
    plugins: {
      boundaries,
    },
    rules: {
      // Prevent circular dependencies
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          {
            from: 'shared',
            allow: ['shared'],
          },
          {
            from: 'features',
            allow: ['features', 'shared', 'entities'],
          },
          {
            from: 'pages',
            allow: ['pages', 'widgets', 'features', 'entities', 'shared'],
          },
        ],
      }],

      // Prevent feature-to-feature imports
      'boundaries/no-private': 'error',
    },
  },
];
```

**Result**: Architecture rules enforced automatically, prevents violations.

---

## 8. Add Query Devtools (5 minutes)

**Impact**: Better debugging of TanStack Query

**Implementation**:

```typescript
// client/src/App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes />
      </Router>
      {/* Add this */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Result**: Visual debugging of queries, cache inspection.

---

## 9. Add Request ID Middleware (30 minutes)

**Impact**: Better debugging and logging

**Implementation**:

```typescript
// server/middleware/request-id.ts
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

// Update logging:
app.use((req, res, next) => {
  console.log(`[${req.id}] ${req.method} ${req.path}`);
  next();
});
```

**Result**: Traceable requests across logs, easier debugging.

---

## 10. Add Health Check with Database (15 minutes)

**Impact**: Better monitoring and production readiness

**Implementation**:

```typescript
// server/routes/health.ts
import { db } from '../db';

export async function healthCheck(req, res) {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
}
```

**Result**: Proper health monitoring for production.

---

## Summary Table

| Quick Win | Effort | Impact | Priority |
|-----------|--------|--------|----------|
| Optimistic Updates | 1 day | High | P0 |
| Suspense Boundaries | 2 hours | Medium | P1 |
| Cache Configuration | 1 hour | High | P0 |
| Error Boundaries | 2 hours | High | P1 |
| Modularize Schema | 3 hours | Medium | P1 |
| Path Aliases | 30 min | Low | P2 |
| ESLint Rules | 1 hour | Medium | P1 |
| Query Devtools | 5 min | Low | P2 |
| Request ID | 30 min | Medium | P2 |
| Health Check | 15 min | High | P0 |

**Total Time**: ~2 days of work
**Total Impact**: Significant improvement in UX, DX, and maintainability

---

## Next Steps

1. Pick 2-3 quick wins from this list
2. Implement in a single PR
3. Get team feedback
4. Roll out remaining improvements
5. Move on to larger architectural changes

---

**Document Version**: 1.0
**Last Updated**: November 8, 2025
