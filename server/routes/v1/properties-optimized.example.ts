/**
 * Properties Routes with Query Batching - MariaIntelligence 2025
 *
 * EXAMPLE FILE: Demonstrates how to apply query batching to eliminate N+1 problems
 * This is an optimized version showing before/after patterns
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { asyncHandler } from '../../utils/response.utils.js';
import { sendSuccessResponse, sendPaginatedResponse } from '../../utils/response.utils.js';
import { db } from '../../db/index.js';
import { properties, owners, reservations } from '@shared/schema';
import { eq, inArray, and } from 'drizzle-orm';

// Import query batching utilities
import {
  propertyLoader,
  ownerLoader,
  loadPropertiesWithOwners,
  loadPropertiesWithReservations,
  loadCompletePropertyDetails,
  countReservationsByProperty,
  batchLoadReservationsByPropertyId
} from '../../utils/query-batching.js';

const router = Router();

// ============================================================================
// EXAMPLE 1: Basic Property List with Owners (N+1 Problem Solution)
// ============================================================================

/**
 * ❌ BEFORE - N+1 Problem (1 + N queries)
 */
router.get('/properties-slow', asyncHandler(async (req, res) => {
  // Query 1: Get all properties
  const propertiesList = await db.select().from(properties);

  // Queries 2-N: Get owner for each property (N additional queries!)
  for (const property of propertiesList) {
    const owner = await db
      .select()
      .from(owners)
      .where(eq(owners.id, property.ownerId))
      .limit(1);

    (property as any).owner = owner[0];
  }

  return sendSuccessResponse(res, propertiesList, 'Properties retrieved');
}));

/**
 * ✅ AFTER - Using Batch Loader (2 queries total)
 */
router.get('/properties-fast', asyncHandler(async (req, res) => {
  // Query 1: Get all properties
  const propertiesList = await db.select().from(properties);

  // Query 2: Batch load all owners in a single query
  const propertyOwners = await Promise.all(
    propertiesList.map(p => ownerLoader.load(p.ownerId))
  );

  // Combine results
  const propertiesWithOwners = propertiesList.map((property, index) => ({
    ...property,
    owner: propertyOwners[index]
  }));

  return sendSuccessResponse(res, propertiesWithOwners, 'Properties retrieved');
}));

/**
 * ✅ BETTER - Using helper function
 */
router.get('/properties-optimal', asyncHandler(async (req, res) => {
  // Get all properties
  const propertiesList = await db.select().from(properties);
  const propertyIds = propertiesList.map(p => p.id);

  // Use helper that handles all batching (2 queries)
  const propertiesWithOwners = await loadPropertiesWithOwners(propertyIds);

  return sendSuccessResponse(res, propertiesWithOwners, 'Properties retrieved');
}));

// ============================================================================
// EXAMPLE 2: Properties with Reservation Counts
// ============================================================================

/**
 * ❌ BEFORE - Multiple queries
 */
router.get('/properties-with-counts-slow', asyncHandler(async (req, res) => {
  const propertiesList = await db.select().from(properties);

  // N additional queries to count reservations
  for (const property of propertiesList) {
    const reservationList = await db
      .select()
      .from(reservations)
      .where(eq(reservations.propertyId, property.id));

    (property as any).reservationCount = reservationList.length;
  }

  return sendSuccessResponse(res, propertiesList, 'Properties retrieved');
}));

/**
 * ✅ AFTER - Using batch counting (2 queries)
 */
router.get('/properties-with-counts-fast', asyncHandler(async (req, res) => {
  // Query 1: Get all properties
  const propertiesList = await db.select().from(properties);
  const propertyIds = propertiesList.map(p => p.id);

  // Query 2: Get counts for all properties in one query (using aggregation)
  const countMap = await countReservationsByProperty(propertyIds);

  // Combine results
  const propertiesWithCounts = propertiesList.map(property => ({
    ...property,
    reservationCount: countMap.get(property.id) || 0
  }));

  return sendSuccessResponse(res, propertiesWithCounts, 'Properties retrieved');
}));

// ============================================================================
// EXAMPLE 3: Complete Property Details (Multiple Relations)
// ============================================================================

/**
 * ❌ BEFORE - Many queries (1 + 2N queries)
 */
