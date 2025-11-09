# Query Batching Quick Reference Card

## 🚀 Quick Start

### 1. Import Loaders
```typescript
import {
  propertyLoader,
  ownerLoader,
  reservationLoader,
  loadPropertiesWithOwners,
  loadCompletePropertyDetails
} from '../utils/query-batching.js';
```

### 2. Basic Usage

#### Load Single Item
```typescript
const property = await propertyLoader.load(propertyId);
const owner = await ownerLoader.load(ownerId);
```

#### Load Multiple Items
```typescript
const properties = await propertyLoader.loadMany([1, 2, 3]);
const owners = await ownerLoader.loadMany([1, 2, 3]);
```

#### Load with Relations
```typescript
// Properties + owners (2 queries)
const withOwners = await loadPropertiesWithOwners(propertyIds);

// Complete details (3 queries)
const fullData = await loadCompletePropertyDetails(propertyIds);
```

## 📋 Common Patterns

### Pattern 1: List with Relations
```typescript
// ❌ BEFORE (N+1 problem)
const properties = await db.select().from(properties);
for (const p of properties) {
  p.owner = await db.query.owners.findFirst({
    where: eq(owners.id, p.ownerId)
  });
}

// ✅ AFTER (2 queries)
const properties = await db.select().from(properties);
const owners = await ownerLoader.loadMany(
  properties.map(p => p.ownerId)
);
const result = properties.map((p, i) => ({ ...p, owner: owners[i] }));
```

### Pattern 2: Single Item with Relations
```typescript
// ✅ Load in parallel
const property = await propertyLoader.load(propertyId);
const [owner, reservations] = await Promise.all([
  ownerLoader.load(property.ownerId),
  batchLoadReservationsByPropertyId([propertyId]).then(r => r[0])
]);
```

### Pattern 3: Counting Relations
```typescript
// ✅ Use aggregation
const countMap = await countReservationsByProperty(propertyIds);
const counts = propertyIds.map(id => countMap.get(id) || 0);
```

## 🎯 Available Loaders

| Loader | Purpose | Example |
|--------|---------|---------|
| `propertyLoader` | Load properties by ID | `await propertyLoader.load(id)` |
| `ownerLoader` | Load owners by ID | `await ownerLoader.load(id)` |
| `reservationLoader` | Load reservations by ID | `await reservationLoader.load(id)` |
| `cleaningTeamLoader` | Load cleaning teams by ID | `await cleaningTeamLoader.load(id)` |

## 🔧 Helper Functions

| Function | Queries | Use Case |
|----------|---------|----------|
| `loadPropertiesWithOwners(ids)` | 2 | Properties + owners |
| `loadPropertiesWithReservations(ids)` | 2 | Properties + reservations |
| `loadCompletePropertyDetails(ids)` | 3 | Properties + all relations |
| `countReservationsByProperty(ids)` | 1 | Aggregation counts |

## 📊 Batch Loading Functions

```typescript
// Load multiple properties
const props = await batchLoadProperties([1, 2, 3]);

// Load multiple owners
const owners = await batchLoadOwners([1, 2, 3]);

// Load reservations grouped by property
const reservationsByProp = await batchLoadReservationsByPropertyId([1, 2]);
// Returns: [[res1, res2], [res3]]

// Load maintenance tasks by property
const tasksByProp = await batchLoadMaintenanceTasksByPropertyId([1, 2]);
```

## ⚡ Prepared Statements

For frequently executed queries:

```typescript
import {
  getPropertyByIdPrepared,
  getOwnerByIdPrepared,
  getReservationsByPropertyIdPrepared
} from '../utils/query-batching.js';

// Execute prepared statement
const [property] = await getPropertyByIdPrepared.execute({ id: 1 });
const [owner] = await getOwnerByIdPrepared.execute({ id: 1 });
const reservations = await getReservationsByPropertyIdPrepared.execute({
  propertyId: 1
});
```

## 🛠️ Request Object Access

After middleware is added:

```typescript
router.get('/:id', async (req, res) => {
  // Access loaders via req.loaders
  const property = await req.loaders.property.load(req.params.id);
  const owner = await req.loaders.owner.load(property.ownerId);

  res.json({ ...property, owner });
});
```

## 🧹 Cache Management

```typescript
// Clear all caches (middleware does this automatically)
import { clearAllLoaders } from '../utils/query-batching.js';
clearAllLoaders();

// Clear specific loader
propertyLoader.clearCache();

// Prime cache with known value
propertyLoader.prime(id, propertyData);
```

## 🔍 When to Use

### ✅ Use Batching For
- Loading lists with relations
- Dashboard endpoints
- Report generation
- Nested resource loading
- Multiple related queries

### ❌ Don't Use For
- Simple 1-to-1 relations (use JOIN)
- Single item loads (direct query is fine)
- Complex aggregations (use SQL)

## 📈 Performance Cheat Sheet

| Scenario | Before | After | Speedup |
|----------|--------|-------|---------|
| 100 props + owners | 101 queries | 2 queries | **50x** |
| Dashboard (20 items) | 41 queries | 3 queries | **13x** |
| Single with relations | 3-5 queries | 1-2 queries | **3x** |

## 🐛 Quick Fixes

### Stale Data After Update
```typescript
const updated = await db.update(...)
  .returning();
propertyLoader.prime(id, updated[0]);
```

### Type Errors on req.loaders
- Middleware includes type augmentation
- Ensure middleware is imported

### Not Seeing Performance Gain
1. Check middleware is registered
2. Verify loaders are being used
3. Check SQL logs
4. Verify connection pooling

## 📝 Integration Checklist

```typescript
// 1. Add to server/index.ts
import { queryBatchingMiddleware } from './middleware/query-batching.middleware.js';
app.use(queryBatchingMiddleware);

// 2. Use in routes
import { propertyLoader, ownerLoader } from '../utils/query-batching.js';

const property = await propertyLoader.load(id);
const owner = await ownerLoader.load(property.ownerId);

// 3. Test
npm test -- tests/query-batching.spec.ts
```

## 🎓 Learn More

- **Full Guide**: `/docs/QUERY-BATCHING-GUIDE.md`
- **Examples**: `/server/routes/v1/properties-optimized.example.ts`
- **Tests**: `/tests/query-batching.spec.ts`
- **Implementation Summary**: `/docs/QUERY-BATCHING-IMPLEMENTATION-SUMMARY.md`

## 💡 Pro Tips

1. **Parallel Loading**: Use `Promise.all()` for independent queries
   ```typescript
   const [properties, owners] = await Promise.all([
     propertyLoader.loadMany(propIds),
     ownerLoader.loadMany(ownerIds)
   ]);
   ```

2. **Filter Nulls**: Use type guards
   ```typescript
   const valid = results.filter((p): p is Property => p !== null);
   ```

3. **Helper First**: Use helper functions for common cases
   ```typescript
   const data = await loadCompletePropertyDetails(ids);
   ```

4. **Monitor**: Enable stats in development
   ```typescript
   app.use(queryBatchingMiddlewareWithStats);
   ```

5. **Cache Prime**: Update cache after mutations
   ```typescript
   const created = await createProperty(...);
   propertyLoader.prime(created.id, created);
   ```

---

**Quick Access**: Keep this card handy while implementing query batching!

**Created**: 2025-11-08
**Version**: 1.0
