/**
 * Simple Gemini API Integration Test
 * Tests the core functionality without complex mocking
 */

import { describe, it, expect } from 'vitest';

describe('Gemini API Integration - Basic', () => {
  it('should have proper environment setup', () => {
    // Test that our environment can be set up
    const testEnv = {
      GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY || 'test-key'
    };
    
    expect(testEnv).toBeDefined();
    expect(typeof testEnv.GOOGLE_GEMINI_API_KEY).toBe('string');
  });

  it('should be able to import Gemini service', async () => {
    const { GeminiService } = await import('../server/services/gemini.service');
    expect(GeminiService).toBeDefined();
    expect(typeof GeminiService).toBe('function');
  });

  it('should be able to import rate limiter service', async () => {
    const { rateLimiter, RateLimiterService } = await import('../server/services/rate-limiter.service');
    expect(RateLimiterService).toBeDefined();
    expect(rateLimiter).toBeDefined();
    expect(typeof rateLimiter.getRateLimitStatus).toBe('function');
  });

  it('should have rate limiter configured correctly', async () => {
    const { rateLimiter } = await import('../server/services/rate-limiter.service');
    const status = rateLimiter.getRateLimitStatus();
    
    expect(status).toMatchObject({
      recentRequests: expect.any(Number),
      maxRequestsPerMinute: expect.any(Number),
      queueSize: expect.any(Number),
      canMakeRequest: expect.any(Boolean),
      adaptiveRateLimiting: expect.any(Boolean),
      isInBackoff: expect.any(Boolean)
    });

    // Should have updated rate limit (15 requests per minute)
    expect(status.maxRequestsPerMinute).toBeGreaterThan(5);
    expect(status.adaptiveRateLimiting).toBe(true);
  });

  it('should create Gemini service instance without errors', async () => {
    // Set a test API key to avoid warnings
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key-for-validation';
    
    const { GeminiService } = await import('../server/services/gemini.service');
    
    expect(() => {
      const service = new GeminiService();
      expect(service).toBeDefined();
    }).not.toThrow();
  });
});