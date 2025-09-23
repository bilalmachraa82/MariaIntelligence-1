// Global TypeScript type definitions for the feature-based architecture

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isLoading: boolean;
  isValid: boolean;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// UI Component Types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  width?: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType;
  children?: NavItem[];
  permissions?: string[];
}

// Theme Types
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
}