router.get('/properties/:id/complete-slow', asyncHandler(async (req, res) => {
  const propertyId = Number(req.params.id);

  // Query 1: Get property
  const property = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1)
    .then(r => r[0]);

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  // Query 2: Get owner
  const owner = await db
    .select()
    .from(owners)
    .where(eq(owners.id, property.ownerId))
    .limit(1)
    .then(r => r[0]);

  // Query 3: Get reservations
  const reservationsList = await db
    .select()
    .from(reservations)
    .where(eq(reservations.propertyId, propertyId));

  const result = {
    ...property,
    owner,
    reservations: reservationsList
  };

  return sendSuccessResponse(res, result, 'Property details retrieved');
}));

/**
 * ✅ AFTER - Parallel queries (3 queries total, run in parallel)
 */
router.get('/properties/:id/complete-fast', asyncHandler(async (req, res) => {
  const propertyId = Number(req.params.id);

  // Load property
  const property = await propertyLoader.load(propertyId);

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  // Load owner and reservations in parallel
  const [owner, reservationsList] = await Promise.all([
    ownerLoader.load(property.ownerId),
    batchLoadReservationsByPropertyId([propertyId]).then(r => r[0])
  ]);

  const result = {
    ...property,
    owner,
    reservations: reservationsList
  };

  return sendSuccessResponse(res, result, 'Property details retrieved');
}));

// ============================================================================
// EXAMPLE 4: Dashboard Endpoint with Multiple Data Types
// ============================================================================

/**
 * ❌ BEFORE - Sequential loading (slow)
 */
router.get('/dashboard-slow', asyncHandler(async (req, res) => {
  // Load everything sequentially
  const propertiesList = await db.select().from(properties);

  // For each property, load owner (N queries)
  for (const property of propertiesList) {
    const owner = await db
      .select()
      .from(owners)
      .where(eq(owners.id, property.ownerId))
      .limit(1);
    (property as any).owner = owner[0];
  }

  // For each property, load reservations (N more queries)
  for (const property of propertiesList) {
    const reservationsList = await db
      .select()
      .from(reservations)
      .where(eq(reservations.propertyId, property.id));
    (property as any).reservations = reservationsList;
  }

  return sendSuccessResponse(res, propertiesList, 'Dashboard data retrieved');
}));

/**
 * ✅ AFTER - Parallel batched loading (3 queries total)
 */
router.get('/dashboard-fast', asyncHandler(async (req, res) => {
  // Query 1: Get all properties
  const propertiesList = await db.select().from(properties);
  const propertyIds = propertiesList.map(p => p.id);
  const ownerIds = [...new Set(propertiesList.map(p => p.ownerId))];

  // Queries 2-3: Load owners and reservations in parallel
  const [ownersMap, reservationsArrays] = await Promise.all([
    // Batch load all owners
    ownerLoader.loadMany(ownerIds).then(ownersArray => {
      const map = new Map<number, any>();
      propertiesList.forEach((p, i) => {
        map.set(p.ownerId, ownersArray[i]);
      });
      return map;
    }),
    // Batch load all reservations
    batchLoadReservationsByPropertyId(propertyIds)
  ]);

  // Combine all data
  const dashboardData = propertiesList.map((property, index) => ({
    ...property,
    owner: ownersMap.get(property.ownerId),
    reservations: reservationsArrays[index]
  }));

  return sendSuccessResponse(res, dashboardData, 'Dashboard data retrieved');
}));

/**
 * ✅ BEST - Using helper function
 */
router.get('/dashboard-optimal', asyncHandler(async (req, res) => {
  // Get all properties
  const propertiesList = await db.select().from(properties);
  const propertyIds = propertiesList.map(p => p.id);

  // Load complete data with helper (3 queries, all optimized)
  const dashboardData = await loadCompletePropertyDetails(propertyIds);

  return sendSuccessResponse(res, dashboardData, 'Dashboard data retrieved');
}));

// ============================================================================
// EXAMPLE 5: Paginated Results with Batching
// ============================================================================

/**
 * ✅ Paginated properties with owners (optimal)
 */
router.get('/properties-paginated', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Query 1: Get paginated properties
  const propertiesList = await db
    .select()
    .from(properties)
    .limit(limit)
    .offset(offset);

  // Query 2: Get total count (run in parallel)
  const [total] = await db
    .select({ count: db.$count(properties) })
    .from(properties);

  // Query 3: Batch load owners for this page
  const propertyIds = propertiesList.map(p => p.id);
  const propertiesWithOwners = await loadPropertiesWithOwners(propertyIds);

  return sendPaginatedResponse(
    res,
    propertiesWithOwners,
    {
      page,
      limit,
      total: total.count
    },
    'Properties retrieved successfully'
  );
}));

