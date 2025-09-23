import { beforeAll, afterAll, vi } from 'vitest';
import '@testing-library/jest-dom';

// Setup DOM environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Setup global test environment
beforeAll(() => {
  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key';
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
  process.env.DATABASE_URL = 'memory://test';
  
  // Mock console methods for cleaner test output
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
