# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MariaIntelligence** (Maria Faz) is an AI-powered property management platform for short-term rental properties. It provides comprehensive management for properties, reservations, owners, financial reporting, and AI-assisted document processing.

### Core Technologies

- **Frontend**: React 18 + TypeScript, TailwindCSS, Shadcn UI, TanStack Query
- **Backend**: Express + TypeScript (ES Modules)
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **AI Services**: Google Gemini Pro for OCR and document processing
- **Build Tool**: Vite for frontend, esbuild for backend
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Deployment**: Docker-ready with Render/Vercel support

## Development Commands

### Core Development

```bash
# Start development (both frontend and backend)
npm run dev

# Start only frontend (Vite dev server)
npm run dev:client

# Start only backend (tsx with hot reload)
npm run dev:server

# Build for production
npm run build  # Builds both client and server

# Build components separately
npm run build:client  # Vite build → dist/client
npm run build:server  # esbuild → api/index.js

# Start production server
npm start  # or npm run start:robust
```

### Database Operations

```bash
# Push schema changes to database
npm run db:push

# Run base migration (audit + core indexes)
npm run db:migrate

# Run performance indexes migration
npm run db:migrate:performance

# Force base migration (skip validation)
npm run db:migrate:force

# Force performance migration
npm run db:migrate:performance:force

# Seed database with demo data
npm run db:seed

# Full database setup (migrate + seed)
npm run db:setup

# Analyze migration status
npm run db:analyze

# Validate migrations
npm run db:validate
```

### Testing

```bash
# Run all tests with Vitest
npm test

# Run tests with coverage
npm run test:coverage

# Run Jest tests (legacy)
npm run test:jest

# Run OCR-specific tests
npm run test:ocr
npm run test:ocr-integration
npm run test:ocr-providers
npm run test:ocr-validation
npm run test:ocr-full  # Comprehensive OCR test suite

# Run E2E tests
npm run e2e
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Type checking
npm run check  # or tsc --noEmit

# Verify environment setup
npm run verify
```

## Architecture Overview

### Monorepo Structure

```
/
├── client/          # React frontend application
│   └── src/
│       ├── components/   # Shared UI components
│       ├── features/     # Feature-based modules
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilities
│       └── i18n/         # Internationalization (PT/EN)
│
├── server/          # Express backend API
│   ├── routes/      # API route definitions
│   │   └── v1/      # Versioned API routes
│   ├── features/    # Feature-based business logic
│   │   ├── ai-processing/
│   │   ├── financial/
│   │   ├── properties/
│   │   └── reservations/
│   ├── services/    # Core services (AI, OCR, email)
│   ├── middleware/  # Express middleware
│   ├── db/          # Database connection and migrations
│   └── utils/       # Server utilities
│
├── shared/          # Shared code between client/server
│   └── schema.ts    # Drizzle schema + Zod validators
│
├── tests/           # Test files (Vitest)
└── scripts/         # Build and deployment scripts
```

### Feature-Based Organization

Both client and server use **feature-based architecture**:

**Client Features** (`client/src/features/`):
- `ai-assistant/` - AI chat assistant components and logic
- `dashboard/` - Main dashboard functionality
- `properties/` - Property management
- `reservations/` - Reservation management

Each feature contains:
- `components/` - Feature-specific components
- `hooks/` - Feature-specific React hooks
- `services/` - API client functions
- `types/` - TypeScript types

**Server Features** (`server/features/`):
- `ai-processing/` - AI/OCR document processing
- `financial/` - Financial reports and calculations
- `properties/` - Property business logic
- `reservations/` - Reservation business logic

Each feature contains:
- `controllers/` - Request handlers
- `services/` - Business logic
- `utils/` - Feature utilities
- `types/` - TypeScript types

### Database Architecture

**Core Tables** (see `shared/schema.ts`):
- `properties` - Property listings with owner relationships and aliases
- `owners` - Property owners/landlords with contact info
- `reservations` - Guest bookings with platform tracking (Airbnb, Booking.com, etc.)
- `cleaning_teams` - Cleaning crew management
- `financial_documents` - Invoices, receipts, expenses
- `maintenance_tasks` - Property maintenance tracking
- `quotations` - Budget quotes for clients

**Key Schema Patterns**:
- Defined with Drizzle ORM using `pgTable`
- Zod validators auto-generated from schema via `createInsertSchema`
- Enums for status fields (`pgEnum`)
- Relations defined for foreign keys using `relations()`
- Connection pooling configured for optimal performance (25 connections in prod, 8 in dev)