// ============================================================================
// EXAMPLE 6: Filtered Properties with Complex Relations
// ============================================================================

/**
 * ✅ Filtered and sorted with batching
 */
router.get('/properties-filtered', asyncHandler(async (req, res) => {
  const { active, ownerId } = req.query;

  // Build query with filters
  const conditions = [];
  if (active !== undefined) {
    conditions.push(eq(properties.active, active === 'true'));
  }
  if (ownerId) {
    conditions.push(eq(properties.ownerId, Number(ownerId)));
  }

  // Query 1: Get filtered properties
  const propertiesList = await db
    .select()
    .from(properties)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // If results are empty, return early
  if (propertiesList.length === 0) {
    return sendSuccessResponse(res, [], 'No properties found');
  }

  const propertyIds = propertiesList.map(p => p.id);

  // Queries 2-4: Batch load all relations in parallel
  const [propertiesWithOwners, reservationCounts] = await Promise.all([
    loadPropertiesWithOwners(propertyIds),
    countReservationsByProperty(propertyIds)
  ]);

  // Combine data
  const results = propertiesWithOwners.map((property) => {
    if (!property) return null;
    return {
      ...property,
      reservationCount: reservationCounts.get(property.id) || 0
    };
  }).filter(Boolean);

  return sendSuccessResponse(res, results, 'Properties retrieved');
}));

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

/**
 * Endpoint to test performance difference
 * Access: GET /api/v1/properties-optimized-example/performance-test?fast=true
 */
router.get('/performance-test', asyncHandler(async (req, res) => {
  const useFast = req.query.fast === 'true';
  const startTime = Date.now();

  if (!useFast) {
    // Slow version - N+1 queries
    const propertiesList = await db.select().from(properties).limit(20);

    for (const property of propertiesList) {
      const owner = await db
        .select()
        .from(owners)
        .where(eq(owners.id, property.ownerId))
        .limit(1);
      (property as any).owner = owner[0];

      const reservationsList = await db
        .select()
        .from(reservations)
        .where(eq(reservations.propertyId, property.id));
      (property as any).reservations = reservationsList;
    }

    const elapsed = Date.now() - startTime;
    return sendSuccessResponse(res, {
      method: 'slow',
      elapsed: `${elapsed}ms`,
      queriesCount: `1 + ${propertiesList.length} + ${propertiesList.length} = ${1 + propertiesList.length * 2}`,
      properties: propertiesList
    }, 'Performance test completed');

  } else {
    // Fast version - batched queries
    const propertiesList = await db.select().from(properties).limit(20);
    const propertyIds = propertiesList.map(p => p.id);

    const results = await loadCompletePropertyDetails(propertyIds);

    const elapsed = Date.now() - startTime;
    return sendSuccessResponse(res, {
      method: 'fast',
      elapsed: `${elapsed}ms`,
      queriesCount: '3 (batched)',
      properties: results
    }, 'Performance test completed');
  }
}));

export { router as propertiesOptimizedExampleRoutes };

/**
 * KEY TAKEAWAYS:
 *
 * 1. N+1 Problem:
 *    - Occurs when loading a list and then loading related data for each item
 *    - Results in 1 + N database queries
 *    - Severely impacts performance with large datasets
 *
 * 2. Batching Solution:
 *    - Load all items first
 *    - Extract all related IDs
 *    - Load all related data in a single query using WHERE IN
 *    - Combine results in application code
 *
 * 3. Performance Impact:
 *    - N+1: 1 + 100 = 101 queries for 100 properties with owners
 *    - Batched: 2 queries total (no matter how many properties)
 *    - Typical speedup: 10-50x faster
 *
 * 4. When to Use:
 *    - Any time you load a list and then load related data
 *    - Dashboard endpoints with multiple data types
 *    - API responses that include nested relations
 *    - Reports and analytics endpoints
 *
 * 5. Best Practices:
 *    - Use loaders for single-item lookups (they auto-batch)
 *    - Use helper functions for complex multi-relation loads
 *    - Clear loader cache at the end of each request
 *    - Use prepared statements for frequently-called queries
 *    - Consider using SQL JOINs for simple 1-to-1 relations
 */
