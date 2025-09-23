import type { ValidationResult, ValidationError } from "../types/common.js";

export const createValidationResult = (
  isValid: boolean,
  errors: ValidationError[] = [],
  warnings: ValidationError[] = []
): ValidationResult => ({
  isValid,
  errors,
  warnings,
  status: !isValid ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid'
});

export const validateRequired = (
  value: any,
  fieldName: string
): ValidationError | null => {
  if (value === undefined || value === null || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      severity: 'error'
    };
  }
  return null;
};

export const validateEmail = (
  email: string,
  fieldName: string = 'email'
): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: fieldName,
      message: 'Invalid email format',
      severity: 'error'
    };
  }
  return null;
};

export const validateDateRange = (
  startDate: Date,
  endDate: Date
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (startDate > endDate) {
    errors.push({
      field: 'dateRange',
      message: 'Start date must be before end date',
      severity: 'error'
    });
  }

  return errors;
};