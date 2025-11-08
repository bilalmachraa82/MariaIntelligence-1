/**
 * Query Batching Utilities - MariaIntelligence 2025
 *
 * Implements DataLoader-like batching and caching to solve N+1 query problems.
 * Reduces database round-trips by batching multiple individual queries into single operations.
 *
 * @example
 * // Instead of N queries (N+1 problem):
 * const properties = await db.query.properties.findMany();
 * for (const property of properties) {
 *   property.owner = await db.query.owners.findFirst({ where: eq(owners.id, property.ownerId) });
 * }
 *
 * // Do this (2 queries total):
 * const properties = await db.query.properties.findMany();
 * const owners = await Promise.all(
 *   properties.map(p => ownerLoader.load(p.ownerId))
 * );
 */

import { db } from '../db/index.js';
import {
  properties,
  owners,
  reservations,
  maintenanceTasks,
  financialDocuments,
  cleaningTeams,
  type Property,
  type Owner,
  type Reservation,
  type MaintenanceTask,
  type FinancialDocument,
  type CleaningTeam
} from '@shared/schema';
import { inArray, eq, sql } from 'drizzle-orm';

/**
 * Generic DataLoader-like utility for batching and caching database queries
 *
 * Features:
 * - Batches multiple load calls into a single database query
 * - Caches results within a single request cycle
 * - Maintains order of requested keys
 * - Handles missing/null values gracefully
 *
 * @template K - Key type (usually number for IDs)
 * @template V - Value type (the entity being loaded)
 */
export class BatchLoader<K, V> {
  private queue: Array<{ key: K; resolve: (value: V | null) => void; reject: (error: Error) => void }> = [];
  private cache = new Map<K, V | null>();
  private batchFn: (keys: K[]) => Promise<(V | null)[]>;
  private scheduled = false;
  private maxBatchSize: number;
  private batchWindowMs: number;

  /**
   * Create a new BatchLoader
   * @param batchFn - Function that loads multiple items by keys
   * @param options - Configuration options
   */
  constructor(
    batchFn: (keys: K[]) => Promise<(V | null)[]>,
    options: {
      maxBatchSize?: number;      // Maximum keys per batch (default: 100)
      batchWindowMs?: number;      // Time to wait before dispatching (default: 10ms)
    } = {}
  ) {
    this.batchFn = batchFn;
    this.maxBatchSize = options.maxBatchSize || 100;
    this.batchWindowMs = options.batchWindowMs || 10;
  }

  /**
   * Load a single item by key
   * Batches multiple calls and caches the result
   */
  load(key: K): Promise<V | null> {
    // Check cache first (within-request cache)
    if (this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key)!);
    }

    // Add to queue for batching
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      // Schedule batch dispatch if not already scheduled
      if (!this.scheduled) {
        this.scheduled = true;

        // Use setImmediate for better performance than process.nextTick
        // nextTick runs before I/O, setImmediate runs after
        if (this.batchWindowMs === 0) {
          setImmediate(() => this.dispatchQueue());
        } else {
          setTimeout(() => this.dispatchQueue(), this.batchWindowMs);
        }
      }
    });
  }

  /**
   * Load multiple items by keys
   * More efficient than calling load() multiple times
   */
  async loadMany(keys: K[]): Promise<(V | null)[]> {
    return Promise.all(keys.map(key => this.load(key)));
  }

  /**
   * Dispatch queued loads as a batch
   * @private
   */
  private async dispatchQueue() {
    this.scheduled = false;
    const queue = this.queue;
    this.queue = [];

    if (queue.length === 0) return;

    try {
      // Split into chunks if exceeds max batch size
      const chunks = this.chunkArray(queue, this.maxBatchSize);

      for (const chunk of chunks) {
        const keys = chunk.map(item => item.key);
        const values = await this.batchFn(keys);

        // Cache and resolve each item
        chunk.forEach((item, index) => {
          const value = values[index];
          this.cache.set(item.key, value);
          item.resolve(value);
        });
      }
    } catch (error) {
      // Reject all pending requests
      queue.forEach(item => item.reject(error as Error));
    }
  }

  /**
   * Clear the cache
   * Call this at the end of each request cycle
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Prime the cache with a known value
   * Useful when you already have the data
   */
  prime(key: K, value: V | null) {
    this.cache.set(key, value);
  }

  /**
   * Helper to chunk array into smaller arrays
   * @private
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Batch load properties by IDs
 * Executes 1 query instead of N queries
 */
