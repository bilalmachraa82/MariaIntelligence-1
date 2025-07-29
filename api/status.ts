import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Maria Faz API está funcionando no Vercel! 🚀',
    database: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
    ocr: 'Available',
    ai_services: {
      gemini: process.env.GOOGLE_GEMINI_API_KEY ? 'Configured' : 'Not configured',
      mistral: process.env.MISTRAL_API_KEY ? 'Configured' : 'Not configured'
    },
    deployment: 'Vercel',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: {
      'user-agent': req.headers['user-agent'],
      'host': req.headers.host
    }
  });
}