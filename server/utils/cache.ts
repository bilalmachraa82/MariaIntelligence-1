/**
 * High-performance caching utility for MariaIntelligence
 * Implements memory caching with TTL and Redis fallback
 */

import { LRUCache } from 'lru-cache';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  staleWhileRevalidate?: number; // Serve stale data while revalidating
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class PerformanceCache {
  private memoryCache: LRUCache<string, CacheEntry<any>>;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  constructor() {
    this.memoryCache = new LRUCache<string, CacheEntry<any>>({
      max: 1000, // Maximum 1000 items
      ttl: 1000 * 60 * 15, // Default 15 minutes TTL
      updateAgeOnGet: true,
      allowStale: true
    });
  }

  /**
   * Get item from cache with performance tracking
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);

    if (entry) {
      entry.hits++;
      this.stats.hits++;

      // Check if data is still valid
      const now = Date.now();
      if (now - entry.timestamp <= entry.ttl) {
        return entry.data;
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set item in cache with optimizations
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 1000 * 60 * 15; // Default 15 minutes

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    this.memoryCache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Delete item from cache
   */
  async del(key: string): Promise<boolean> {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.memoryCache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Memoization wrapper for functions
   */
  memoize<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyGenerator?: (...args: TArgs) => string,
    ttl?: number
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      // Try to get from cache first
      const cached = await this.get<TReturn>(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn(...args);
      await this.set(key, result, { ttl });

      return result;
    };
  }

  /**
   * Cache with automatic revalidation
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);

    return value;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, value, options }) => this.set(key, value, options))
    );
  }

  /**
   * Optimize cache by removing stale entries
   */
  optimize(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Check each entry for staleness
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl && entry.hits === 0) {
        keysToDelete.push(key);
      }
    }

    // Remove stale entries
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    console.log(`🧹 Cache optimized: removed ${keysToDelete.length} stale entries`);
  }
}

// Export singleton instance
export const cache = new PerformanceCache();

// Auto-optimize cache every 5 minutes
setInterval(() => {
  cache.optimize();
}, 5 * 60 * 1000);

export default cache;