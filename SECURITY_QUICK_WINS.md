# Security Quick Wins - MariaIntelligence

These are the fastest, highest-impact security improvements you can make today.

## 5-Minute Fixes

### 1. Add Request Size Limits
```typescript
// server/index.ts - Add after line 67
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
```

### 2. Enable Database SSL
```typescript
// server/db/index.ts - Update connectionPool config (line 13)
connectionPool = neon(process.env.DATABASE_URL!, {
  // ... existing config
  ssl: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.3'
  }
});
```

### 3. Add Statement Timeout
```typescript
// server/db/index.ts - Add to connectionPool config
queryTimeout: 30000,
statement_timeout: 30000
```

## 15-Minute Fixes

### 4. Add Authentication to Critical Routes
```typescript
// Example: server/routes/v1/properties.routes.ts
import { authenticateToken } from '../../services/jwt-auth.service.js';

// Add authenticateToken to all routes
app.get('/api/v1/properties', authenticateToken, async (req, res) => {
  // Only return properties user has access to
  const userId = req.user.userId;
  // ... filter by userId
});
```

### 5. Install Security Scanning
```bash
npm install --save-dev snyk @cyclonedx/cyclonedx-npm

# Add to package.json scripts
"security:scan": "npm audit && snyk test",
"sbom:generate": "cyclonedx-npm --output-file sbom.json"
```

### 6. Add Content-Type Validation
```typescript
// server/middleware/security.ts - Add new middleware
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

// Apply in server/index.ts
app.use('/api/', validateContentType);
```

## 30-Minute Fixes

### 7. Implement Redis for JWT Storage
```bash
npm install ioredis
```

```typescript
// server/utils/redis-client.ts
import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

// server/services/jwt-auth.service.ts - Add methods
async storeToken(userId: string, token: string, expiresIn: number): Promise<void> {
  const key = `jwt:${userId}:${crypto.createHash('sha256').update(token).digest('hex').substring(0, 16)}`;
  await redis.setex(key, expiresIn, JSON.stringify({
    userId,
    createdAt: Date.now(),
    deviceInfo: req.get('User-Agent')
  }));
}

async validateToken(userId: string, token: string): Promise<boolean> {
  const key = `jwt:${userId}:${crypto.createHash('sha256').update(token).digest('hex').substring(0, 16)}`;
  return await redis.exists(key) === 1;
}

async revokeUserTokens(userId: string): Promise<void> {
  const pattern = `jwt:${userId}:*`;
  const stream = redis.scanStream({ match: pattern, count: 100 });
  stream.on('data', async (keys) => {
    if (keys.length) await redis.del(...keys);
  });
}
```

### 8. Add Object-Level Authorization (BOLA Protection)
```typescript
// server/middleware/authorization.ts
export const requireOwnership = (resourceType: 'property' | 'owner' | 'reservation') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = parseInt(req.params.id);
    const userId = req.user.userId;

    let hasAccess = false;

    switch (resourceType) {
      case 'property':
        const property = await db.select()
          .from(properties)
          .where(eq(properties.id, resourceId))
          .limit(1);
        hasAccess = property[0]?.ownerId === userId || req.user.role === 'admin';
        break;

      case 'reservation':
        const reservation = await db.query.reservations.findFirst({
          where: eq(reservations.id, resourceId),
          with: { property: true }
        });
        hasAccess = reservation?.property.ownerId === userId || req.user.role === 'admin';
        break;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied to this resource',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

// Apply to routes
app.get('/api/v1/properties/:id',
  authenticateToken,
  requireOwnership('property'),
  async (req, res) => {
    // Handler
  }
);
```

### 9. Environment Variable Validation
```typescript
// server/utils/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_GEMINI_API_KEY: z.string().min(20),
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().regex(/^\d+$/),
  REDIS_URL: z.string().url().optional()
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
    console.log('Environment variables validated successfully');
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}

// Call in server/index.ts at startup
import { validateEnv } from './utils/env-validation.js';
validateEnv();
```

## 1-Hour Fixes

### 10. Implement Secret Manager (Google Cloud)
```bash
npm install @google-cloud/secret-manager
```

