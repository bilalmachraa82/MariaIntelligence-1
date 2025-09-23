import { vi } from 'vitest';

// Enhanced mock configurations
export const configureGeminiMock = {
  success: () => {
    mockGeminiService.testConnection = vi.fn().mockResolvedValue({
      success: true,
      message: 'Conexão com Gemini API estabelecida com sucesso',
      latency: 120
    });
  },
  
  authFailure: () => {
    mockGeminiService.testConnection = vi.fn().mockResolvedValue({
      success: false,
      message: 'Chave API inválida ou expirada'
    });
  },
  
  timeout: () => {
    mockGeminiService.testConnection = vi.fn().mockRejectedValue(
      new Error('Request timeout after 5000ms')
    );
  },
  
  rateLimited: () => {
    mockGeminiService.testConnection = vi.fn().mockResolvedValue({
      success: false,
      message: 'Rate limit exceeded (429)'
    });
  },
  
  serverError: () => {
    mockGeminiService.testConnection = vi.fn().mockResolvedValue({
      success: false,
      message: 'Internal server error (500)'
    });
  }
};

// Base mock service
export const mockGeminiService = {
  testConnection: vi.fn(),
  generateContent: vi.fn(),
  chat: vi.fn()
};

export default mockGeminiService;
