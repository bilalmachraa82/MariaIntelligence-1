/* ─── Carregar variáveis .env logo no arranque ───────── */
import 'dotenv/config';

/* ─── Imports do servidor ────────────────────────────── */
import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

/* ─── Inicialização da app ───────────────────────────── */
console.log('Inicializando aplicação…');
const app = express();
export { app };
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
  res.json = function (body, ...args) {
    captured = body;
    return originalJson.apply(res, [body, ...args]);
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
