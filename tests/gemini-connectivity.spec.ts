/**
 * Gemini API Connectivity Tests with controlled fetch mocks
 */

import { describe, it, expect, beforeEach, afterEach, vi, type SpyInstance } from 'vitest';
import { GeminiService } from '@server/services/gemini.service';

const mockResponse = (overrides: Partial<Pick<Response, 'ok' | 'status' | 'statusText' | 'json' | 'text'>> = {}): Response => {
  const base: Pick<Response, 'ok' | 'status' | 'statusText' | 'json' | 'text'> = {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ models: [{ name: 'models/gemini-1.5-pro' }] }),
    text: async () => '',
  };

  return { ...base, ...overrides } as Response;
};

describe('Gemini API Connectivity', () => {
  let geminiService: GeminiService;
  let fetchSpy: SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key';
    fetchSpy = vi.spyOn(globalThis as unknown as { fetch: typeof fetch }, 'fetch');
    geminiService = new GeminiService();
    (geminiService as any).maxRetries = 1;
    (geminiService as any).connectionRetryDelay = 10;
    (geminiService as any).connectionTimeout = 100;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Establishment', () => {
    it('should successfully validate API key with proper response', async () => {
      fetchSpy.mockResolvedValue(mockResponse());

      const result = await geminiService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should handle API key validation failure', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          text: async () => 'Forbidden',
        }),
      );

      const result = await geminiService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('inválida');
    });

    it('should handle network timeouts properly', async () => {
      const abortError = new Error('Timeout na validação da API (30000ms)');
      abortError.name = 'AbortError';
      fetchSpy.mockRejectedValue(abortError);

      const result = await geminiService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Timeout');
    });
  });

  describe('Error Handling', () => {
    it('should handle 429 rate limit errors', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit exceeded',
        }),
      );

      const result = await geminiService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Limite de requisições');
    });

    it('should handle 500 internal server errors', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        }),
      );

      const result = await geminiService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erro interno');
    });
  });
});