export async function batchLoadProperties(ids: number[]): Promise<(Property | null)[]> {
  if (ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids));

  const results = await db
    .select()
    .from(properties)
    .where(inArray(properties.id, uniqueIds));

  // Create a map for O(1) lookup
  const map = new Map(results.map(p => [p.id, p]));

  // Return in original order, null for missing items
  return ids.map(id => map.get(id) || null);
}

/**
 * Batch load owners by IDs
 */
export async function batchLoadOwners(ids: number[]): Promise<(Owner | null)[]> {
  if (ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids));

  const results = await db
    .select()
    .from(owners)
    .where(inArray(owners.id, uniqueIds));

  const map = new Map(results.map(o => [o.id, o]));
  return ids.map(id => map.get(id) || null);
}

/**
 * Batch load reservations by property IDs
 * Returns array of arrays (one array per property)
 */
export async function batchLoadReservationsByPropertyId(
  propertyIds: number[]
): Promise<Reservation[][]> {
  if (propertyIds.length === 0) return [];

  const uniqueIds = Array.from(new Set(propertyIds));

  const results = await db
    .select()
    .from(reservations)
    .where(inArray(reservations.propertyId, uniqueIds))
    .orderBy(reservations.checkInDate);

  // Group by property ID
  const grouped = new Map<number, Reservation[]>();
  uniqueIds.forEach(id => grouped.set(id, []));

  results.forEach(reservation => {
    const list = grouped.get(reservation.propertyId);
    if (list) list.push(reservation);
  });

  // Return in original order
  return propertyIds.map(id => grouped.get(id) || []);
}

/**
 * Batch load reservations by IDs
 */
export async function batchLoadReservations(ids: number[]): Promise<(Reservation | null)[]> {
  if (ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids));

  const results = await db
    .select()
    .from(reservations)
    .where(inArray(reservations.id, uniqueIds));

  const map = new Map(results.map(r => [r.id, r]));
  return ids.map(id => map.get(id) || null);
}

/**
 * Batch load maintenance tasks by property IDs
 */
export async function batchLoadMaintenanceTasksByPropertyId(
  propertyIds: number[]
): Promise<MaintenanceTask[][]> {
  if (propertyIds.length === 0) return [];

  const uniqueIds = Array.from(new Set(propertyIds));

  const results = await db
    .select()
    .from(maintenanceTasks)
    .where(inArray(maintenanceTasks.propertyId, uniqueIds))
    .orderBy(maintenanceTasks.dueDate);

  const grouped = new Map<number, MaintenanceTask[]>();
  uniqueIds.forEach(id => grouped.set(id, []));

  results.forEach(task => {
    const list = grouped.get(task.propertyId);
    if (list) list.push(task);
  });

  return propertyIds.map(id => grouped.get(id) || []);
}

/**
 * Batch load cleaning teams by IDs
 */
export async function batchLoadCleaningTeams(ids: number[]): Promise<(CleaningTeam | null)[]> {
  if (ids.length === 0) return [];

  const uniqueIds = Array.from(new Set(ids)).filter(id => id !== null);

  const results = await db
    .select()
    .from(cleaningTeams)
    .where(inArray(cleaningTeams.id, uniqueIds));

  const map = new Map(results.map(t => [t.id, t]));
  return ids.map(id => id ? (map.get(id) || null) : null);
}

/**
 * Batch load financial documents by entity
 */
