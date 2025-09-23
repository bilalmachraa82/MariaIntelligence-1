import { useState, useCallback } from 'react';
import { FormState } from '../types';

type ValidationRule<T> = {
  [K in keyof T]?: (value: T[K]) => string | undefined;
};

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRule<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialValues,
    errors: {},
    isLoading: false,
    isValid: true,
  });

  const setValue = useCallback((name: keyof T, value: any) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [name]: value },
      errors: { ...prev.errors, [name]: '' },
    }));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
      isValid: false,
    }));
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(key => {
      const rule = validationRules[key as keyof T];
      if (rule) {
        const error = rule(formState.data[key as keyof T]);
        if (error) {
          errors[key] = error;
          isValid = false;
        }
      }
    });

    setFormState(prev => ({ ...prev, errors, isValid }));
    return isValid;
  }, [formState.data, validationRules]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setFormState(prev => ({ ...prev, isLoading: true }));

    try {
      await onSubmit?.(formState.data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  }, [formState.data, onSubmit, validate]);

  const reset = useCallback(() => {
    setFormState({
      data: initialValues,
      errors: {},
      isLoading: false,
      isValid: true,
    });
  }, [initialValues]);

  return {
    ...formState,
    setValue,
    setError,
    validate,
    handleSubmit,
    reset,
  };
}