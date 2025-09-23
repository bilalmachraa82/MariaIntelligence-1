export interface BaseEntity {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  [key: string]: any;
}

export interface RequestParams extends PaginationParams, SortParams, FilterParams {}

export type ValidationError = {
  field: string;
  message: string;
  severity?: 'error' | 'warning';
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
  status: 'valid' | 'invalid' | 'warning';
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationResult?: ValidationResult;
}