```typescript
// server/utils/secrets-manager.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

class SecretsManager {
  private client: SecretManagerServiceClient;
  private projectId: string;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();

  constructor() {
    this.client = new SecretManagerServiceClient();
    this.projectId = process.env.GCP_PROJECT_ID!;
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await this.client.accessSecretVersion({ name });
    const secret = version.payload?.data?.toString() || '';

    // Cache for 5 minutes
    this.cache.set(secretName, {
      value: secret,
      expiresAt: Date.now() + 300000
    });

    return secret;
  }

  async createSecret(secretId: string, secretValue: string): Promise<void> {
    const parent = `projects/${this.projectId}`;

    const [secret] = await this.client.createSecret({
      parent,
      secretId,
      secret: { replication: { automatic: {} } }
    });

    await this.client.addSecretVersion({
      parent: secret.name!,
      payload: { data: Buffer.from(secretValue, 'utf8') }
    });
  }
}

export const secretsManager = new SecretsManager();

// Update database connection
// server/db/index.ts
async function createDrizzleClient() {
  const dbUrl = await secretsManager.getSecret('database-url');
  connectionPool = neon(dbUrl, { /* config */ });
  return drizzle(connectionPool, { schema });
}
```

### 11. Add Security Headers Enhancement
```typescript
// server/middleware/security.ts - Enhance existing headers
export const enhancedSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Existing headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Additional 2025 best practices
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()'
  );

  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Remove server identification
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};
```

### 12. Database Query Parameterization Check
```typescript
// server/utils/sql-injection-prevention.ts

// GOOD - Parameterized queries with Drizzle
async function getPropertySafe(propertyId: number) {
  return await db.select()
    .from(properties)
    .where(eq(properties.id, propertyId));
}

// BAD - Never do this!
async function getPropertyUnsafe(propertyId: string) {
  return await db.execute(sql`SELECT * FROM properties WHERE id = ${propertyId}`);
}

// If you MUST use dynamic SQL, use prepared statements
async function searchProperties(searchTerm: string) {
  const prepared = db.select().from(properties)
    .where(like(properties.name, sql.placeholder('searchTerm')))
    .prepare();

  return await prepared.execute({ searchTerm: `%${searchTerm}%` });
}
```

## Testing Your Security Improvements

### Security Test Script
```bash
#!/bin/bash
# scripts/security-test.sh

echo "Running security tests..."

# 1. Check for known vulnerabilities
echo "1. Scanning dependencies..."
npm audit --audit-level=moderate

# 2. Check for secrets in code
echo "2. Scanning for secrets..."
npx secretlint "**/*"

# 3. Generate SBOM
echo "3. Generating SBOM..."
npm run sbom:generate

# 4. Test rate limiting
echo "4. Testing rate limits..."
for i in {1..10}; do
  curl -X POST http://localhost:5100/api/v1/properties \
    -H "Content-Type: application/json" \
    -d '{"name":"test"}' &
done
wait

# 5. Test authentication
echo "5. Testing authentication..."
curl http://localhost:5100/api/v1/properties
# Should return 401

# 6. Test CORS
echo "6. Testing CORS..."
curl http://localhost:5100/api/v1/properties \
  -H "Origin: https://evil.com" \
  -v

echo "Security tests completed!"
```

## Priority Order

1. **TODAY**: Add request size limits, database SSL, statement timeout (15 min total)
2. **THIS WEEK**: Add authentication to routes, install security scanning (2 hours)
3. **THIS MONTH**: Implement Redis JWT storage, BOLA protection (1 week)
4. **THIS QUARTER**: Migrate to secret manager, field encryption (1 month)

## Validation Checklist

- [ ] All API endpoints require authentication
- [ ] Database uses SSL/TLS 1.3
- [ ] Request payloads limited to 1MB
- [ ] SBOM generated on each build
- [ ] npm audit runs clean (no high/critical vulnerabilities)
- [ ] Security headers properly set
- [ ] Rate limiting working on all endpoints
- [ ] JWT tokens validated against Redis
- [ ] Object-level authorization enforced
- [ ] Secrets not in environment variables

## Monitoring After Implementation

```typescript
// Add security metrics endpoint
app.get('/api/v1/security/metrics',
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    const metrics = {
      blockedIPs: blockedIPs.size,
      activeJWTs: await redis.dbsize(),
      securityEvents24h: securityAuditService.getMetrics(),
      rateLimitHits: /* from rate limiter */
    };
    res.json(metrics);
  }
);
```

## Resources

- [OWASP Top 10 2025](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Advisories](https://github.com/advisories)
- [CycloneDX SBOM](https://cyclonedx.org/)
- [Google Secret Manager Docs](https://cloud.google.com/secret-manager/docs)
