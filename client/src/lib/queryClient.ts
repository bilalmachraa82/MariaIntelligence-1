import { QueryClient, QueryFunction } from "@tanstack/react-query";

interface ExtendedError extends Error {
  response?: {
    status: number;
    data: Record<string, any>;
  };
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorDetails = {};
    
    try {
      // Tenta analisar a resposta como JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData;
        
        // Criar um erro melhorado com os detalhes
        const enhanced = new Error(`${res.status}: ${errorMessage}`) as ExtendedError;
        enhanced.response = { status: res.status, data: errorDetails };
        throw enhanced;
      } else {
        // Se não for JSON, lê como texto
        const text = await res.text();
        errorMessage = text || errorMessage;
      }
    } catch (parseError) {
      const err = parseError as ExtendedError;
      if (err.response) {
        throw parseError; // Já é um erro aprimorado
      }
      // Se não conseguir analisar, usa o texto da resposta ou status
      console.error("Erro ao analisar resposta:", parseError);
    }
    
    // Criar um erro padrão com informações básicas
    const error = new Error(`${res.status}: ${errorMessage}`) as ExtendedError;
    error.response = { status: res.status, data: errorDetails };
    throw error;
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<T> {
  try {
    const method = options?.method || "GET";
    console.log(`API Request: ${url} ${options ? JSON.stringify(options) : ""}`);
    
    const res = await fetch(url, {
      method: method,
      headers: options?.headers || {},
      body: options?.body,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    const data = await res.json();
    return data as T;
  } catch (error) {
    console.error(`API Error: ${url} ${options ? JSON.stringify(options) : ""}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Extrair a URL base e os parâmetros da queryKey
    const baseUrl = queryKey[0] as string;
    const params = new URLSearchParams();
    
    // Adicionar parâmetros adicionais se existirem
    if (queryKey.length > 1) {
      // Processa parâmetros de startDate e endDate se existirem
      for (let i = 1; i < queryKey.length; i++) {
        const param = queryKey[i];
        if (i === 1 && param) {
          params.append('startDate', param as string);
        } else if (i === 2 && param) {
          params.append('endDate', param as string);
        }
      }
    }
    
    // Construir a URL completa com parâmetros
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    console.log(`Fazendo requisição para: ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,  // Desativado para reduzir chamadas desnecessárias
      refetchOnMount: false,        // Não buscar dados novamente ao montar componentes
      staleTime: 5 * 60 * 1000,     // Aumentado para 5 minutos para reduzir chamadas
      gcTime: 30 * 60 * 1000,       // Cache de 30 minutos
      retry: 1,                     // Limita a uma tentativa de repetição para falhas
    },
    mutations: {
      retry: false,
    },
  },
});
