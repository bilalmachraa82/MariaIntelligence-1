/**
 * MCP Security Layer
 * Handles authentication, encryption, and security for MCP connections
 */

import crypto from 'crypto';
import { z } from 'zod';

// Security Configuration Schema
const SecurityConfigSchema = z.object({
  apiKeys: z.record(z.string()),
  encryptionKey: z.string(),
  rateLimit: z.object({
    windowMs: z.number().default(60000),
    maxRequests: z.number().default(100)
  }),
  allowedOrigins: z.array(z.string()).default(['*']),
  requireHttps: z.boolean().default(true),
  sessionTimeout: z.number().default(3600000) // 1 hour
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;

// Audit Log Schema
const AuditLogSchema = z.object({
  timestamp: z.string(),
  userId: z.string().optional(),
  action: z.string(),
  server: z.string(),
  tool: z.string(),
  arguments: z.record(z.any()),
  success: z.boolean(),
  error: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// API Key Management
class APIKeyManager {
  private keys: Map<string, { server: string; permissions: string[]; expiresAt?: Date }> = new Map();

  addKey(keyId: string, server: string, permissions: string[], expiresAt?: Date): void {
    this.keys.set(keyId, { server, permissions, expiresAt });
  }

  validateKey(keyId: string, server: string, permission: string): boolean {
    const keyInfo = this.keys.get(keyId);
    if (!keyInfo) return false;
    
    // Check if key has expired
    if (keyInfo.expiresAt && keyInfo.expiresAt < new Date()) {
      this.keys.delete(keyId);
      return false;
    }
    
    // Check server and permission
    return keyInfo.server === server && keyInfo.permissions.includes(permission);
  }

  revokeKey(keyId: string): void {
    this.keys.delete(keyId);
  }

  listKeys(): Array<{ keyId: string; server: string; permissions: string[]; expiresAt?: Date }> {
    return Array.from(this.keys.entries()).map(([keyId, info]) => ({
      keyId,
      ...info
    }));
  }
}

// Encryption Service
class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;

  constructor(private masterKey: string) {
    if (masterKey.length < this.keyLength) {
      throw new Error('Encryption key must be at least 32 characters');
    }
  }

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.masterKey.slice(0, this.keyLength));
    const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const key = Buffer.from(this.masterKey.slice(0, this.keyLength));
    const decipher = crypto.createDecipherGCM(
      this.algorithm, 
      key, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Rate Limiter with Redis-like functionality
class SecurityRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requestInfo = this.requests.get(identifier) || { count: 0, resetTime: now + windowMs };
    
    // Reset if window has passed
    if (now > requestInfo.resetTime) {
      requestInfo.count = 0;
      requestInfo.resetTime = now + windowMs;
    }
    
    // Check if under limit
    if (requestInfo.count >= maxRequests) {
      return false;
    }
    
    // Increment and update
    requestInfo.count++;
    this.requests.set(identifier, requestInfo);
    
    return true;
  }

  getRemainingRequests(identifier: string, maxRequests: number): number {
    const requestInfo = this.requests.get(identifier);
    if (!requestInfo) return maxRequests;
    
    return Math.max(0, maxRequests - requestInfo.count);
  }

  getResetTime(identifier: string): number {
    const requestInfo = this.requests.get(identifier);
    return requestInfo?.resetTime || Date.now();
  }
}

// Audit Logger
class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 10000;

  log(entry: Omit<AuditLog, 'timestamp'>): void {
    const auditEntry: AuditLog = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.unshift(auditEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getLogs(filters?: {
    server?: string;
    action?: string;
    success?: boolean;
    userId?: string;
    limit?: number;
  }): AuditLog[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.server) {
        filteredLogs = filteredLogs.filter(log => log.server === filters.server);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === filters.success);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }
    }

    return filteredLogs;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Input Validator
class InputValidator {
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|\||\||&)/,
    /(\bOR\b.*=.*|1=1|1=2)/i
  ];

  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  private static sanitizeString(str: string): string {
    // Remove potential SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(str)) {
        throw new Error('Potential SQL injection detected');
      }
    }
    
    // Remove potential XSS patterns
    for (const pattern of this.XSS_PATTERNS) {
      str = str.replace(pattern, '');
    }
    
    // Escape special characters
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static validateSchema<T>(data: unknown, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new Error(`Schema validation failed: ${error}`);
    }
  }
}

// Main Security Manager
export class MCPSecurityManager {
  private apiKeyManager = new APIKeyManager();
  private rateLimiter = new SecurityRateLimiter();
  private auditLogger = new AuditLogger();
  private encryptionService: EncryptionService;
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = SecurityConfigSchema.parse(config);
    this.encryptionService = new EncryptionService(config.encryptionKey);
    this.initializeAPIKeys();
  }

  private initializeAPIKeys(): void {
    // Initialize API keys for each server
    Object.entries(this.config.apiKeys).forEach(([server, key]) => {
      this.apiKeyManager.addKey(key, server, ['read', 'write', 'admin']);
    });
  }

  authenticate(apiKey: string, server: string, permission: string): boolean {
    return this.apiKeyManager.validateKey(apiKey, server, permission);
  }

  checkRateLimit(identifier: string): boolean {
    return this.rateLimiter.isAllowed(
      identifier,
      this.config.rateLimit.maxRequests,
      this.config.rateLimit.windowMs
    );
  }

  validateInput(input: any): any {
    return InputValidator.sanitizeInput(input);
  }

  logAudit(entry: Omit<AuditLog, 'timestamp'>): void {
    this.auditLogger.log(entry);
  }

  encryptSensitiveData(data: string): { encrypted: string; iv: string; tag: string } {
    return this.encryptionService.encrypt(data);
  }

  decryptSensitiveData(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    return this.encryptionService.decrypt(encryptedData);
  }

  generateSecureToken(): string {
    return this.encryptionService.generateSecureToken();
  }

  getAuditLogs(filters?: Parameters<typeof this.auditLogger.getLogs>[0]): AuditLog[] {
    return this.auditLogger.getLogs(filters);
  }

  exportAuditLogs(): string {
    return this.auditLogger.exportLogs();
  }

  validateOrigin(origin: string): boolean {
    if (this.config.allowedOrigins.includes('*')) {
      return true;
    }
    return this.config.allowedOrigins.includes(origin);
  }

  getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
  }

  getConfig(): SecurityConfig {
    // Return config without sensitive data
    return {
      ...this.config,
      apiKeys: Object.keys(this.config.apiKeys).reduce((acc, key) => {
        acc[key] = '***';
        return acc;
      }, {} as Record<string, string>),
      encryptionKey: '***'
    };
  }
}

// Initialize with environment variables
const defaultConfig: SecurityConfig = {
  apiKeys: {
    neon: process.env.NEON_API_KEY || '',
    railway: process.env.RAILWAY_TOKEN || '',
    'claude-flow': process.env.CLAUDE_FLOW_KEY || '',
    'ruv-swarm': process.env.RUV_SWARM_KEY || ''
  },
  encryptionKey: process.env.MCP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100
  },
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  requireHttps: process.env.NODE_ENV === 'production',
  sessionTimeout: 3600000
};

export const mcpSecurity = new MCPSecurityManager(defaultConfig);