export async function batchLoadFinancialDocumentsByEntity(
  entityType: string,
  entityIds: number[]
): Promise<FinancialDocument[][]> {
  if (entityIds.length === 0) return [];

  const uniqueIds = Array.from(new Set(entityIds));

  const results = await db
    .select()
    .from(financialDocuments)
    .where(
      sql`${financialDocuments.relatedEntityType} = ${entityType} AND ${financialDocuments.relatedEntityId} IN ${uniqueIds}`
    );

  const grouped = new Map<number, FinancialDocument[]>();
  uniqueIds.forEach(id => grouped.set(id, []));

  results.forEach(doc => {
    if (doc.relatedEntityId) {
      const list = grouped.get(doc.relatedEntityId);
      if (list) list.push(doc);
    }
  });

  return entityIds.map(id => grouped.get(id) || []);
}

// ============================================================================
// Singleton Loaders - Create once, reuse throughout the application
// ============================================================================

/**
 * Global property loader
 * Use this to batch-load properties by ID
 *
 * @example
 * const property = await propertyLoader.load(propertyId);
 * const multipleProperties = await propertyLoader.loadMany([id1, id2, id3]);
 */
export const propertyLoader = new BatchLoader<number, Property>(
  batchLoadProperties,
  { maxBatchSize: 100, batchWindowMs: 10 }
);

/**
 * Global owner loader
 * Use this to batch-load owners by ID
 */
export const ownerLoader = new BatchLoader<number, Owner>(
  batchLoadOwners,
  { maxBatchSize: 100, batchWindowMs: 10 }
);

/**
 * Global reservation loader
 * Use this to batch-load individual reservations by ID
 */
export const reservationLoader = new BatchLoader<number, Reservation>(
  batchLoadReservations,
  { maxBatchSize: 100, batchWindowMs: 10 }
);

/**
 * Global cleaning team loader
 */
export const cleaningTeamLoader = new BatchLoader<number, CleaningTeam>(
  batchLoadCleaningTeams,
  { maxBatchSize: 50, batchWindowMs: 10 }
);

// ============================================================================
// Middleware to clear loaders at the end of each request
// ============================================================================

/**
 * Express middleware to clear all loader caches after each request
 * Add this to your app to prevent memory leaks and stale data
 *
 * @example
 * app.use(clearLoadersMiddleware);
 */
export function clearLoadersMiddleware(_req: any, _res: any, next: any) {
  // Clear on response finish
  _res.on('finish', () => {
    propertyLoader.clearCache();
    ownerLoader.clearCache();
    reservationLoader.clearCache();
    cleaningTeamLoader.clearCache();
  });

  next();
}

// ============================================================================
// Prepared Statements for Frequently Used Queries
// ============================================================================

/**
 * Prepared statement for getting property by ID
 * More efficient than dynamic queries when called repeatedly
 */
export const getPropertyByIdPrepared = db
  .select()
  .from(properties)
  .where(eq(properties.id, sql.placeholder('id')))
  .prepare('get_property_by_id');

/**
 * Prepared statement for getting owner by ID
 */
export const getOwnerByIdPrepared = db
  .select()
  .from(owners)
  .where(eq(owners.id, sql.placeholder('id')))
  .prepare('get_owner_by_id');

/**
 * Prepared statement for getting reservations by property ID
 */
export const getReservationsByPropertyIdPrepared = db
  .select()
  .from(reservations)
  .where(eq(reservations.propertyId, sql.placeholder('propertyId')))
  .orderBy(reservations.checkInDate)
  .prepare('get_reservations_by_property_id');

/**
 * Prepared statement for getting active properties
 */
export const getActivePropertiesPrepared = db
  .select()
  .from(properties)
  .where(eq(properties.active, true))
  .prepare('get_active_properties');

/**
 * Prepared statement for getting property with owner (using join)
 */
export const getPropertyWithOwnerPrepared = db
  .select({
    property: properties,
    owner: owners
  })
  .from(properties)
  .leftJoin(owners, eq(properties.ownerId, owners.id))
  .where(eq(properties.id, sql.placeholder('id')))
  .prepare('get_property_with_owner');

