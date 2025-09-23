import { vi } from 'vitest';

// Mock database implementation for testing
export const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis()
};

// Mock the entire db/index module
vi.mock('@server/db/index', () => ({
  db: mockDb,
  dbLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  },
  checkDatabaseConnection: vi.fn().mockResolvedValue({
    healthy: true,
    latency: 10,
    details: { ssl: true, connected: true }
  }),
  initializeDatabase: vi.fn().mockResolvedValue({
    success: true,
    details: { connection: true, migrations: true, schema: true }
  })
}));
