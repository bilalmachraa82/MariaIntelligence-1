import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthResponse {
  user: User;
  message: string;
}

// Hook para verificar se utilizador está autenticado
export function useAuth() {
  return useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para fazer login
export function useLogin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer login');
      }

      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      // Invalidar cache e atualizar dados do utilizador
      queryClient.setQueryData(['/api/auth/me'], { user: data.user });
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vinda, ${data.user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// Hook para fazer logout
export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer logout');
      }

      return response.json();
    },
    onSuccess: () => {
      // Limpar todos os dados em cache
      queryClient.clear();
      toast({
        title: "Logout realizado",
        description: "Sessão terminada com sucesso",
      });
      // Redirecionar para login
      window.location.href = '/login';
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}