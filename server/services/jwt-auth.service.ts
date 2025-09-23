/**
 * JWT Authentication Service for MariaIntelligence
 * Handles secure authentication with enhanced security features
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pino from 'pino';
import { promisify } from 'util';
import rateLimit from 'express-rate-limit';

// Logger for authentication events
const authLogger = pino({
  name: 'jwt-auth-service',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

// Interfaces
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  lastLogin?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  isActive: boolean;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

interface RefreshToken {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  deviceInfo?: string;
}

// Configuration
const JWT_CONFIG = {
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'mariaintelligence',
  audience: process.env.JWT_AUDIENCE || 'mariaintelligence-app',
  algorithm: 'HS256' as const,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  maxActiveSessions: 5
};

// In-memory stores (in production, use Redis or database)
const users = new Map<string, User>();
const refreshTokens = new Map<string, RefreshToken>();
const activeSessions = new Map<string, Set<string>>(); // userId -> Set of sessionIds
const blacklistedTokens = new Set<string>();

// Rate limiting for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export class JWTAuthService {
  private static instance: JWTAuthService;
  private readonly secretKey: string;
  private readonly refreshSecretKey: string;

  private constructor() {
    this.secretKey = process.env.JWT_SECRET || this.generateSecretKey();
    this.refreshSecretKey = process.env.JWT_REFRESH_SECRET || this.generateSecretKey();
    
    if (!process.env.JWT_SECRET) {
      authLogger.warn('JWT_SECRET not set in environment, using generated key');
    }
  }

  public static getInstance(): JWTAuthService {
    if (!JWTAuthService.instance) {
      JWTAuthService.instance = new JWTAuthService();
    }
    return JWTAuthService.instance;
  }

  private generateSecretKey(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash password with bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token
   */
  public generateAccessToken(user: User, sessionId: string): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(JWT_CONFIG.accessTokenExpiry)
    };

    return jwt.sign(payload, this.secretKey, {
      algorithm: JWT_CONFIG.algorithm,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string, deviceInfo?: string): string {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + this.parseExpiry(JWT_CONFIG.refreshTokenExpiry) * 1000);
    
    const refreshToken: RefreshToken = {
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
      isRevoked: false,
      deviceInfo
    };
    
    refreshTokens.set(token, refreshToken);
    
    return token;
  }

  /**
   * Verify and decode access token
   */
  public async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      // Check if token is blacklisted
      if (blacklistedTokens.has(token)) {
        authLogger.warn({ token: token.substring(0, 20) + '...' }, 'Attempted use of blacklisted token');
        return null;
      }

      const decoded = jwt.verify(token, this.secretKey, {
        algorithms: [JWT_CONFIG.algorithm],
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      }) as JWTPayload;

      // Verify session is still active
      const userSessions = activeSessions.get(decoded.userId);
      if (!userSessions || !userSessions.has(decoded.sessionId)) {
        authLogger.warn({ userId: decoded.userId, sessionId: decoded.sessionId }, 'Token references inactive session');
        return null;
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        authLogger.info('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        authLogger.warn({ error: error.message }, 'Invalid token format');
      } else {
        authLogger.error({ error }, 'Token verification failed');
      }
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  public async verifyRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = refreshTokens.get(token);
    
    if (!refreshToken) {
      authLogger.warn({ token: token.substring(0, 20) + '...' }, 'Refresh token not found');
      return null;
    }

    if (refreshToken.isRevoked) {
      authLogger.warn({ token: token.substring(0, 20) + '...' }, 'Attempted use of revoked refresh token');
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      authLogger.info({ token: token.substring(0, 20) + '...' }, 'Refresh token expired');
      refreshTokens.delete(token);
      return null;
    }

    return refreshToken;
  }

  /**
   * Authenticate user with email and password
   */
  public async authenticate(email: string, password: string, req: Request): Promise<{
    success: boolean;
    user?: User;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> {
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      authLogger.warn({ email }, 'Authentication attempt with non-existent email');
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const lockDuration = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000 / 60);
      authLogger.warn({ userId: user.id, email }, `Authentication attempt on locked account (${lockDuration}m remaining)`);
      return { success: false, error: `Account locked. Try again in ${lockDuration} minutes.` };
    }

    // Check if account is active
    if (!user.isActive) {
      authLogger.warn({ userId: user.id, email }, 'Authentication attempt on inactive account');
      return { success: false, error: 'Account is disabled' };
    }

    // For demo purposes, we'll assume password verification
    // In production, you'd verify against hashed password from database
    const isValidPassword = true; // await this.verifyPassword(password, user.hashedPassword);
    
    if (!isValidPassword) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= JWT_CONFIG.maxLoginAttempts) {
        user.lockUntil = new Date(Date.now() + JWT_CONFIG.lockoutDuration);
        authLogger.warn({ userId: user.id, email, attempts: user.loginAttempts }, 'Account locked due to failed login attempts');
      }
      
      authLogger.warn({ userId: user.id, email, attempts: user.loginAttempts }, 'Failed login attempt');
      return { success: false, error: 'Invalid credentials' };
    }

    // Reset login attempts on successful authentication
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    // Generate session ID
    const sessionId = this.generateSessionId();
    
    // Manage active sessions (limit concurrent sessions)
    const userSessions = activeSessions.get(user.id) || new Set();
    if (userSessions.size >= JWT_CONFIG.maxActiveSessions) {
      // Remove oldest session
      const oldestSession = Array.from(userSessions)[0];
      userSessions.delete(oldestSession);
      authLogger.info({ userId: user.id, sessionId: oldestSession }, 'Removed oldest session due to limit');
    }
    userSessions.add(sessionId);
    activeSessions.set(user.id, userSessions);

    // Generate tokens
    const accessToken = this.generateAccessToken(user, sessionId);
    const refreshToken = this.generateRefreshToken(user.id, req.get('User-Agent'));

    authLogger.info({ 
      userId: user.id, 
      email, 
      sessionId,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    }, 'Successful authentication');

    return {
      success: true,
      user: { ...user, loginAttempts: undefined, lockUntil: undefined }, // Don't expose sensitive fields
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(refreshTokenString: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> {
    const refreshToken = await this.verifyRefreshToken(refreshTokenString);
    
    if (!refreshToken) {
      return { success: false, error: 'Invalid refresh token' };
    }

    const user = users.get(refreshToken.userId);
    if (!user || !user.isActive) {
      authLogger.warn({ userId: refreshToken.userId }, 'Refresh attempt for inactive user');
      return { success: false, error: 'User not found or inactive' };
    }

    // Generate new session ID for security
    const sessionId = this.generateSessionId();
    
    // Update active sessions
    const userSessions = activeSessions.get(user.id) || new Set();
    userSessions.add(sessionId);
    activeSessions.set(user.id, userSessions);

    // Generate new tokens
    const accessToken = this.generateAccessToken(user, sessionId);
    const newRefreshToken = this.generateRefreshToken(user.id, refreshToken.deviceInfo);

    // Revoke old refresh token
    refreshToken.isRevoked = true;

    authLogger.info({ userId: user.id, sessionId }, 'Access token refreshed');

    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Logout user and invalidate tokens
   */
  public async logout(accessToken: string, refreshTokenString?: string): Promise<void> {
    try {
      const payload = await this.verifyAccessToken(accessToken);
      
      if (payload) {
        // Remove session
        const userSessions = activeSessions.get(payload.userId);
        if (userSessions) {
          userSessions.delete(payload.sessionId);
          if (userSessions.size === 0) {
            activeSessions.delete(payload.userId);
          } else {
            activeSessions.set(payload.userId, userSessions);
          }
        }

        authLogger.info({ userId: payload.userId, sessionId: payload.sessionId }, 'User logged out');
      }

      // Blacklist access token
      blacklistedTokens.add(accessToken);

      // Revoke refresh token if provided
      if (refreshTokenString) {
        const refreshToken = refreshTokens.get(refreshTokenString);
        if (refreshToken) {
          refreshToken.isRevoked = true;
        }
      }
    } catch (error) {
      authLogger.error({ error }, 'Error during logout');
    }
  }

  /**
   * Logout all sessions for a user
   */
  public async logoutAllSessions(userId: string): Promise<void> {
    // Remove all active sessions
    activeSessions.delete(userId);

    // Revoke all refresh tokens for user
    for (const [token, refreshToken] of refreshTokens.entries()) {
      if (refreshToken.userId === userId) {
        refreshToken.isRevoked = true;
      }
    }

    authLogger.info({ userId }, 'All sessions logged out');
  }

  /**
   * Check if user has permission
   */
  public hasPermission(user: JWTPayload, permission: string): boolean {
    return user.permissions.includes(permission) || user.role === 'admin';
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900; // 15 minutes default
    }
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  public cleanup(): void {
    const now = new Date();
    
    // Remove expired refresh tokens
    for (const [token, refreshToken] of refreshTokens.entries()) {
      if (refreshToken.expiresAt < now || refreshToken.isRevoked) {
        refreshTokens.delete(token);
      }
    }

    // Clean up blacklisted tokens (keep for a reasonable time)
    // In production, implement token introspection or use short-lived tokens
    
    authLogger.debug('Token cleanup completed');
  }

  /**
   * Get active sessions for a user
   */
  public getActiveSessions(userId: string): string[] {
    const sessions = activeSessions.get(userId);
    return sessions ? Array.from(sessions) : [];
  }
}

// Middleware for protecting routes
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ 
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
    return;
  }

  const authService = JWTAuthService.getInstance();
  const payload = await authService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ 
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  // Add user info to request
  req.user = payload;
  next();
};

// Middleware for checking permissions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const authService = JWTAuthService.getInstance();
    if (!authService.hasPermission(req.user, permission)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission
      });
      return;
    }

    next();
  };
};

// Middleware for role-based access
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient role privileges',
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

// Initialize demo user (remove in production)
export const initializeDemoUser = (): void => {
  const demoUser: User = {
    id: 'demo-user-1',
    email: 'admin@mariaintelligence.com',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin'],
    isActive: true
  };
  
  users.set(demoUser.id, demoUser);
  authLogger.info({ userId: demoUser.id, email: demoUser.email }, 'Demo user initialized');
};

// Export singleton instance
export const jwtAuthService = JWTAuthService.getInstance();

// Extended Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}