/**
 * Enhanced TypeScript types for MariaIntelligence 2025
 * Comprehensive type definitions with generics for better reusability
 */

// Enhanced generic response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Generic CRUD operations interface
export interface CrudOperations<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  findAll(): Promise<ApiResponse<T[]>>;
  findById(id: string | number): Promise<ApiResponse<T>>;
  create(data: CreateInput): Promise<ApiResponse<T>>;
  update(id: string | number, data: UpdateInput): Promise<ApiResponse<T>>;
  delete(id: string | number): Promise<ApiResponse<boolean>>;
}

// Enhanced pagination interface with generics
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Generic filter interface
export interface FilterOptions<T = Record<string, any>> {
  search?: string;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  filters?: Partial<T>;
}

// Enhanced component props with children
export interface BaseComponentProps<T = {}> {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
  loading?: boolean;
  error?: string | null;
  data?: T;
}

// Generic form field interface
export interface FormField<T = any> {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  validation?: (value: any) => string | undefined;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
}

// Enhanced form props with generic typing
export interface FormProps<T = Record<string, any>> {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void> | void;
  fields: FormField<T>[];
  submitText?: string;
  resetText?: string;
  loading?: boolean;
  error?: string | null;
}

// Generic chart data interface
export interface ChartDataPoint<T = any> {
  name: string;
  value: number;
  category?: string;
  metadata?: T;
}

// Enhanced chart props
export interface ChartProps<T = any> {
  data: ChartDataPoint<T>[];
  colors?: string[];
  height?: number;
  width?: number;
  loading?: boolean;
  error?: string | null;
  onDataPointClick?: (data: ChartDataPoint<T>) => void;
}

// Generic service interface for type-safe API calls
export interface Service<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  baseUrl: string;
  headers?: Record<string, string>;

  get(endpoint: string): Promise<ApiResponse<T>>;
  post(endpoint: string, data: CreateInput): Promise<ApiResponse<T>>;
  put(endpoint: string, data: UpdateInput): Promise<ApiResponse<T>>;
  delete(endpoint: string): Promise<ApiResponse<boolean>>;

  // Batch operations
  batchCreate(data: CreateInput[]): Promise<ApiResponse<T[]>>;
  batchUpdate(updates: Array<{ id: string | number; data: UpdateInput }>): Promise<ApiResponse<T[]>>;
  batchDelete(ids: Array<string | number>): Promise<ApiResponse<boolean>>;
}

// Enhanced error handling types
export interface ErrorWithCode extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
}

// Type-safe event emitter
export interface TypeSafeEventEmitter<Events extends Record<string, any>> {
  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void;
  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
}

// Generic validation result
export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: Array<{
    field: keyof T;
    message: string;
    code: string;
  }>;
  warnings?: Array<{
    field: keyof T;
    message: string;
  }>;
}

// Enhanced async operation state
export interface AsyncState<T = any, E = ErrorWithCode> {
  data: T | null;
  loading: boolean;
  error: E | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

// Generic list operations
export interface ListOperations<T> {
  items: T[];
  selectedItems: T[];
  selectItem: (item: T) => void;
  selectItems: (items: T[]) => void;
  clearSelection: () => void;
  toggleItem: (item: T) => void;
  addItem: (item: T) => void;
  removeItem: (item: T) => void;
  updateItem: (item: T, updates: Partial<T>) => void;
}

// Type utilities for better TypeScript inference
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Generic storage interface
export interface Storage<T = any> {
  getItem<K extends keyof T>(key: K): T[K] | null;
  setItem<K extends keyof T>(key: K, value: T[K]): void;
  removeItem<K extends keyof T>(key: K): void;
  clear(): void;
  getAllKeys(): Array<keyof T>;
}

// Enhanced configuration interface
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    enableDarkMode: boolean;
    enableAnalytics: boolean;
    enableOfflineMode: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
}

// Generic repository pattern
export interface Repository<T, ID = string | number> {
  find(criteria: Partial<T>): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<boolean>;
  count(criteria?: Partial<T>): Promise<number>;
}