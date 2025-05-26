import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = Router();

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Credenciais do admin (em produção, usar base de dados)
const ADMIN_CREDENTIALS = {
  email: 'admin@mariafaz.pt',
  // Hash da password "mariafaz123" (em produção, gerar dinâmicamente)
  passwordHash: '$2b$10$8K1p2fBtEW9QXv2fN7Y4HOfYYjKlN2Z8YfN2fGhR5fN7Y4HOfYYjKl',
  id: 'admin-001',
  name: 'Carina Admin'
};

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Verificar se é o admin
    if (email !== ADMIN_CREDENTIALS.email) {
      return res.status(401).json({
        message: 'Credenciais inválidas'
      });
    }

    // Verificar password (temporariamente aceitar "mariafaz123")
    const isValidPassword = password === 'mariafaz123' || 
                           await bcrypt.compare(password, ADMIN_CREDENTIALS.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Credenciais inválidas'
      });
    }

    // Criar sessão
    req.session.user = {
      id: ADMIN_CREDENTIALS.id,
      email: ADMIN_CREDENTIALS.email,
      name: ADMIN_CREDENTIALS.name,
      isAdmin: true
    };

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: ADMIN_CREDENTIALS.id,
        email: ADMIN_CREDENTIALS.email,
        name: ADMIN_CREDENTIALS.name,
        isAdmin: true
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(400).json({
      message: 'Dados inválidos'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao terminar sessão:', err);
      return res.status(500).json({
        message: 'Erro ao terminar sessão'
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({
      message: 'Logout realizado com sucesso'
    });
  });
});

// GET /api/auth/me - verificar se está logado
router.get('/me', (req: Request, res: Response) => {
  if (!req.session?.user) {
    return res.status(401).json({
      message: 'Não autenticado'
    });
  }

  res.json({
    user: req.session.user
  });
});

export default router;