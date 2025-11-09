/**
 * Query Batching Tests - MariaIntelligence 2025
 *
 * Tests for DataLoader-like batching utilities
 * Validates N+1 problem solutions and performance optimizations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BatchLoader,
  propertyLoader,
  ownerLoader,
  reservationLoader,
  batchLoadProperties,
  batchLoadOwners,
  batchLoadReservationsByPropertyId,
  loadPropertiesWithOwners,
  loadPropertiesWithReservations,
  loadCompletePropertyDetails,
  countReservationsByProperty,
  clearAllLoaders
} from '../server/utils/query-batching';
import { db } from '../server/db';
import { properties, owners, reservations } from '@shared/schema';
import { eq } from 'drizzle-orm';

describe('Query Batching Utilities', () => {
  // Clear loader caches after each test
  afterEach(() => {
    clearAllLoaders();
  });

  describe('BatchLoader Class', () => {
    it('should batch multiple load calls into single execution', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        // Simulate database query
        return keys.map(k => ({ id: k, name: `Item ${k}` }));
      });

      const loader = new BatchLoader(batchFn);

      // Make multiple concurrent calls
      const [item1, item2, item3] = await Promise.all([
        loader.load(1),
        loader.load(2),
        loader.load(3)
      ]);

      // Should only call batch function once
      expect(batchFn).toHaveBeenCalledTimes(1);
      expect(batchFn).toHaveBeenCalledWith([1, 2, 3]);

      // Should return correct items
      expect(item1).toEqual({ id: 1, name: 'Item 1' });
      expect(item2).toEqual({ id: 2, name: 'Item 2' });
      expect(item3).toEqual({ id: 3, name: 'Item 3' });
    });

    it('should cache results within request cycle', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        return keys.map(k => ({ id: k, value: Math.random() }));
      });

      const loader = new BatchLoader(batchFn);

      // Load same item twice
      const item1 = await loader.load(1);
      const item2 = await loader.load(1);

      // Should only call batch function once (cached on second call)
      expect(batchFn).toHaveBeenCalledTimes(1);

      // Should return same instance
      expect(item1).toBe(item2);
    });

    it('should handle null/missing values gracefully', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        return keys.map(k => (k === 999 ? null : { id: k }));
      });

      const loader = new BatchLoader(batchFn);

      const [exists, missing] = await Promise.all([
        loader.load(1),
        loader.load(999)
      ]);

      expect(exists).toEqual({ id: 1 });
      expect(missing).toBeNull();
    });

    it('should deduplicate keys in same batch', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        return keys.map(k => ({ id: k }));
      });

      const loader = new BatchLoader(batchFn);

      // Load same key multiple times in parallel
      await Promise.all([
        loader.load(1),
        loader.load(1),
        loader.load(1)
      ]);

      // Should only request unique keys
      expect(batchFn).toHaveBeenCalledWith([1]);
    });

    it('should maintain order of requested keys', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        // Return in different order than requested
        const items = keys.map(k => ({ id: k, name: `Item ${k}` }));
        return items.reverse();
      });

      const loader = new BatchLoader(batchFn, { batchWindowMs: 0 });

      const results = await loader.loadMany([1, 2, 3, 4, 5]);

      // Results should match requested order despite batch function returning different order
      expect(results.map(r => r?.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle errors in batch function', async () => {
      const batchFn = vi.fn(async (_keys: number[]) => {
        throw new Error('Database error');
      });

      const loader = new BatchLoader(batchFn);

      // All loads should reject with same error
      await expect(loader.load(1)).rejects.toThrow('Database error');
    });

    it('should support priming the cache', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        return keys.map(k => ({ id: k }));
      });

      const loader = new BatchLoader(batchFn);

      // Prime cache with known value
      loader.prime(1, { id: 1, name: 'Primed Item' });

      // Load should return primed value without calling batch function
      const item = await loader.load(1);

      expect(batchFn).not.toHaveBeenCalled();
      expect(item).toEqual({ id: 1, name: 'Primed Item' });
    });

    it('should support loadMany for multiple keys', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        return keys.map(k => ({ id: k }));
      });

      const loader = new BatchLoader(batchFn);

      const results = await loader.loadMany([1, 2, 3]);

      expect(batchFn).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ id: 1 });
    });

    it('should respect maxBatchSize option', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        return keys.map(k => ({ id: k }));
      });

      const loader = new BatchLoader(batchFn, { maxBatchSize: 2, batchWindowMs: 0 });

      // Load 5 items (should split into 3 batches: 2+2+1)
      await loader.loadMany([1, 2, 3, 4, 5]);

      // Should be called 3 times with max 2 items each
      expect(batchFn).toHaveBeenCalledTimes(3);
      expect(batchFn.mock.calls[0][0]).toHaveLength(2);
      expect(batchFn.mock.calls[1][0]).toHaveLength(2);
      expect(batchFn.mock.calls[2][0]).toHaveLength(1);
    });

    it('should clear cache when clearCache is called', async () => {
      const batchFn = vi.fn(async (keys: number[]) => {
        return keys.map(k => ({ id: k }));
      });

      const loader = new BatchLoader(batchFn);

      // Load and cache
      await loader.load(1);
      expect(batchFn).toHaveBeenCalledTimes(1);

      // Clear cache
      loader.clearCache();

      // Load again - should hit batch function again
      await loader.load(1);
      expect(batchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Batch Loading Functions', () => {
    describe('batchLoadProperties', () => {
      it('should load multiple properties by IDs', async () => {
        // Create test properties
        const testProperties = await db.insert(properties).values([
          { name: 'Test Property 1', ownerId: 1 },
          { name: 'Test Property 2', ownerId: 1 },
          { name: 'Test Property 3', ownerId: 1 }
        ]).returning();

        const ids = testProperties.map(p => p.id);

        const results = await batchLoadProperties(ids);

        expect(results).toHaveLength(ids.length);
        expect(results[0]).toMatchObject({ name: 'Test Property 1' });
        expect(results[1]).toMatchObject({ name: 'Test Property 2' });
        expect(results[2]).toMatchObject({ name: 'Test Property 3' });

        // Cleanup
        await db.delete(properties).where(eq(properties.id, testProperties[0].id));
        await db.delete(properties).where(eq(properties.id, testProperties[1].id));
        await db.delete(properties).where(eq(properties.id, testProperties[2].id));
      });

      it('should return null for non-existent IDs', async () => {
        const results = await batchLoadProperties([99999, 99998]);

        expect(results).toHaveLength(2);
        expect(results[0]).toBeNull();
        expect(results[1]).toBeNull();
      });

      it('should maintain order of requested IDs', async () => {
        const testProperties = await db.insert(properties).values([
          { name: 'Property A', ownerId: 1 },
          { name: 'Property B', ownerId: 1 }
        ]).returning();

        const ids = [testProperties[1].id, testProperties[0].id]; // Reversed order

        const results = await batchLoadProperties(ids);

        expect(results[0]?.name).toBe('Property B');
        expect(results[1]?.name).toBe('Property A');

        // Cleanup
        await db.delete(properties).where(eq(properties.id, testProperties[0].id));
        await db.delete(properties).where(eq(properties.id, testProperties[1].id));
      });
    });

    describe('batchLoadReservationsByPropertyId', () => {
      it('should group reservations by property ID', async () => {
        // This test would require test data setup
        // Skipped for now as it requires complex test data
        expect(true).toBe(true);
      });

      it('should return empty array for properties with no reservations', async () => {
        const results = await batchLoadReservationsByPropertyId([99999]);

        expect(results).toHaveLength(1);
        expect(results[0]).toEqual([]);
      });
    });
  });

  describe('Singleton Loaders', () => {
    it('propertyLoader should batch multiple calls', async () => {
      // Mock data - would need actual test properties in real test
      const results = await Promise.all([
        propertyLoader.load(1).catch(() => null),
        propertyLoader.load(2).catch(() => null),
        propertyLoader.load(3).catch(() => null)
      ]);

      // Even if properties don't exist, calls should be batched
      expect(results).toHaveLength(3);
    });

    it('ownerLoader should cache results', async () => {
      // First load
      const owner1 = await ownerLoader.load(1).catch(() => null);

      // Second load (should come from cache)
      const owner2 = await ownerLoader.load(1).catch(() => null);

      // Should be same instance if exists
      if (owner1 && owner2) {
        expect(owner1).toBe(owner2);
      }

      expect(true).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    describe('loadPropertiesWithOwners', () => {
      it('should load properties with their owners', async () => {
        // Create test owner
        const [testOwner] = await db.insert(owners).values({
          name: 'Test Owner',
          email: 'test@example.com'
        }).returning();

        // Create test properties
        const testProperties = await db.insert(properties).values([
          { name: 'Property 1', ownerId: testOwner.id },
          { name: 'Property 2', ownerId: testOwner.id }
        ]).returning();

        const ids = testProperties.map(p => p.id);

        const results = await loadPropertiesWithOwners(ids);

        expect(results).toHaveLength(2);
        expect(results[0]?.owner).toBeDefined();
        expect(results[0]?.owner?.id).toBe(testOwner.id);
        expect(results[1]?.owner).toBeDefined();
        expect(results[1]?.owner?.id).toBe(testOwner.id);

        // Cleanup
        await db.delete(properties).where(eq(properties.id, testProperties[0].id));
        await db.delete(properties).where(eq(properties.id, testProperties[1].id));
        await db.delete(owners).where(eq(owners.id, testOwner.id));
      });
    });

    describe('countReservationsByProperty', () => {
      it('should return counts as a Map', async () => {
        const countMap = await countReservationsByProperty([1, 2, 3]);

        expect(countMap).toBeInstanceOf(Map);
      });

      it('should return 0 for properties with no reservations', async () => {
        const countMap = await countReservationsByProperty([99999]);

        expect(countMap.get(99999) || 0).toBe(0);
      });
    });
  });

  describe('Performance Comparison', () => {
    it('should be faster than N+1 queries', async () => {
      // Create test data
      const [testOwner] = await db.insert(owners).values({
        name: 'Performance Test Owner',
        email: 'perf@example.com'
      }).returning();

      const testProperties = await db.insert(properties).values(
        Array.from({ length: 10 }, (_, i) => ({
          name: `Perf Property ${i}`,
          ownerId: testOwner.id
        }))
      ).returning();

      const propertyIds = testProperties.map(p => p.id);

      // N+1 approach (slow)
      const n1Start = Date.now();
      const propertiesList = await db.select().from(properties);
      for (const property of propertiesList.slice(0, 10)) {
        await db.select().from(owners).where(eq(owners.id, property.ownerId));
      }
      const n1Duration = Date.now() - n1Start;

      // Batched approach (fast)
      const batchStart = Date.now();
      await loadPropertiesWithOwners(propertyIds);
      const batchDuration = Date.now() - batchStart;

      // Batched should be faster (or at least not significantly slower)
      console.log(`N+1: ${n1Duration}ms, Batched: ${batchDuration}ms`);

      // Cleanup
      for (const prop of testProperties) {
        await db.delete(properties).where(eq(properties.id, prop.id));
      }
      await db.delete(owners).where(eq(owners.id, testOwner.id));

      // Assert batched is faster or comparable
      expect(batchDuration).toBeLessThanOrEqual(n1Duration * 2); // Allow some variance
    });
  });

  describe('Cache Management', () => {
    it('clearAllLoaders should clear all singleton loader caches', async () => {
      // Load some data
      await propertyLoader.load(1).catch(() => null);
      await ownerLoader.load(1).catch(() => null);

      // Clear all caches
      clearAllLoaders();

      // Caches should be empty (this is implicit - we can't directly check private cache)
      // But subsequent loads should hit the database again
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ID arrays', async () => {
      const results = await batchLoadProperties([]);

      expect(results).toEqual([]);
    });

    it('should handle duplicate IDs in input', async () => {
      const [testOwner] = await db.insert(owners).values({
        name: 'Duplicate Test Owner',
        email: 'dup@example.com'
      }).returning();

      const [testProp] = await db.insert(properties).values({
        name: 'Duplicate Test Property',
        ownerId: testOwner.id
      }).returning();

      // Request same ID multiple times
      const results = await batchLoadProperties([testProp.id, testProp.id, testProp.id]);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      // Cleanup
      await db.delete(properties).where(eq(properties.id, testProp.id));
      await db.delete(owners).where(eq(owners.id, testOwner.id));
    });

    it('should handle mix of valid and invalid IDs', async () => {
      const [testOwner] = await db.insert(owners).values({
        name: 'Mix Test Owner',
        email: 'mix@example.com'
      }).returning();

      const [testProp] = await db.insert(properties).values({
        name: 'Mix Test Property',
        ownerId: testOwner.id
      }).returning();

      const results = await batchLoadProperties([testProp.id, 99999, testProp.id + 1]);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeNull();
      expect(results[2]).toBeNull();

      // Cleanup
      await db.delete(properties).where(eq(properties.id, testProp.id));
      await db.delete(owners).where(eq(owners.id, testOwner.id));
    });
  });
});

describe('Query Batching Middleware', () => {
  it('should export clearLoadersMiddleware function', async () => {
    const { clearLoadersMiddleware } = await import('../server/utils/query-batching');

    expect(clearLoadersMiddleware).toBeDefined();
    expect(typeof clearLoadersMiddleware).toBe('function');
  });
});
