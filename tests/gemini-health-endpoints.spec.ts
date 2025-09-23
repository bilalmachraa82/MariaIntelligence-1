/**
 * Gemini API Health Check Endpoints Integration Tests
 * 
 * This test suite validates the health check endpoints work properly
 * and provide accurate diagnostic information.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { describeIf, FULL_STACK_ENABLED, logSkip } from './utils/testFlags';

// Mock fetch for controlled testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

const describeFullStack = describeIf(FULL_STACK_ENABLED);

if (!FULL_STACK_ENABLED) {
  logSkip('Gemini health endpoint tests skipped (ENABLE_FULL_STACK_TESTS=true required)');
}

describeFullStack('Gemini Health Check Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    // Clean up any lingering timers
    vi.clearAllTimers();
  });

  describe('GET /api/gemini/health', () => {
    it('should return healthy status when API is working', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          models: [{ name: 'gemini-1.5-pro' }]
        }),
        text: async () => '',
        headers: new Map()
      });

      const response = await request(app)
        .get('/api/gemini/health')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'gemini',
        timestamp: expect.any(String),
        connection: {
          success: expect.any(Boolean),
          message: expect.any(String),
          latency: expect.any(Number)
        },
        status: {
          isConnected: expect.any(Boolean),
          isInitialized: expect.any(Boolean),
          consecutiveFailures: expect.any(Number),
          currentRequests: expect.any(Number),
          maxConcurrentRequests: expect.any(Number)
        },
        rateLimit: {
          recentRequests: expect.any(Number),
          maxRequestsPerMinute: expect.any(Number),
          queueSize: expect.any(Number),
          canMakeRequest: expect.any(Boolean),
          adaptiveRateLimiting: expect.any(Boolean)
        },
        health: {
          overall: expect.any(Boolean),
          apiKey: expect.any(Boolean),
          rateLimitOk: expect.any(Boolean),
          consecutiveFailuresOk: expect.any(Boolean)
        }
      });

      expect(response.body.health.apiKey).toBe(true);
    });

    it('should return unhealthy status when API key is missing', async () => {
      delete process.env.GOOGLE_GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const response = await request(app)
        .get('/api/gemini/health')
        .expect(200); // Still returns 200, but health is false

      expect(response.body.health.apiKey).toBe(false);
      expect(response.body.health.overall).toBe(false);
    });

    it('should return error status when API connection fails', async () => {
      // Mock API failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Invalid API key',
        headers: new Map()
      });

      const response = await request(app)
        .get('/api/gemini/health')
        .expect(200);

      expect(response.body.connection.success).toBe(false);
      expect(response.body.health.overall).toBe(false);
    });

    it('should handle internal errors gracefully', async () => {
      // Mock fetch to throw an error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .get('/api/gemini/health')
        .expect(500);

      expect(response.body).toMatchObject({
        service: 'gemini',
        timestamp: expect.any(String),
        error: expect.any(String),
        health: {
          overall: false,
          apiKey: expect.any(Boolean),
          rateLimitOk: false,
          consecutiveFailuresOk: false
        }
      });
    });
  });

  describe('GET /api/gemini/status', () => {
    it('should return detailed connection status', async () => {
      const response = await request(app)
        .get('/api/gemini/status')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'gemini',
        timestamp: expect.any(String),
        connection: {
          isConnected: expect.any(Boolean),
          isInitialized: expect.any(Boolean),
          consecutiveFailures: expect.any(Number),
          currentRequests: expect.any(Number),
          maxConcurrentRequests: expect.any(Number)
        },
        rateLimit: {
          recentRequests: expect.any(Number),
          maxRequestsPerMinute: expect.any(Number),
          queueSize: expect.any(Number),
          canMakeRequest: expect.any(Boolean),
          adaptiveRateLimiting: expect.any(Boolean),
          lastRateLimitError: expect.any(Object), // null or number
          backoffUntil: expect.any(Object), // null or number
          isInBackoff: expect.any(Boolean)
        },
        environment: {
          hasApiKey: expect.any(Boolean),
          nodeEnv: expect.any(String)
        }
      });
    });

    it('should reflect environment configuration correctly', async () => {
      process.env.NODE_ENV = 'test';

      const response = await request(app)
        .get('/api/gemini/status')
        .expect(200);

      expect(response.body.environment.nodeEnv).toBe('test');
      expect(response.body.environment.hasApiKey).toBe(true);
    });
  });

  describe('POST /api/gemini/reconnect', () => {
    it('should successfully trigger reconnection', async () => {
      // Mock successful reconnection
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [] }),
        text: async () => '',
        headers: new Map()
      });

      const response = await request(app)
        .post('/api/gemini/reconnect')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Reconexão bem-sucedida'),
        timestamp: expect.any(String)
      });
    });

    it('should handle failed reconnection attempts', async () => {
      // Mock failed reconnection
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Invalid API key',
        headers: new Map()
      });

      const response = await request(app)
        .post('/api/gemini/reconnect')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Falha na reconexão'),
        timestamp: expect.any(String)
      });
    });

    it('should handle internal errors during reconnection', async () => {
      // Mock internal error
      mockFetch.mockRejectedValue(new Error('Internal error'));

      const response = await request(app)
        .post('/api/gemini/reconnect')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal error');
    });
  });

  describe('Rate Limiting Validation', () => {
    it('should show adaptive rate limiting in status', async () => {
      const response = await request(app)
        .get('/api/gemini/status')
        .expect(200);

      expect(response.body.rateLimit.adaptiveRateLimiting).toBe(true);
      expect(typeof response.body.rateLimit.isInBackoff).toBe('boolean');
      expect(response.body.rateLimit.maxRequestsPerMinute).toBeGreaterThan(0);
    });

    it('should reflect backoff state when in rate limit', async () => {
      // This test would require actually triggering rate limits
      // For now, just verify the structure is correct
      const response = await request(app)
        .get('/api/gemini/status')
        .expect(200);

      expect(response.body.rateLimit).toHaveProperty('backoffUntil');
      expect(response.body.rateLimit).toHaveProperty('lastRateLimitError');
      expect(response.body.rateLimit).toHaveProperty('isInBackoff');
    });
  });

  describe('Health Check Integration', () => {
    it('should provide consistent health information across endpoints', async () => {
      // Mock consistent API behavior
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [] }),
        text: async () => '',
        headers: new Map()
      });

      const [healthResponse, statusResponse] = await Promise.all([
        request(app).get('/api/gemini/health'),
        request(app).get('/api/gemini/status')
      ]);

      expect(healthResponse.status).toBe(200);
      expect(statusResponse.status).toBe(200);

      // Should have consistent connection information
      expect(healthResponse.body.status.isInitialized)
        .toBe(statusResponse.body.connection.isInitialized);
      
      expect(healthResponse.body.status.consecutiveFailures)
        .toBe(statusResponse.body.connection.consecutiveFailures);
    });

    it('should handle concurrent health checks properly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [] }),
        text: async () => '',
        headers: new Map()
      });

      // Start multiple health checks concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/api/gemini/health'));
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.service).toBe('gemini');
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary failures', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
        headers: new Map()
      });

      const failResponse = await request(app)
        .get('/api/gemini/health')
        .expect(200);

      expect(failResponse.body.connection.success).toBe(false);

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ models: [] }),
        text: async () => '',
        headers: new Map()
      });

      const successResponse = await request(app)
        .get('/api/gemini/health')
        .expect(200);

      expect(successResponse.body.connection.success).toBe(true);
      // Consecutive failures should be reset
      expect(successResponse.body.status.consecutiveFailures).toBe(0);
    });
  });
});
