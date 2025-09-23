/**
 * MCP Data Transformation Utilities
 * Handles data transformation between different MCP servers and formats
 */

import { z } from 'zod';

// Data Schemas for Validation
const PropertyDataSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  address: z.string().optional(),
  owner_id: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const ReservationDataSchema = z.object({
  id: z.number().optional(),
  property_id: z.number(),
  guest_name: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  status: z.string().default('active'),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const OCRResultSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  language: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  entities: z.array(z.object({
    type: z.string(),
    value: z.string(),
    confidence: z.number()
  })).optional()
});

export type PropertyData = z.infer<typeof PropertyDataSchema>;
export type ReservationData = z.infer<typeof ReservationDataSchema>;
export type OCRResult = z.infer<typeof OCRResultSchema>;

// Data Format Converters
class DataFormatConverter {
  static toCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = this.toCamelCase(value);
    }

    return converted;
  }

  static toSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      converted[snakeKey] = this.toSnakeCase(value);
    }

    return converted;
  }

  static toKebabCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.toKebabCase(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      converted[kebabKey] = this.toKebabCase(value);
    }

    return converted;
  }

  static flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  static unflattenObject(obj: Record<string, any>): any {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const keys = key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = value;
    }

    return result;
  }
}

// Property Data Transformer
class PropertyTransformer {
  static fromNeonToAPI(neonData: any): PropertyData {
    const transformed = DataFormatConverter.toCamelCase(neonData);
    return PropertyDataSchema.parse(transformed);
  }

  static fromAPIToNeon(apiData: PropertyData): any {
    return DataFormatConverter.toSnakeCase(apiData);
  }

  static fromRailwayToAPI(railwayData: any): PropertyData {
    // Railway might have different field names
    const mapped = {
      id: railwayData.project_id,
      name: railwayData.project_name,
      address: railwayData.deployment_url,
      owner_id: railwayData.user_id,
      created_at: railwayData.created_at,
      updated_at: railwayData.updated_at
    };

    return PropertyDataSchema.parse(mapped);
  }

  static toSummary(properties: PropertyData[]): {
    total: number;
    byOwner: Record<string, number>;
    recent: PropertyData[];
  } {
    const byOwner: Record<string, number> = {};
    
    properties.forEach(property => {
      const ownerId = property.owner_id?.toString() || 'unknown';
      byOwner[ownerId] = (byOwner[ownerId] || 0) + 1;
    });

    const recent = properties
      .filter(p => p.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5);

    return {
      total: properties.length,
      byOwner,
      recent
    };
  }
}

// Reservation Data Transformer
class ReservationTransformer {
  static fromOCRToAPI(ocrResult: OCRResult, propertyId: number): ReservationData[] {
    const reservations: ReservationData[] = [];
    
    // Extract reservation patterns from OCR text
    const patterns = this.extractReservationPatterns(ocrResult.text);
    
    patterns.forEach(pattern => {
      try {
        const reservation = ReservationDataSchema.parse({
          property_id: propertyId,
          guest_name: pattern.guestName,
          check_in: pattern.checkIn,
          check_out: pattern.checkOut,
          status: 'active'
        });
        reservations.push(reservation);
      } catch (error) {
        console.warn('Failed to parse reservation pattern:', pattern, error);
      }
    });

    return reservations;
  }

