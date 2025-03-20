import { QueryClient } from "@tanstack/react-query";

// Função padrão para fazer requisições baseada na chave da query
const defaultQueryFn = async ({ queryKey }: { queryKey: any }): Promise<any> => {
  // A primeira posição do queryKey geralmente é a URL da requisição
  const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  
  if (typeof url !== 'string') {
    throw new Error(`Invalid queryKey: ${JSON.stringify(queryKey)}`);
  }
  
  return apiRequest(url);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      queryFn: defaultQueryFn,
    },
  },
});

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface ApiRequestOptions {
  method?: string;
  data?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T = unknown>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", data, headers = {} } = options;
  
  const fetchOptions: FetchOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    // Handle specific HTTP errors here
    if (response.status === 401) {
      throw new Error("Unauthorized. Please check your credentials.");
    }
    if (response.status === 404) {
      throw new Error("Resource not found.");
    }
    // Try to get error details from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || "API request failed");
    } catch {
      throw new Error(`API request failed with status: ${response.status}`);
    }
  }

  return response.json();
}

export function getQueryFn<T = unknown>(url: string, options: ApiRequestOptions = {}) {
  return async (): Promise<T> => {
    return apiRequest<T>(url, options);
  };
}