import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

// Simulação simples de autenticação para desenvolvimento
const MOCK_USER: User = {
  id: 'admin-001',
  email: 'admin@mariafaz.pt',
  name: 'Carina Admin',
  isAdmin: true
};

// Chave para armazenar o estado de login no localStorage
const AUTH_KEY = 'mariafaz-auth';

export function useAuth() {
  const queryClient = useQueryClient();

  // Verificar se o utilizador está logado (simulação)
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        return MOCK_USER;
      }
      return null;
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      // Simulação simples de verificação de credenciais
      if (credentials.email === 'admin@mariafaz.pt' && credentials.password === 'mariafaz123') {
        localStorage.setItem(AUTH_KEY, 'true');
        return MOCK_USER;
      } else {
        throw new Error('Credenciais inválidas');
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'user'], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem(AUTH_KEY);
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
    },
  });
}