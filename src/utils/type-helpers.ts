/**
 * Type Helper Utilities for Enhanced TypeScript Experience
 * MariaIntelligence 2025 - Code Quality Enhancement
 */

// Utility to extract return type from function
export type ReturnTypeOf<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : never;

// Utility to make specific properties required
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Utility to make specific properties optional
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility to extract function arguments
export type ArgumentsOf<T extends (...args: any[]) => any> = T extends (...args: infer A) => any ? A : never;

// Deep readonly utility
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Utility for strict object keys
export type StrictKeys<T> = keyof T extends never ? never : keyof T;

// Promise result utility
export type PromiseResult<T> = T extends Promise<infer U> ? U : T;

// Function that ensures return types are properly typed
export const withReturnType = <T>(fn: () => T): () => T => fn;

// Generic async function wrapper with proper typing
export const asyncFunction = <TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): ((...args: TArgs) => Promise<TReturn>) => fn;

// Type-safe event handler creator
export const createEventHandler = <T>(
  handler: (event: T) => void
): ((event: T) => void) => handler;

// Utility to ensure component props have proper typing
export const defineComponent = <TProps>(
  component: React.FC<TProps>
): React.FC<TProps> => component;

// Generic factory function with proper typing
export const createFactory = <T, TArgs extends any[]>(
  creator: (...args: TArgs) => T
) => (...args: TArgs): T => creator(...args);

// Type-safe API endpoint creator
export const createApiEndpoint = <TRequest, TResponse>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
) => ({
  endpoint,
  method,
  call: (data?: TRequest): Promise<TResponse> => {
    // Implementation would go here
    throw new Error('Implementation required');
  }
});

// Utility for creating type-safe reducers
export type Reducer<TState, TAction> = (state: TState, action: TAction) => TState;

export const createReducer = <TState, TAction>(
  initialState: TState,
  reducer: Reducer<TState, TAction>
) => ({
  initialState,
  reducer
});

// Type-safe local storage utilities
export const createTypedStorage = <T extends Record<string, any>>(prefix: string) => ({
  getItem: <K extends keyof T>(key: K): T[K] | null => {
    try {
      const item = localStorage.getItem(`${prefix}_${String(key)}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  setItem: <K extends keyof T>(key: K, value: T[K]): void => {
    localStorage.setItem(`${prefix}_${String(key)}`, JSON.stringify(value));
  },
  removeItem: <K extends keyof T>(key: K): void => {
    localStorage.removeItem(`${prefix}_${String(key)}`);
  }
});

// Utility for creating type-safe hooks
export const createTypedHook = <TArgs extends any[], TReturn>(
  hook: (...args: TArgs) => TReturn
) => (...args: TArgs): TReturn => hook(...args);

// Generic validation function creator
export const createValidator = <T>(
  validationRules: Record<keyof T, (value: any) => string | undefined>
) => (data: T): { isValid: boolean; errors: Record<keyof T, string> } => {
  const errors = {} as Record<keyof T, string>;
  let isValid = true;

  for (const key in validationRules) {
    const error = validationRules[key](data[key]);
    if (error) {
      errors[key] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Utility for creating type-safe forms
export interface FormConfig<T> {
  initialValues: T;
  validationRules?: Partial<Record<keyof T, (value: any) => string | undefined>>;
  onSubmit: (values: T) => Promise<void> | void;
}

export const createForm = <T extends Record<string, any>>(config: FormConfig<T>) => {
  const validator = config.validationRules
    ? createValidator(config.validationRules as Record<keyof T, (value: any) => string | undefined>)
    : null;

  return {
    ...config,
    validate: validator ? (data: T) => validator(data) : null
  };
};

// Type-safe error boundary creator
export interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

// Utility for creating typed API services
export const createApiService = <T>(baseUrl: string) => ({
  get: async <TResponse = T>(endpoint: string): Promise<TResponse> => {
    const response = await fetch(`${baseUrl}${endpoint}`);
    return response.json();
  },
  post: async <TRequest, TResponse = T>(endpoint: string, data: TRequest): Promise<TResponse> => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  put: async <TRequest, TResponse = T>(endpoint: string, data: TRequest): Promise<TResponse> => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  delete: async <TResponse = boolean>(endpoint: string): Promise<TResponse> => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE'
    });
    return response.json();
  }
});

// Export all utilities for comprehensive TypeScript enhancement
export * from '../types/enhanced-types';