import request from 'supertest';
import { app } from './mocks/mockApp';
import { sql } from 'drizzle-orm';

// Mock do banco de dados
jest.mock('../server/db', () => ({
  execute: jest.fn()
}));

import { db } from '../server/db';

describe('Health Endpoint Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock padrão para o banco de dados conectado
    (db.execute as jest.Mock).mockResolvedValue([{ health_check: 1 }]);
  });

  test('should return 200 and healthy status when everything is ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('environment');
    expect(db.execute).toHaveBeenCalledWith(expect.anything());
  });

  test('should return 500 and error status when database is down', async () => {
    // Mock de falha na conexão com o banco de dados
    (db.execute as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app).get('/health');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('error', 'Database connection failed');
    expect(response.body).toHaveProperty('database', 'disconnected');
    expect(db.execute).toHaveBeenCalledWith(expect.anything());
  });
});
