import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startScheduler } from "./services/scheduler";
import { registerDatabaseRoutes } from "./api/database-routes";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

console.log("Inicializando aplicação...");
const app = express();

// Configurar a aplicação para confiar em proxies
app.set('trust proxy', 1);

// Configuração de rate limiting para prevenir abusos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // limite de 200 solicitações por janela por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    status: 429, 
    message: "Muitas solicitações feitas, tente novamente mais tarde."
  }
});

// Rate limiting específico para endpoints sensíveis
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // limite de 50 solicitações por janela por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    status: 429, 
    message: "Muitas solicitações de autenticação, tente novamente mais tarde."
  }
});

// Adicionar headers de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://*.openrouter.ai", "https://*.googleapis.com"],
    }
  },
  // Configurar para permitir iframe no mesmo domínio
  frameguard: {
    action: "sameorigin"
  },
  // Prevenir MIME type sniffing
  noSniff: true,
  // Prevenir ataques de clickjacking
  xssFilter: true
}));

// Aplicar limitador de taxa a todas as rotas da API
app.use('/api/', apiLimiter);

// Limitador específico para endpoints sensíveis
app.use('/api/upload-pdf', authLimiter);
app.use('/api/upload-control-file', authLimiter);
app.use('/api/upload-image', authLimiter);

app.use(express.json({
  limit: '2mb' // Limitar tamanho do payload JSON
}));
app.use(express.urlencoded({ 
  extended: false,
  limit: '2mb' // Limitar tamanho de dados de formulário
}));

// Adicionando rota de teste simples
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
  console.log("Rota de saúde acessada");
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Registrar rotas de gerenciamento de banco de dados
  registerDatabaseRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Servindo a aplicação na porta 5000 para compatibilidade com o workflow
  // esta porta serve tanto a API quanto o cliente
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Iniciar o agendador de tarefas automáticas
    startScheduler();
    log('✅ Agendador de tarefas automáticas iniciado');
  });
})();
