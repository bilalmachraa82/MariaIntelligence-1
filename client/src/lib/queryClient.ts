import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
        const enhanced = new Error(`${res.status}: ${errorMessage}`);
        enhanced.response = { status: res.status, data: errorDetails };
        throw enhanced;
      } else {
        // Se não for JSON, lê como texto
        const text = await res.text();
        errorMessage = text || errorMessage;
      }
    } catch (parseError) {
      if (parseError.response) {
        throw parseError; // Já é um erro aprimorado
      }
      // Se não conseguir analisar, usa o texto da resposta ou status
      console.error("Erro ao analisar resposta:", parseError);
    }
    
    // Criar um erro padrão com informações básicas
    const error = new Error(`${res.status}: ${errorMessage}`);
    error.response = { status: res.status, data: errorDetails };
    throw error;
  }
}

export async function apiRequest<T = any>(
  method: string = "GET", 
  url: string, 
  data?: unknown
): Promise<Response> {
  try {
    console.log(`API Request: ${method} ${url}`, data ? `data: ${JSON.stringify(data)}` : "");
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    console.log(`API Response: ${method} ${url} - Status: ${res.status}`);
    return res;
  } catch (error) {
    console.error(`API Error: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
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
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
