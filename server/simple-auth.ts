import { Request, Response, NextFunction } from 'express';

// Simulação simples de utilizador admin para desenvolvimento
const ADMIN_USER = {
  id: 'admin-001',
  email: 'admin@mariafaz.pt',
  name: 'Carina Admin',
  isAdmin: true
};

// Middleware simples de autenticação
export function simpleAuth(req: Request, res: Response, next: NextFunction) {
  // Para esta demonstração, sempre consideramos o utilizador como autenticado
  // Em produção, verificaria a sessão real
  (req as any).user = ADMIN_USER;
  next();
}

// Handler simples de login
export function handleLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  
  // Verificação simples
  if (email === 'admin@mariafaz.pt' && password === 'mariafaz123') {
    // Simular criação de sessão
    (req as any).session = { user: ADMIN_USER };
    
    res.json({
      message: 'Login realizado com sucesso',
      user: ADMIN_USER
    });
  } else {
    res.status(401).json({
      message: 'Credenciais inválidas'
    });
  }
}

// Handler para verificar utilizador
export function handleMe(req: Request, res: Response) {
  // Para esta demonstração, sempre retorna o admin
  res.json({
    user: ADMIN_USER
  });
}

// Handler de logout
export function handleLogout(req: Request, res: Response) {
  res.json({
    message: 'Logout realizado com sucesso'
  });
}