  private static extractReservationPatterns(text: string): Array<{
    guestName: string;
    checkIn: string;
    checkOut: string;
  }> {
    const patterns: Array<{ guestName: string; checkIn: string; checkOut: string }> = [];
    
    // Common patterns for Portuguese reservation documents
    const reservationRegexes = [
      // Pattern: Nome: João Silva, Check-in: 15/01/2024, Check-out: 20/01/2024
      /Nome:\s*([^,\n]+).*?Check-in:\s*(\d{1,2}\/\d{1,2}\/\d{4}).*?Check-out:\s*(\d{1,2}\/\d{1,2}\/\d{4})/gi,

      // Pattern: Guest: John Doe | Entrada: 2024-01-15 | Saída: 2024-01-20
      /Guest:\s*([^|\n]+).*?Entrada:\s*(\d{4}-\d{2}-\d{2}).*?Saída:\s*(\d{4}-\d{2}-\d{2})/gi,

      // Pattern: Hóspede: Maria Santos - De 10/01/2024 a 15/01/2024
      /Hóspede:\s*([^-\n]+)\s*-\s*De\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*a\s*(\d{1,2}\/\d{1,2}\/\d{4})/gi
    ];

    reservationRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        patterns.push({
          guestName: match[1].trim(),
          checkIn: this.normalizeDate(match[2]),
          checkOut: this.normalizeDate(match[3])
        });
      }
    });

    return patterns;
  }

  private static normalizeDate(dateStr: string): string {
    // Convert various date formats to ISO format
    if (dateStr.includes('/')) {
      // DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Already in YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    // Fallback: try to parse and format
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Failed to normalize date:', dateStr);
    }

    return dateStr; // Return original if can't normalize
  }

  static toCalendarFormat(reservations: ReservationData[]): Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    color: string;
    extendedProps: any;
  }> {
    return reservations.map(reservation => ({
      id: reservation.id?.toString() || `temp_${Date.now()}`,
      title: reservation.guest_name,
      start: reservation.check_in,
      end: reservation.check_out,
      color: this.getStatusColor(reservation.status),
      extendedProps: {
        propertyId: reservation.property_id,
        status: reservation.status,
        guestName: reservation.guest_name
      }
    }));
  }

  private static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': '#10B981', // Green
      'cancelled': '#EF4444', // Red
      'completed': '#6B7280', // Gray
      'pending': '#F59E0B' // Yellow
    };
    
    return colors[status] || '#6B7280';
  }

  static calculateOccupancy(reservations: ReservationData[], dateRange: { start: string; end: string }): {
    totalDays: number;
    occupiedDays: number;
    occupancyRate: number;
    reservationCount: number;
  } {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const occupiedDates = new Set<string>();
    let reservationCount = 0;

    reservations.forEach(reservation => {
      if (reservation.status === 'active' || reservation.status === 'completed') {
        const checkIn = new Date(reservation.check_in);
        const checkOut = new Date(reservation.check_out);
        
        // Check if reservation overlaps with date range
        if (checkIn <= endDate && checkOut >= startDate) {
          reservationCount++;
          
          // Add each day of the reservation to occupied dates
          const current = new Date(Math.max(checkIn.getTime(), startDate.getTime()));
          const end = new Date(Math.min(checkOut.getTime(), endDate.getTime()));
          
          while (current <= end) {
            occupiedDates.add(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });

    const occupiedDays = occupiedDates.size;
    const occupancyRate = totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0;

    return {
      totalDays,
      occupiedDays,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      reservationCount
    };
  }
}

// API Response Transformer
class APIResponseTransformer {
  static success<T>(data: T, metadata?: Record<string, any>): {
    success: true;
    data: T;
    metadata?: Record<string, any>;
    timestamp: string;
  } {
    return {
      success: true,
      data,
      metadata,
      timestamp: new Date().toISOString()
    };
  }

  static error(message: string, code?: string, details?: any): {
    success: false;
    error: {
      message: string;
      code?: string;
      details?: any;
    };
    timestamp: string;
  } {
    return {
      success: false,
      error: {
        message,
        code,
        details
      },
      timestamp: new Date().toISOString()
    };
  }

  static paginated<T>(data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
  }): {
    success: true;
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    timestamp: string;
  } {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return {
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Export Classes and Utilities
export class MCPTransformers {
  static readonly Property = PropertyTransformer;
  static readonly Reservation = ReservationTransformer;
  static readonly Format = DataFormatConverter;
  static readonly Response = APIResponseTransformer;

  // Batch transformation utilities
  static transformBatch<T, U>(
    items: T[],
    transformer: (item: T) => U,
    options?: { 
      batchSize?: number;
      onProgress?: (processed: number, total: number) => void;
    }
  ): U[] {
    const batchSize = options?.batchSize || 100;
    const results: U[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = batch.map(transformer);
      results.push(...batchResults);
      
      options?.onProgress?.(Math.min(i + batchSize, items.length), items.length);
    }
    
    return results;
  }

  static async transformBatchAsync<T, U>(
    items: T[],
    transformer: (item: T) => Promise<U>,
    options?: {
      batchSize?: number;
      concurrency?: number;
      onProgress?: (processed: number, total: number) => void;
    }
  ): Promise<U[]> {
    const batchSize = options?.batchSize || 100;
    const concurrency = options?.concurrency || 5;
    const results: U[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch with concurrency limit
      const promises: Promise<U>[] = [];
      for (let j = 0; j < batch.length; j += concurrency) {
        const chunk = batch.slice(j, j + concurrency);
        promises.push(...chunk.map(transformer));
      }
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      options?.onProgress?.(Math.min(i + batchSize, items.length), items.length);
    }
    
    return results;
  }

  // Data validation utilities
  static validateSchema<T>(data: unknown, schema: z.ZodSchema<T>): T {
    return schema.parse(data);
  }

  static validateBatch<T>(
    items: unknown[],
    schema: z.ZodSchema<T>
  ): { valid: T[]; invalid: Array<{ index: number; error: string; data: unknown }> } {
    const valid: T[] = [];
    const invalid: Array<{ index: number; error: string; data: unknown }> = [];
    
    items.forEach((item, index) => {
      try {
        const validated = schema.parse(item);
        valid.push(validated);
      } catch (error) {
        invalid.push({
          index,
          error: error instanceof Error ? error.message : 'Validation failed',
          data: item
        });
      }
    });
    
    return { valid, invalid };
  }

  // Data aggregation utilities
  static aggregateData<T, K extends keyof T>(
    items: T[],
    groupBy: K,
    aggregations: {
      count?: boolean;
      sum?: (keyof T)[];
      avg?: (keyof T)[];
      min?: (keyof T)[];
      max?: (keyof T)[];
    }
  ): Record<string, any> {
    const groups: Record<string, T[]> = {};
    
    // Group items
    items.forEach(item => {
      const key = String(item[groupBy]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    // Calculate aggregations
    const results: Record<string, any> = {};
    
    Object.entries(groups).forEach(([key, groupItems]) => {
      const result: any = {};
      
      if (aggregations.count) {
        result.count = groupItems.length;
      }
      
      aggregations.sum?.forEach(field => {
        result[`${String(field)}_sum`] = groupItems.reduce((sum, item) => {
          const value = Number(item[field]) || 0;
          return sum + value;
        }, 0);
      });
      
      aggregations.avg?.forEach(field => {
        const sum = groupItems.reduce((sum, item) => {
          const value = Number(item[field]) || 0;
          return sum + value;
        }, 0);
        result[`${String(field)}_avg`] = groupItems.length > 0 ? sum / groupItems.length : 0;
      });
      
      aggregations.min?.forEach(field => {
        const values = groupItems.map(item => Number(item[field]) || 0);
        result[`${String(field)}_min`] = Math.min(...values);
      });
      
      aggregations.max?.forEach(field => {
        const values = groupItems.map(item => Number(item[field]) || 0);
        result[`${String(field)}_max`] = Math.max(...values);
      });
      
      results[key] = result;
    });
    
    return results;
  }
}

// Export schemas for external use
export {
  PropertyDataSchema,
  ReservationDataSchema,
  OCRResultSchema
};