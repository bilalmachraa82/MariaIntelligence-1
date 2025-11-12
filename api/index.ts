/* ────────────────────────────────────────────────────────────
 * Vercel Serverless Function Entry Point
 *
 * Este arquivo é o ponto de entrada para deploy no Vercel.
 * Ele configura o Express app sem fazer listen() (gerenciado pelo Vercel)
 * ──────────────────────────────────────────────────────────── */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { registerRoutes } from '../server/routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ─── Imports de segurança ─────────────────────────────── */
import {
  securityMiddlewareStack,
  apiRateLimiter,
  pdfImportRateLimiter,
  strictRateLimiter,
} from '../server/middleware/security.js';

/* ─── Import Request ID Middleware ─────────────────────── */
import { requestIdMiddleware } from '../server/middleware/request-id.js';

/* ─── Inicialização da app ────────────────────────────── */
console.log('Inicializando aplicação Vercel Serverless…');
const app = express();

/* ─── Compression Middleware ───────────────────────────── */
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

/* ─── Request ID Middleware ────────────────────────────── */
app.use(requestIdMiddleware);

/* ─── Configuração de segurança ────────────────────────── */
app.use(securityMiddlewareStack);

// Rate limiting
app.use('/api/', apiRateLimiter);
app.use('/api/upload', pdfImportRateLimiter);
app.use('/api/ocr', pdfImportRateLimiter);
app.use('/api/ai', strictRateLimiter);
app.use('/api/gemini', strictRateLimiter);
app.use('/api/assistant', strictRateLimiter);

/* ─── Logging com Pino ──────────────────────────────────── */
const logger = pino({
  level: 'info',
});

app.use(pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
    if (res.statusCode >= 500 || err) return 'error';
    if (req.method === 'POST') return 'info';
    return 'debug';
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    remove: true
  }
}));

/* ─── Parsers ───────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ─── Health Check ──────────────────────────────────────── */
app.get('/api/health', async (_req, res) => {
  try {
    const { db } = await import('../server/db/index.js');
    const { sql } = await import('drizzle-orm');

    await db.execute(sql`SELECT 1`);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      platform: 'vercel-serverless',
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      platform: 'vercel-serverless',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/* ─── Request Logger ────────────────────────────────────── */
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;

  res.json = function (body: any) {
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      const dur = Date.now() - start;
      console.log(`[${req.id || 'no-id'}] ${req.method} ${req.path} ${res.statusCode} in ${dur}ms`);
    }
  });

  next();
});

/* ─── Bootstrap & Initialize ────────────────────────────── */
let initialized = false;

async function initializeApp() {
  if (initialized) return;

  try {
    // Register API routes
    await registerRoutes(app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Error';

      console.error('Error handler:', err);

      res.status(status).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    });

    initialized = true;
    console.log('✅ App initialized successfully for Vercel');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    throw error;
  }
}

/* ─── Export for Vercel Serverless ──────────────────────── */
// Vercel expects a default export handler function
export default async function handler(req: any, res: any) {
  try {
    // Initialize on first request
    await initializeApp();

    // Handle the request with Express
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
