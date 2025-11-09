# Redis Cache Middleware - Quick Reference

## Overview

The Redis caching middleware provides intelligent API response caching to improve performance and reduce database load.

## Features

- ✅ Automatic caching of GET requests
- ✅ Configurable TTL (Time To Live) per route
- ✅ Cache invalidation helpers
- ✅ Graceful degradation (works without Redis)
- ✅ Cache statistics and monitoring
- ✅ Query parameter-aware caching
- ✅ Response headers for cache debugging

## Quick Start

### 1. Install Dependencies

Redis client (`ioredis`) is already installed in the project.

### 2. Environment Setup

Add to your `.env` file:

```bash
# Option 1: Full Redis URL (recommended)
REDIS_URL=redis://localhost:6379

# Option 2: Individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Basic Usage

```typescript
import { cacheMiddleware, cacheInvalidation } from './middleware/cache.middleware.js';

// Apply caching to a GET route
router.get('/api/v1/properties',
  cacheMiddleware(300),  // Cache for 5 minutes
  async (req, res) => {
    const properties = await db.select().from(propertiesTable);
    res.json({ success: true, data: properties });
  }
);

// Invalidate cache on mutations
router.post('/api/v1/properties', async (req, res) => {
  const newProperty = await createProperty(req.body);

  // Clear related caches
  await cacheInvalidation.invalidateRoute('/api/v1/properties');

  res.json({ success: true, data: newProperty });
});
```

## Cache Duration Recommendations

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Static reference data | 15-30 min | Rarely changes |
| Properties, Owners | 5 min | Moderate updates |
| Reservations | 3 min | Frequent updates |
| Dashboard stats | 2 min | Near real-time |
| Financial reports | 10 min | Expensive computation |
| Historical reports | 1 day+ | Never changes |

## API Reference

### `cacheMiddleware(ttl: number)`

Middleware to cache GET request responses.

**Parameters:**
- `ttl` - Time to live in seconds (default: 300)

**Example:**
```typescript
app.get('/api/data', cacheMiddleware(600), handler);
```

### `cacheInvalidation.invalidateRoute(route: string)`

Invalidate all cached responses for a route pattern.

**Example:**
```typescript
await cacheInvalidation.invalidateRoute('/api/v1/properties');
```

### `cacheInvalidation.invalidateAll()`

Clear all cached API responses.

**Example:**
```typescript
await cacheInvalidation.invalidateAll();
```

### `cacheInvalidation.getStats()`

Get cache statistics (key count, memory usage).

**Returns:** `{ keys: number; memory: string } | null`

**Example:**
```typescript
const stats = await cacheInvalidation.getStats();
console.log(`Cached: ${stats.keys} keys, Memory: ${stats.memory}`);
```

## Response Headers

The middleware adds these headers to all responses:

- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response from database (will be cached)
- `X-Cache-Key` - The Redis key used

## Cache Keys

Cache keys are automatically generated from the request URL:

```
Format: api:<originalUrl>

Examples:
- api:/api/v1/properties
- api:/api/v1/properties?active=true
- api:/api/v1/reservations?page=1&limit=20
```

Query parameters create unique cache keys, so different filters are cached separately.

## Best Practices

### 1. Cache Only Idempotent Operations

The middleware automatically only caches GET requests. Don't try to cache POST/PUT/DELETE.

### 2. Always Invalidate on Mutations

```typescript
// ✅ Good - invalidate after changes
router.post('/api/properties', async (req, res) => {
  const result = await createProperty(req.body);
  await cacheInvalidation.invalidateRoute('/api/v1/properties');
  res.json(result);
});

// ❌ Bad - stale cache
router.post('/api/properties', async (req, res) => {
  const result = await createProperty(req.body);
  res.json(result); // Cache not cleared!
});
```

### 3. Invalidate Related Caches

When data affects multiple endpoints:

```typescript
router.delete('/api/properties/:id', async (req, res) => {
  await deleteProperty(req.params.id);

  // Invalidate all related caches
  await cacheInvalidation.invalidateRoute('/api/v1/properties');
  await cacheInvalidation.invalidateRoute('/api/v1/dashboard');
  await cacheInvalidation.invalidateRoute('/api/v1/reports');

  res.json({ success: true });
});
```

### 4. Use Appropriate TTLs

```typescript
// ✅ Good - match TTL to data volatility
router.get('/api/stats', cacheMiddleware(120), handler);      // 2 min - changes often
router.get('/api/properties', cacheMiddleware(300), handler); // 5 min - moderate
router.get('/api/reports/2024', cacheMiddleware(86400), handler); // 1 day - historical
```

### 5. Monitor Cache Performance

```typescript
// Add monitoring endpoint
router.get('/api/admin/cache/stats', async (req, res) => {
  const stats = await cacheInvalidation.getStats();
  res.json({
    enabled: stats !== null,
    ...stats
  });
});
```

## Graceful Degradation

If Redis is unavailable:

1. Middleware automatically disables caching
2. All requests pass through normally
3. No errors thrown to users
4. Application continues working

Console logs:
```
⚠️  Redis cache unavailable, caching disabled: Connection refused
```

## Troubleshooting

### Cache Not Working

1. Check Redis connection:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Check environment variables:
   ```bash
   echo $REDIS_URL
   ```

3. Check server logs for connection messages:
   ```
   ✅ Redis cache connected successfully
   ```

### Cache Not Invalidating

1. Ensure you're calling invalidation after mutations
2. Check the route pattern matches:
   ```typescript
   // If your route is /api/v1/properties
   await cacheInvalidation.invalidateRoute('/api/v1/properties');
   ```

3. Monitor console for invalidation logs:
   ```
   Cache invalidated: 3 keys for pattern api:/api/v1/properties*
   ```

### High Memory Usage

1. Check cache stats:
   ```typescript
   const stats = await cacheInvalidation.getStats();
   ```

2. Reduce TTLs for large responses
3. Clear cache periodically:
   ```typescript
   await cacheInvalidation.invalidateAll();
   ```

## Advanced Patterns

See `cache.examples.ts` for advanced patterns including:
- Conditional caching based on data
- Cache warming on startup
- Batch invalidation
- Different TTLs for different scenarios
- Monitoring and admin endpoints

## Files

- `/server/middleware/cache.middleware.ts` - Main implementation
- `/server/middleware/cache.examples.ts` - Usage examples
- `/server/middleware/CACHE_README.md` - This file
- `CLAUDE.md` - Full project documentation

## Testing

```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# Or use Docker Compose (if configured)
docker-compose up -d redis

# Test your application
npm run dev
```

## Production Checklist

- [ ] Redis configured in production environment
- [ ] `REDIS_URL` environment variable set
- [ ] Cache TTLs tuned for your use case
- [ ] Cache invalidation added to all mutation endpoints
- [ ] Monitoring endpoint configured (optional)
- [ ] Load testing performed to verify performance gains

## Support

For issues or questions:
1. Check this README
2. See examples in `cache.examples.ts`
3. Review main documentation in `CLAUDE.md`
4. Check server logs for Redis connection status
