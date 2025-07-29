import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Maria Faz API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    method: req.method,
    url: req.url
  });
}