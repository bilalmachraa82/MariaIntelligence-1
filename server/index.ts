import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startScheduler } from "./services/scheduler";
import { registerDatabaseRoutes } from "./api/database-routes";
import authRoutes from "./routes/auth.routes";
import simpleOcrRoutes from "./routes/simple-ocr.routes";
import { handleLogin, handleMe, handleLogout } from "./simple-auth";
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

// Configurar sessões
app.use(session({
  secret: process.env.SESSION_SECRET || 'mariafaz-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Para desenvolvimento, usar true em produção com HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

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

// ROTAS DE AUTENTICAÇÃO (antes do Vite interceptar)
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { email, password } = req.body;
  
  if (email === 'admin@mariafaz.pt' && password === 'mariafaz123') {
    req.session.user = {
      id: 'admin-001',
      email: 'admin@mariafaz.pt',
      name: 'Carina Admin',
      isAdmin: true
    };
    
    res.json({
      message: 'Login realizado com sucesso',
      user: req.session.user
    });
  } else {
    res.status(401).json({
      message: 'Credenciais inválidas'
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'Não autenticado' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

// Middleware especial para interceptar rotas de auth ANTES do Vite
app.use((req, res, next) => {
  // Interceptar rotas de autenticação antes do Vite processar
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    console.log('🔐 Interceptando login:', req.body);
    const { email, password } = req.body;
    
    if (email === 'admin@mariafaz.pt' && password === 'mariafaz123') {
      req.session.user = {
        id: 'admin-001',
        email: 'admin@mariafaz.pt',
        name: 'Carina Admin',
        isAdmin: true
      };
      
      return res.json({
        message: 'Login realizado com sucesso',
        user: req.session.user
      });
    } else {
      return res.status(401).json({
        message: 'Credenciais inválidas'
      });
    }
  }
  
  if (req.path === '/api/auth/me' && req.method === 'GET') {
    console.log('👤 Interceptando /me, sessão:', !!req.session.user);
    if (req.session.user) {
      return res.json({ user: req.session.user });
    } else {
      return res.status(401).json({ message: 'Não autenticado' });
    }
  }
  
  if (req.path === '/api/auth/logout' && req.method === 'POST') {
    console.log('🚪 Interceptando logout');
    req.session.destroy(() => {
      return res.json({ message: 'Logout realizado com sucesso' });
    });
    return;
  }
  
  next();
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
  
  // Registrar rotas do OCR simplificado
  app.use('/api/simple-ocr', simpleOcrRoutes);
  
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
