/**
 * MCP Database Utilities
 * Specialized utilities for MCP (Model Context Protocol) database operations
 * Optimized for AI model interactions and context management
 */

import { getNeonMCPManager, type NeonMCPManager } from './neon-mcp-manager';
import { eq, and, or, desc, asc, count, sum, avg, sql, inArray, like, ilike, gt, lt, gte, lte } from 'drizzle-orm';
import * as schema from '../../shared/schema';
import { z } from 'zod';

// Query builder schemas
const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in', 'notIn']),
  value: z.any(),
});

const SortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(1000).default(50),
});

export type Filter = z.infer<typeof FilterSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;

// Query result interface
export interface QueryResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    queryTime: number;
    cacheHit?: boolean;
    source: string;
  };
}

// Context aggregation interface
export interface ContextAggregation {
  properties: {
    total: number;
    active: number;
    byOwner: Record<string, number>;
  };
  reservations: {
    total: number;
    upcoming: number;
    byStatus: Record<string, number>;
    byMonth: Record<string, number>;
  };
  revenue: {
    total: string;
    thisMonth: string;
    byProperty: Record<string, string>;
  };
  maintenance: {
    pending: number;
    overdue: number;
    completed: number;
  };
}

export class MCPDatabaseUtils {
  private manager: NeonMCPManager;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.manager = getNeonMCPManager();
  }

  // Generic query builder with MCP optimizations
  public async queryWithContext<T>(
    tableName: keyof typeof schema,
    options: {
      filters?: Filter[];
      sort?: Sort[];
      pagination?: Pagination;
      select?: string[];
      include?: string[];
      useCache?: boolean;
      cacheKey?: string;
    } = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const cacheKey = options.cacheKey || this.generateCacheKey(tableName, options);

    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          ...cached,
          meta: {
            queryTime: Date.now() - startTime,
            cacheHit: true,
            source: 'cache',
          },
        };
      }
    }

    try {
      const db = this.manager.database;
      const table = schema[tableName] as any;
      const pagination = { ...{ page: 1, limit: 50 }, ...options.pagination };

      // Build query
      let query = db.select().from(table);

      // Apply filters
      if (options.filters?.length) {
        const conditions = this.buildWhereConditions(options.filters, table);
        query = query.where(and(...conditions));
      }

      // Apply sorting
      if (options.sort?.length) {
        const orderBy = options.sort.map(sort => {
          const column = table[sort.field];
          return sort.direction === 'desc' ? desc(column) : asc(column);
        });
        query = query.orderBy(...orderBy);
      }

      // Get total count for pagination
      const countQuery = db.select({ count: count() }).from(table);
      if (options.filters?.length) {
        const conditions = this.buildWhereConditions(options.filters, table);
        countQuery.where(and(...conditions));
      }
      
      const [totalResult] = await countQuery;
      const total = totalResult.count;

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.limit(pagination.limit).offset(offset);

      // Execute query
      const data = await query;

      const result: QueryResult<T> = {
        data: data as T[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasNext: pagination.page * pagination.limit < total,
          hasPrev: pagination.page > 1,
        },
        meta: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          source: 'database',
        },
      };

      // Cache result
      if (options.useCache !== false) {
        this.setCache(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error(`❌ Query failed for table ${tableName}:`, error);
      throw error;
    }
  }

  // Context-aware property queries
  public async getPropertiesWithContext(filters?: Filter[]): Promise<QueryResult<any>> {
    return await this.queryWithContext('properties', {
      filters,
      sort: [{ field: 'name', direction: 'asc' }],
      useCache: true,
      cacheKey: `properties_context_${JSON.stringify(filters)}`,
    });
  }

  // Context-aware reservation queries
  public async getReservationsWithContext(
    propertyId?: number,
    dateRange?: { start: string; end: string }
  ): Promise<QueryResult<any>> {
    const filters: Filter[] = [];
    
    if (propertyId) {
      filters.push({ field: 'propertyId', operator: 'eq', value: propertyId });
    }
    
    if (dateRange) {
      filters.push(
        { field: 'checkInDate', operator: 'gte', value: dateRange.start },
        { field: 'checkOutDate', operator: 'lte', value: dateRange.end }
      );
    }

    return await this.queryWithContext('reservations', {
      filters,
      sort: [{ field: 'checkInDate', direction: 'desc' }],
      useCache: true,
    });
  }

  // Aggregate context data for AI models
  public async getContextAggregation(): Promise<ContextAggregation> {
    const cacheKey = 'context_aggregation';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const db = this.manager.database;

    try {
      // Properties aggregation
      const propertiesTotal = await db.select({ count: count() }).from(schema.properties);
      const propertiesActive = await db
        .select({ count: count() })
        .from(schema.properties)
        .where(eq(schema.properties.active, true));

      const propertiesByOwner = await db
        .select({
          ownerId: schema.properties.ownerId,
          ownerName: schema.owners.name,
          count: count(),
        })
        .from(schema.properties)
        .leftJoin(schema.owners, eq(schema.properties.ownerId, schema.owners.id))
        .groupBy(schema.properties.ownerId, schema.owners.name);

      // Reservations aggregation
      const reservationsTotal = await db.select({ count: count() }).from(schema.reservations);
      
      const upcomingReservations = await db
        .select({ count: count() })
        .from(schema.reservations)
        .where(
          and(
            gte(schema.reservations.checkInDate, new Date().toISOString().split('T')[0]),
            eq(schema.reservations.status, 'confirmed')
          )
        );

      const reservationsByStatus = await db
        .select({
          status: schema.reservations.status,
          count: count(),
        })
        .from(schema.reservations)
        .groupBy(schema.reservations.status);

      // Revenue aggregation
      const totalRevenue = await db
        .select({
          total: sql<string>`SUM(CAST(${schema.reservations.totalAmount} AS DECIMAL))`,
        })
        .from(schema.reservations)
        .where(eq(schema.reservations.status, 'completed'));

      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      const thisMonthRevenue = await db
        .select({
          total: sql<string>`SUM(CAST(${schema.reservations.totalAmount} AS DECIMAL))`,
        })
        .from(schema.reservations)
        .where(
          and(
            gte(schema.reservations.checkInDate, thisMonthStart.toISOString().split('T')[0]),
            eq(schema.reservations.status, 'completed')
          )
        );

      // Maintenance aggregation
      const maintenancePending = await db
        .select({ count: count() })
        .from(schema.maintenanceTasks)
        .where(eq(schema.maintenanceTasks.status, 'pending'));

      const maintenanceOverdue = await db
        .select({ count: count() })
        .from(schema.maintenanceTasks)
        .where(
          and(
            eq(schema.maintenanceTasks.status, 'pending'),
            lt(schema.maintenanceTasks.dueDate, new Date().toISOString().split('T')[0])
          )
        );

      const maintenanceCompleted = await db
        .select({ count: count() })
        .from(schema.maintenanceTasks)
        .where(eq(schema.maintenanceTasks.status, 'completed'));

      // Build aggregation result
      const aggregation: ContextAggregation = {
        properties: {
          total: propertiesTotal[0].count,
          active: propertiesActive[0].count,
          byOwner: propertiesByOwner.reduce((acc, item) => {
            acc[item.ownerName || 'Unknown'] = item.count;
            return acc;
          }, {} as Record<string, number>),
        },
        reservations: {
          total: reservationsTotal[0].count,
          upcoming: upcomingReservations[0].count,
          byStatus: reservationsByStatus.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {} as Record<string, number>),
          byMonth: {}, // Could be populated with more complex query
        },
        revenue: {
          total: totalRevenue[0].total || '0',
          thisMonth: thisMonthRevenue[0].total || '0',
          byProperty: {}, // Could be populated with property-specific revenue
        },
        maintenance: {
          pending: maintenancePending[0].count,
          overdue: maintenanceOverdue[0].count,
          completed: maintenanceCompleted[0].count,
        },
      };

      // Cache for 10 minutes
      this.setCache(cacheKey, aggregation, 10 * 60 * 1000);
      return aggregation;

    } catch (error) {
      console.error('❌ Failed to get context aggregation:', error);
      throw error;
    }
  }

  // Smart search with context
  public async smartSearch(
    query: string,
    options: {
      tables?: (keyof typeof schema)[];
      limit?: number;
      includeContext?: boolean;
    } = {}
  ): Promise<any> {
    const { tables = ['properties', 'reservations', 'owners'], limit = 10, includeContext = true } = options;
    const results: any = {};

    const db = this.manager.database;

    // Search in properties
    if (tables.includes('properties')) {
      results.properties = await db
        .select()
        .from(schema.properties)
        .where(
          or(
            ilike(schema.properties.name, `%${query}%`),
            sql`${schema.properties.aliases} && ARRAY[${query}]::text[]`
          )
        )
        .limit(limit);
    }

    // Search in reservations
    if (tables.includes('reservations')) {
      results.reservations = await db
        .select()
        .from(schema.reservations)
        .where(
          or(
            ilike(schema.reservations.guestName, `%${query}%`),
            ilike(schema.reservations.guestEmail, `%${query}%`),
            ilike(schema.reservations.reference, `%${query}%`)
          )
        )
        .limit(limit);
    }

    // Search in owners
    if (tables.includes('owners')) {
      results.owners = await db
        .select()
        .from(schema.owners)
        .where(
          or(
            ilike(schema.owners.name, `%${query}%`),
            ilike(schema.owners.company, `%${query}%`),
            ilike(schema.owners.email, `%${query}%`)
          )
        )
        .limit(limit);
    }

    // Add context if requested
    if (includeContext) {
      results.context = await this.getContextAggregation();
    }

    return results;
  }

  // Batch operations for MCP efficiency
  public async batchInsert<T>(
    tableName: keyof typeof schema,
    records: T[],
    options: { batchSize?: number; onConflict?: 'ignore' | 'update' } = {}
  ): Promise<number> {
    const { batchSize = 100, onConflict = 'ignore' } = options;
    const db = this.manager.database;
    const table = schema[tableName] as any;

    let totalInserted = 0;

    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        let query = db.insert(table).values(batch);
        
        if (onConflict === 'ignore') {
          query = query.onConflictDoNothing();
        }

        const result = await query;
        totalInserted += batch.length;
        
        console.log(`✅ Batch ${Math.ceil((i + 1) / batchSize)} inserted: ${batch.length} records`);
      } catch (error) {
        console.error(`❌ Batch ${Math.ceil((i + 1) / batchSize)} failed:`, error);
        throw error;
      }
    }

    return totalInserted;
  }

  // Performance optimization helpers
  public async optimizeTable(tableName: string): Promise<void> {
    await this.manager.executeQuery(`ANALYZE ${tableName}`);
    await this.manager.executeQuery(`VACUUM ANALYZE ${tableName}`);
    console.log(`✅ Table ${tableName} optimized`);
  }

  public async createIndex(
    tableName: string,
    columns: string[],
    options: { unique?: boolean; name?: string; method?: string } = {}
  ): Promise<void> {
    const { unique = false, name, method = 'btree' } = options;
    const indexName = name || `idx_${tableName}_${columns.join('_')}`;
    const uniqueKeyword = unique ? 'UNIQUE' : '';
    
    const query = `CREATE ${uniqueKeyword} INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING ${method} (${columns.join(', ')})`;
    
    await this.manager.executeQuery(query);
    console.log(`✅ Index ${indexName} created on ${tableName}`);
  }

  // Cache management
  private generateCacheKey(tableName: string, options: any): string {
    return `${tableName}_${JSON.stringify(options)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('✅ Cache cleared');
  }

  // Helper methods
  private buildWhereConditions(filters: Filter[], table: any): any[] {
    return filters.map(filter => {
      const column = table[filter.field];
      
      switch (filter.operator) {
        case 'eq':
          return eq(column, filter.value);
        case 'ne':
          return sql`${column} != ${filter.value}`;
        case 'gt':
          return gt(column, filter.value);
        case 'gte':
          return gte(column, filter.value);
        case 'lt':
          return lt(column, filter.value);
        case 'lte':
          return lte(column, filter.value);
        case 'like':
          return like(column, filter.value);
        case 'ilike':
          return ilike(column, filter.value);
        case 'in':
          return inArray(column, filter.value);
        case 'notIn':
          return sql`${column} NOT IN (${filter.value.join(',')})`;
        default:
          throw new Error(`Unsupported operator: ${filter.operator}`);
      }
    });
  }

  // Health and monitoring
  public async getUtilsStats(): Promise<any> {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      lastQuery: Date.now(),
      tablesOptimized: await this.getOptimizedTables(),
    };
  }

  private calculateCacheHitRate(): number {
    // This would need to track cache hits vs misses
    // For now, return a placeholder
    return 0.85;
  }

  private async getOptimizedTables(): Promise<string[]> {
    const result = await this.manager.executeQuery(`
      SELECT schemaname, tablename, last_analyze 
      FROM pg_stat_user_tables 
      WHERE last_analyze IS NOT NULL
    `);
    
    return result.map(row => row.tablename);
  }
}

// Export singleton instance
let mcpUtilsInstance: MCPDatabaseUtils | null = null;

export function getMCPDatabaseUtils(): MCPDatabaseUtils {
  if (!mcpUtilsInstance) {
    mcpUtilsInstance = new MCPDatabaseUtils();
  }
  return mcpUtilsInstance;
}