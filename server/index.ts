/* ─── Carregar variáveis .env logo no arranque ───────── */
import 'dotenv/config';

/* ─── Imports do servidor ────────────────────────────── */
import express, { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

/* ─── Imports de segurança ─────────────────────────── */
import {
  securityMiddlewareStack,
  apiRateLimiter,
  pdfImportRateLimiter,
  strictRateLimiter,
  securityLogger
} from './middleware/security';

/* ─── Inicialização da app ─────────────────────────── */
console.log('Inicializando aplicação com segurança aprimorada…');
const app = express();
export { app };

/* ─── Configuração de segurança aprimorada ───────────────────── */
// Aplicar stack completo de middleware de segurança
app.use(securityMiddlewareStack);

// Rate limiting diferenciado por tipo de operação
app.use('/api/', apiRateLimiter); // 100 req/15min para API geral
app.use('/api/upload', pdfImportRateLimiter); // 10 req/hour para upload de PDF
app.use('/api/ocr', pdfImportRateLimiter); // 10 req/hour para OCR
app.use('/api/ai', strictRateLimiter); // 20 req/hour para operações de IA
app.use('/api/gemini', strictRateLimiter); // 20 req/hour para Gemini API
app.use('/api/assistant', strictRateLimiter); // 20 req/hour para assistente

// Configurar Pino para logs em formato JSON
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

// Middleware de logging HTTP com Pino
app.use(pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
    if (res.statusCode >= 500 || err) return 'error';
    if (req.method === 'POST') return 'info';
    return 'debug';
  },
  // Excluir headers sensíveis dos logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    remove: true
  }
}));

// Parsers para JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* End‑point de saúde */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/* Logger simples p/ rotas /api */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let captured: any;

  const originalJson = res.json;
  res.json = function (body: any) {
    captured = body;
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    if (path.startsWith('/api')) {
      const dur = Date.now() - start;
      let line = `${req.method} ${path} ${res.statusCode} in ${dur}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 120) line = line.slice(0, 119) + '…';
      log(line);
    }
  });

  next();
});

/* ─── Bootstrap async ────────────────────────────────── */
(async () => {
  const server = await registerRoutes(app);

  /* Error‑handler */
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      res.status(status).json({ message: err.message || 'Internal Error' });
      console.error(err);
    },
  );

  /* Vite em dev, static em prod */
  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  /* ─── Listen (host + port separados) ───────────────── */
  // O servidor já foi inicializado na função registerRoutes
  // Apenas log da informação
  const port = Number(process.env.PORT) || 5100;
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`Server listening on port ${port}`);
})();