**Database Access Pattern**:
```typescript
import { db } from './server/db';
import { properties, owners } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Query with Drizzle
const allProperties = await db.select().from(properties);

// With relations
const propertyWithOwner = await db.query.properties.findFirst({
  where: eq(properties.id, propertyId),
  with: { owner: true }
});
```

### API Structure

**Version 1 API** (`/api/v1/*`):
- Modern ES Modules with explicit `.js` extensions in imports
- API versioning for backward compatibility
- OpenAPI/Swagger documentation (when `API_CONFIG.documentation.enabled`)
- Middleware stack: security, logging, rate limiting

**Key Endpoints**:
- `/api/v1/properties` - CRUD for properties
- `/api/v1/reservations` - Reservation management
- `/api/v1/owners` - Owner management
- `/api/v1/financial` - Financial documents and reports
- `/api/v1/ocr` - AI document processing
- `/api/v1/assistant` - AI chat assistant
- `/api/health` - Health check (non-versioned)

**Legacy Compatibility**:
- Non-versioned `/api/*` routes redirect to `/api/v1/*`
- GET requests get 301 redirects
- Other methods rewrite the URL internally

### AI Integration

**Google Gemini Service** (`server/services/gemini.service.ts`):
- OCR for PDF document extraction
- Structured data extraction from reservations, invoices, etc.
- AI assistant chat functionality
- Retry logic with exponential backoff for rate limits
- Rate limiting protection (10 req/hour for OCR, 20 req/hour for AI)

**Usage Pattern**:
```typescript
import { GeminiService } from './services/gemini.service';

const gemini = new GeminiService(process.env.GOOGLE_GEMINI_API_KEY);

// Extract reservation data from PDF
const result = await gemini.extractReservationFromPDF(pdfBuffer);

// Chat with AI assistant
const response = await gemini.chat(userMessage, conversationHistory);
```

**Key Features**:
- Automatic retry on rate limit errors (429)
- Intelligent parsing of AI JSON responses
- Validation against Zod schemas
- Structured output extraction with fallback parsing

### Security Middleware

**Applied Security Stack** (`server/middleware/security.ts`):
- **Helmet** - Security headers (CSP, XSS protection, frameguard, etc.)
- **Rate Limiting** - Different limits by route type:
  - General API: 100 req/15min
  - PDF/OCR uploads: 10 req/hour
  - AI operations: 20 req/hour
- **Pino Logging** - JSON logs with sensitive data redaction (authorization, cookies)
- **CORS** - Configured for frontend domain
- **Input Validation** - Zod schemas on all endpoints

### API Response Caching with Redis

**Redis Caching Middleware** (`server/middleware/cache.middleware.ts`):

The application uses Redis for intelligent API response caching to reduce database load and improve response times.

**Cache Configuration by Feature**:
- **Properties**: 5 minutes (rarely change)
- **Financial Reports**: 10 minutes (computed data)
- **Dashboard Stats**: 2 minutes (semi-real-time)
- **Owners**: 5 minutes (rarely change)
- **Reservations**: 3 minutes (moderate frequency)

**Usage Example**:
```typescript
import { cacheMiddleware, cacheInvalidation } from './middleware/cache.middleware.js';

// Apply caching to GET routes
app.get('/api/v1/properties', cacheMiddleware(300), propertiesHandler);

// Invalidate cache on mutations
app.post('/api/v1/properties', async (req, res) => {
  // ... create property
  await cacheInvalidation.invalidateRoute('/api/v1/properties');
  res.json(result);
});

// Invalidate related caches
app.put('/api/v1/properties/:id', async (req, res) => {
  // ... update property
  await cacheInvalidation.invalidateRoute('/api/v1/properties');
  await cacheInvalidation.invalidateRoute('/api/v1/dashboard'); // Affects stats
  res.json(result);
});
```

**Cache Response Headers**:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response from database (will be cached)
- `X-Cache-Key` - The Redis key used for caching

**Cache Statistics**:
```typescript
import { cacheInvalidation } from './middleware/cache.middleware.js';

// Get cache stats
const stats = await cacheInvalidation.getStats();
console.log(`Cached keys: ${stats.keys}, Memory: ${stats.memory}`);

// Invalidate specific route pattern
await cacheInvalidation.invalidateRoute('/api/v1/properties');

// Clear all cache
await cacheInvalidation.invalidateAll();
```

