import request from 'supertest';
import { app } from '../server';
import { Redis } from 'ioredis';
import { ocrQueue } from '../server/queues/ocr';

describe('OCR Flow Tests', () => {
  let redis: Redis;

  beforeEach(() => {
    redis = new Redis();
    jest.spyOn(ocrQueue, 'add').mockResolvedValue({
      id: 'test-job',
      name: 'processPdf',
      data: { filePath: 'test.pdf' },
      timestamp: Date.now(),
      attemptsMade: 0,
      finishedOn: null,
      processed: false
    });
  });

  afterEach(() => {
    redis.quit();
    jest.restoreAllMocks();
  });

  test('should process complete OCR flow', async () => {
    // Simular upload de PDF
    const uploadResponse = await request(app)
      .post('/api/ocr/upload')
      .attach('file', 'test.pdf');
    
    expect(uploadResponse.status).toBe(200);
    expect(uploadResponse.body).toHaveProperty('jobId');

    // Simular processamento na fila
    const jobResponse = await request(app)
      .get(`/api/ocr/job/${uploadResponse.body.jobId}`);
    
    expect(jobResponse.status).toBe(200);
    expect(jobResponse.body.status).toBe('completed');
    expect(jobResponse.body.result).toBeDefined();
  });

  test('should handle failed OCR processing', async () => {
    jest.spyOn(ocrQueue, 'add').mockRejectedValue(new Error('Queue failed'));

    const uploadResponse = await request(app)
      .post('/api/ocr/upload')
      .attach('file', 'test.pdf');
    
    expect(uploadResponse.status).toBe(500);
    expect(uploadResponse.body.error).toBe('OCR processing failed');
  });
});