// ============================================================================
// Helper Functions for Common Patterns
// ============================================================================

/**
 * Load properties with their owners (optimized)
 * Demonstrates how to use loaders to avoid N+1 queries
 *
 * @example
 * const propertiesWithOwners = await loadPropertiesWithOwners([1, 2, 3]);
 */
export async function loadPropertiesWithOwners(propertyIds: number[]) {
  // Load all properties in batch
  const propertiesArray = await propertyLoader.loadMany(propertyIds);

  // Extract owner IDs
  const ownerIds = propertiesArray
    .filter((p): p is Property => p !== null)
    .map(p => p.ownerId);

  // Load all owners in batch (single query)
  const ownersArray = await ownerLoader.loadMany(ownerIds);

  // Combine results
  return propertiesArray.map((property, index) => {
    if (!property) return null;
    return {
      ...property,
      owner: ownersArray[index]
    };
  });
}

/**
 * Load properties with their reservations (optimized)
 *
 * @example
 * const propertiesWithReservations = await loadPropertiesWithReservations([1, 2, 3]);
 */
export async function loadPropertiesWithReservations(propertyIds: number[]) {
  // Load properties and reservations in parallel
  const [propertiesArray, reservationsArray] = await Promise.all([
    propertyLoader.loadMany(propertyIds),
    batchLoadReservationsByPropertyId(propertyIds)
  ]);

  // Combine results
  return propertiesArray.map((property, index) => {
    if (!property) return null;
    return {
      ...property,
      reservations: reservationsArray[index]
    };
  });
}

/**
 * Load complete property details (property + owner + reservations)
 * Demonstrates complex batching with multiple relations
 *
 * @example
 * const fullPropertyData = await loadCompletePropertyDetails([1, 2, 3]);
 */
export async function loadCompletePropertyDetails(propertyIds: number[]) {
  // Step 1: Load properties
  const propertiesArray = await propertyLoader.loadMany(propertyIds);

  // Step 2: Extract all related IDs
  const ownerIds = propertiesArray
    .filter((p): p is Property => p !== null)
    .map(p => p.ownerId);

  // Step 3: Load all related data in parallel (single query per type)
  const [ownersArray, reservationsArray, maintenanceTasksArray] = await Promise.all([
    ownerLoader.loadMany(ownerIds),
    batchLoadReservationsByPropertyId(propertyIds),
    batchLoadMaintenanceTasksByPropertyId(propertyIds)
  ]);

  // Step 4: Combine all data
  return propertiesArray.map((property, index) => {
    if (!property) return null;
    return {
      ...property,
      owner: ownersArray[index],
      reservations: reservationsArray[index],
      maintenanceTasks: maintenanceTasksArray[index]
    };
  });
}

/**
 * Efficiently count reservations per property
 * Uses SQL aggregation instead of loading all reservations
 */
export async function countReservationsByProperty(propertyIds: number[]) {
  if (propertyIds.length === 0) return new Map<number, number>();

  const uniqueIds = Array.from(new Set(propertyIds));

  const results = await db
    .select({
      propertyId: reservations.propertyId,
      count: sql<number>`count(*)::int`
    })
    .from(reservations)
    .where(inArray(reservations.propertyId, uniqueIds))
    .groupBy(reservations.propertyId);

  // Return as Map for easy lookup
  return new Map(results.map(r => [r.propertyId, r.count]));
}

/**
 * Export all loaders for convenience
 */
export const loaders = {
  property: propertyLoader,
  owner: ownerLoader,
  reservation: reservationLoader,
  cleaningTeam: cleaningTeamLoader
};

/**
 * Clear all loader caches
 * Call this at the end of each request
 */
export function clearAllLoaders() {
  propertyLoader.clearCache();
  ownerLoader.clearCache();
  reservationLoader.clearCache();
  cleaningTeamLoader.clearCache();
}
