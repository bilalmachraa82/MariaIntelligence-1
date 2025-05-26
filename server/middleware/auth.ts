import { Request, Response, NextFunction } from 'express';
import session from 'express-session';

// Estender interface Request para incluir user e session
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
      };
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
    };
  }
}

// Middleware para verificar se utilizador está autenticado
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ 
      message: 'Acesso negado. Login necessário.' 
    });
  }
  
  // Adicionar user ao request
  req.user = req.session.user;
  next();
}

// Middleware para verificar se é admin (para futuro)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user?.isAdmin) {
    return res.status(403).json({ 
      message: 'Acesso negado. Privilégios de administrador necessários.' 
    });
  }
  
  req.user = req.session.user;
  next();
}

// Helper para verificar se está logado
export function isAuthenticated(req: Request): boolean {
  return !!req.session?.user;
}