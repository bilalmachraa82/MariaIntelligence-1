/**
 * Property Match Caching System
 * 
 * Provides intelligent caching for property matches to improve performance
 * and reduce database queries. Supports TTL, LRU eviction, and statistics.
 */

import { Property } from '../../shared/schema';
import { PropertyMatch } from './pdfImportService';

export interface CacheEntry {
  propertyMatch: PropertyMatch;
  timestamp: number;
  hitCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheOptions {
  maxEntries?: number;
  ttlMs?: number;
  cleanupIntervalMs?: number;
  enableStats?: boolean;
}

/**
 * Advanced LRU Cache with TTL support for property matches
 */
export class PropertyMatchCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private readonly enableStats: boolean;
  private cleanupTimer?: NodeJS.Timeout;

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    totalResponseTime: 0,
    requestCount: 0
  };

  constructor(options: CacheOptions = {}) {
    this.maxEntries = options.maxEntries || 1000;
    this.ttlMs = options.ttlMs || 300000; // 5 minutes default
    this.enableStats = options.enableStats !== false;

    // Start cleanup timer
    const cleanupInterval = options.cleanupIntervalMs || 60000; // 1 minute
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, cleanupInterval);
  }

  /**
   * Get property match from cache
   */
  get(key: string): PropertyMatch | null {
    const startTime = Date.now();
    const normalizedKey = this.normalizeKey(key);
    const entry = this.cache.get(normalizedKey);

    if (this.enableStats) {
      this.stats.requestCount++;
    }

    if (!entry) {
      if (this.enableStats) {
        this.stats.misses++;
        this.stats.totalResponseTime += Date.now() - startTime;
      }
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(normalizedKey);
      if (this.enableStats) {
        this.stats.misses++;
        this.stats.totalResponseTime += Date.now() - startTime;
      }
      return null;
    }

    // Update access statistics
    entry.hitCount++;
    entry.lastAccessed = Date.now();

    // Move to end (most recently used)
    this.cache.delete(normalizedKey);
    this.cache.set(normalizedKey, entry);

    if (this.enableStats) {
      this.stats.hits++;
      this.stats.totalResponseTime += Date.now() - startTime;
    }

    return entry.propertyMatch;
  }

  /**
   * Set property match in cache
   */
  set(key: string, propertyMatch: PropertyMatch): void {
    const normalizedKey = this.normalizeKey(key);
    const now = Date.now();

    // Check if we need to evict entries
    if (this.cache.size >= this.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      propertyMatch,
      timestamp: now,
      hitCount: 0,
      lastAccessed: now
    };

    this.cache.set(normalizedKey, entry);
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);
    return this.cache.delete(normalizedKey);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    if (this.enableStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        totalResponseTime: 0,
        requestCount: 0
      };
    }
  }

  /**
   * Check if key exists in cache (without updating access stats)
   */
  has(key: string): boolean {
    const normalizedKey = this.normalizeKey(key);
    const entry = this.cache.get(normalizedKey);
    
    if (!entry) return false;
    
    // Check if expired
    return Date.now() - entry.timestamp <= this.ttlMs;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    let memoryUsage = 0;
    let oldestEntry = now;
    let newestEntry = 0;

    entries.forEach(entry => {
      // Estimate memory usage (rough calculation)
      memoryUsage += JSON.stringify(entry).length * 2; // UTF-16 encoding
      
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      if (entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    });

    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      averageResponseTime: this.stats.requestCount > 0 ? 
        this.stats.totalResponseTime / this.stats.requestCount : 0,
      memoryUsage,
      oldestEntry: entries.length > 0 ? now - oldestEntry : 0,
      newestEntry: entries.length > 0 ? now - newestEntry : 0
    };
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry
    }));
  }

  /**
   * Normalize cache key for consistent lookups
   */
  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ') // Replace non-word chars with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }

  /**
   * Pre-warm cache with known property matches
   */
  async preWarm(properties: Property[]): Promise<void> {
    console.log(`🔥 Pre-warming cache with ${properties.length} properties`);
    
    // Create cache entries for exact matches
    properties.forEach(property => {
      const exactMatch: PropertyMatch = {
        property,
        originalName: property.name,
        normalizedName: this.normalizeKey(property.name),
        matchScore: 1.0,
        matchType: 'exact',
        suggestions: []
      };
      
      this.set(property.name, exactMatch);
      
      // Also cache aliases if they exist
      if (property.aliases && Array.isArray(property.aliases)) {
        property.aliases.forEach(alias => {
          const aliasMatch: PropertyMatch = {
            property,
            originalName: alias,
            normalizedName: this.normalizeKey(alias),
            matchScore: 0.95,
            matchType: 'alias',
            suggestions: []
          };
          
          this.set(alias, aliasMatch);
        });
      }
    });
    
    console.log(`✅ Cache pre-warmed with ${this.cache.size} entries`);
  }

  /**
   * Export cache for backup/restore
   */
  export(): string {
    const exportData = {
      entries: Array.from(this.cache.entries()),
      stats: this.stats,
      timestamp: Date.now()
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import cache from backup
   */
  import(data: string): void {
    try {
      const importData = JSON.parse(data);
      
      this.clear();
      
      if (importData.entries && Array.isArray(importData.entries)) {
        importData.entries.forEach(([key, entry]: [string, CacheEntry]) => {
          // Only import non-expired entries
          if (Date.now() - entry.timestamp <= this.ttlMs) {
            this.cache.set(key, entry);
          }
        });
      }
      
      if (importData.stats) {
        this.stats = { ...this.stats, ...importData.stats };
      }
      
      console.log(`📥 Imported ${this.cache.size} cache entries`);
    } catch (error) {
      console.error('❌ Failed to import cache data:', error);
    }
  }
}

// Singleton instance
export const propertyMatchCache = new PropertyMatchCache({
  maxEntries: 2000,
  ttlMs: 600000, // 10 minutes
  cleanupIntervalMs: 120000, // 2 minutes
  enableStats: true
});

// Export utility functions
export const cacheUtils = {
  normalizeKey: (key: string) => propertyMatchCache['normalizeKey'](key),
  getMemoryUsage: () => {
    const stats = propertyMatchCache.getStats();
    return `${(stats.memoryUsage / 1024).toFixed(2)} KB`;
  },
  getCacheEfficiency: () => {
    const stats = propertyMatchCache.getStats();
    return {
      hitRate: Math.round(stats.hitRate * 100),
      avgResponseTime: Math.round(stats.averageResponseTime * 100) / 100,
      memoryUsage: (stats.memoryUsage / 1024).toFixed(2) + ' KB'
    };
  }
};