**Environment Variables**:
```bash
# Option 1: Full Redis URL (recommended for cloud services)
REDIS_URL=redis://localhost:6379

# Option 2: Separate host/port (local development)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Graceful Degradation**:
- If Redis is unavailable, caching is automatically disabled
- Application continues to work normally without cache
- Connection retries up to 3 times before disabling
- No impact on API functionality

**Best Practices**:
1. **Cache only GET requests** - Middleware automatically skips other methods
2. **Invalidate on mutations** - Always clear related caches after POST/PUT/DELETE
3. **Use appropriate TTLs** - Balance freshness vs. performance
4. **Monitor cache stats** - Track hit rates and memory usage
5. **Consider cache warming** - Pre-populate cache for critical routes on startup

### State Management (Frontend)

**TanStack Query** for server state:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetching data
const { data, isLoading } = useQuery({
  queryKey: ['properties'],
  queryFn: fetchProperties
});

// Mutations with automatic cache invalidation
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: createProperty,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['properties'] })
});
```

**Local State**:
- React `useState` for component-level state
- React Hook Form for form state with Zod validation
- Context API sparingly for theme/auth if needed

### Path Aliases

TypeScript and build tools configured for clean imports:

```typescript
// Instead of: import { Button } from '../../../components/ui/button'
import { Button } from '@/components/ui/button';

// Shared schema access
import { properties, insertPropertySchema } from '@shared/schema';
```

**Configuration**:
- `tsconfig.json` - `@/*` points to `./client/src`, `@shared/*` to `./shared`
- `vite.config.ts` - Matching `resolve.alias` configuration
- Works in both client and server code

### Internationalization

**i18next** with two languages:
- Portuguese (PT) - Primary language
- English (EN) - Secondary language

**Translation Files**: `client/src/i18n/locales/{pt,en}.json`

**Usage in Components**:
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('dashboard.title')}</h1>;
}
```

## Important Patterns

### Error Handling

All API routes should use try-catch with proper error responses:

```typescript
try {
  const result = await someOperation();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  res.status(500).json({
    success: false,
    message: 'Operation failed',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### Type Safety with Zod

Validate all incoming data on API endpoints:

```typescript
import { insertReservationSchema } from '@shared/schema';

// In route handler
const validated = insertReservationSchema.parse(req.body);

// Or with safe parse for better error handling
const result = insertReservationSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    error: 'Validation failed',
    details: result.error.issues
  });
}
```

### Async/Await Pattern

Consistent use of async/await throughout the codebase:

```typescript
// ✅ Good - consistent async/await
const properties = await db.select().from(properties);

// ❌ Avoid - no callback-style or promise chains
db.select().from(properties).then(props => { ... });
```

### Feature Isolation

Keep features self-contained:
- Feature code should not directly import from other features
- Share common utilities via `shared/` or `lib/` directories
- Each feature exports its own types and interfaces
- Use dependency injection for cross-feature communication

### Database Queries

Prefer Drizzle query builder over raw SQL:

```typescript
// ✅ Preferred - type-safe query builder
await db.select().from(properties)
  .where(eq(properties.active, true))
  .orderBy(desc(properties.createdAt));

// ⚠️ Use raw SQL sparingly - only for complex queries
await db.execute(sql`SELECT * FROM properties WHERE active = true`);
```

### ES Module Imports

Server code uses ES Modules - always include `.js` extensions:

```typescript
// ✅ Correct
import { setupRoutes } from './routes/index.js';

// ❌ Wrong - will fail at runtime
import { setupRoutes } from './routes/index';
```

## Environment Variables

Required variables (see `.env.example`):

```bash
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection
GOOGLE_GEMINI_API_KEY=...             # For AI features
SESSION_SECRET=...                     # Express session secret
NODE_ENV=development|production
PORT=5000                              # Server port
HOST=0.0.0.0                          # Bind address
```

Optional variables:
```bash
EMAIL_HOST=smtp.gmail.com             # Email service (Nodemailer)
EMAIL_USER=...
EMAIL_PASS=...
REDIS_URL=redis://localhost:6379      # Session storage (optional)
```

## Common Development Tasks

### Adding a New Feature

1. Create feature directories in both `client/src/features/[feature-name]` and `server/features/[feature-name]`
2. Define database tables in `shared/schema.ts` if needed:
   - Add `pgTable` definition
   - Create `pgEnum` for status fields if applicable
   - Generate Zod schemas with `createInsertSchema`
   - Define relations if needed
3. Build server API routes in `server/routes/v1/[feature-name].routes.ts`
4. Implement service layer in `server/features/[feature-name]/services/`
5. Create React components in `client/src/features/[feature-name]/components/`
6. Add API client functions in `client/src/features/[feature-name]/services/`
7. Add page routes in `client/src/pages/`
8. Run database migration: `npm run db:push`
9. Add tests in `tests/[feature-name].spec.ts`

### Running a Specific Test File

```bash
# Run specific test with Vitest
npm test -- tests/ocr-providers.spec.ts

# With watch mode
npm test -- --watch tests/pdf-import.spec.ts

# Run tests matching pattern
npm test -- --grep "OCR"
```

### Debugging Database Issues

```bash
# Test database connection
node -e "import('./server/db/index.js').then(m => m.testConnection()).then(console.log)"

# Analyze migration state
npm run db:analyze

# View current schema with Drizzle Kit
npx drizzle-kit introspect:pg

# Generate migrations from schema changes
npx drizzle-kit generate:pg
```

### Building for Deployment

```bash
# Standard production build
npm run build

# Render-specific build (includes server bundling to dist/server)
npm run build:render

# Vercel-specific build (serverless functions)
npm run build:vercel

# Start production server
npm start
```

### Working with OCR and AI Features

The system uses Google Gemini for OCR:
- PDF upload endpoint: `/api/ocr`
- Supports reservation documents, invoices, and control files
- Automatically extracts structured data
- Rate limited to prevent API overuse

**Testing OCR locally**:
```bash
# Run full OCR test suite
npm run test:ocr-full

# Quick validation
npm run test:ocr-quick
```

## Testing Guidelines

### Test File Location

All test files go in `/tests/` directory with `.spec.ts` extension.

### Test Patterns

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', async () => {
    // Arrange
    const input = { foo: 'bar' };

    // Act
    const result = await someFunction(input);

    // Assert
    expect(result).toBe('expected');
    expect(result).toHaveProperty('success', true);
  });
});
```

### OCR Test Suite

Comprehensive OCR testing with multiple providers:
```bash
npm run test:ocr-full     # All OCR tests with detailed report
npm run test:ocr-quick    # Quick validation
npm run test:ocr-providers # Test all OCR provider integrations
```

## Deployment

### Docker

```bash
# Build image
docker build -t maria-intelligence .

# Run container
docker run -p 5000:5000 --env-file .env maria-intelligence

# Using docker-compose
docker-compose up -d
```

### Render

Uses `build:render` script which bundles everything:
- Frontend: Built to `dist/client`
- Backend: Bundled with esbuild to `dist/server/index.js`
- Start command: `npm start` (runs `node dist/server/index.js`)
- Environment variables set in Render dashboard

### Vercel

Serverless deployment configuration:
- Frontend: Vite static build to `dist/client`
- Backend: API routes in `/api` directory
- Entry point: `api/index.js` (serverless function)
- Environment variables in Vercel dashboard

## Migration Notes

### AI Service Migration

The system migrated from Mistral AI to Google Gemini for OCR/AI features.

**Key Changes**:
- OCR consolidated to single `/api/ocr` endpoint
- All AI operations go through `gemini.service.ts`
- Built-in fallback mechanisms for rate limiting
- Automatic retry logic with exponential backoff

See `docs/AI-SERVICE-MIGRATION.md` for full details.

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=5001 npm run dev
```

### Database Connection Issues

1. Verify `DATABASE_URL` in `.env`
2. Ensure SSL mode is included: `?sslmode=require`
3. Test connection: `npm run verify`
4. Check Neon dashboard for database status
5. Verify connection pool settings in `server/db/index.ts`

### Build Failures

```bash
# Clear all caches and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### TypeScript Errors

```bash
# Type check without emitting files
npm run check

# Generate fresh types from database schema
npx drizzle-kit generate:pg
```

### Rate Limit Errors with Gemini API

If you hit rate limits (429 errors):
1. The service automatically retries with backoff
2. Check your API key quota in Google AI Studio
3. Consider reducing concurrent requests
4. Rate limiting middleware is configured in `server/middleware/security.ts`

## Key Files Reference

- `shared/schema.ts` - Complete database schema with Drizzle + Zod
- `server/index.ts` - Server entry point with middleware stack
- `server/routes/index.ts` - Route registration and API versioning
- `server/routes/v1/index.ts` - v1 API setup
- `server/db/index.ts` - Database connection with pooling
- `server/services/gemini.service.ts` - Google Gemini AI integration
- `client/src/main.tsx` - React app entry point
- `client/src/App.tsx` - Main app component with routing
- `vite.config.ts` - Frontend build configuration
- `package.json` - All available scripts
- `drizzle.config.ts` - Database migration configuration
