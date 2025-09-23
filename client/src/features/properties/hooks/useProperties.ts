import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../services/propertyApi';
import { Property, PropertyFormData, PropertySearchParams } from '../types';
import { useDebounce } from '@/shared/hooks/useDebounce';

export function useProperties(initialParams?: PropertySearchParams) {
  const [searchParams, setSearchParams] = useState<PropertySearchParams>(initialParams || {});
  const debouncedParams = useDebounce(searchParams, 300);

  const queryKey = ['properties', debouncedParams];

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => propertyApi.getProperties(debouncedParams),
    enabled: true,
  });

  const updateSearchParams = useCallback((newParams: Partial<PropertySearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      page: newParams.page || 1, // Reset page when params change
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchParams({ page: 1 });
  }, []);

  return {
    properties: data?.data?.data || [],
    totalCount: data?.data?.total || 0,
    currentPage: data?.data?.page || 1,
    totalPages: Math.ceil((data?.data?.total || 0) / (data?.data?.limit || 10)),
    isLoading,
    error,
    searchParams,
    updateSearchParams,
    clearFilters,
    refetch,
  };
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyApi.getProperty(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PropertyFormData) => propertyApi.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyFormData> }) =>
      propertyApi.updateProperty(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => propertyApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function usePropertyImages() {
  const queryClient = useQueryClient();

  const uploadImages = useMutation({
    mutationFn: ({ propertyId, files }: { propertyId: string; files: File[] }) =>
      propertyApi.uploadImages(propertyId, files),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
    },
  });

  const deleteImage = useMutation({
    mutationFn: ({ propertyId, imageId }: { propertyId: string; imageId: string }) =>
      propertyApi.deleteImage(propertyId, imageId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
    },
  });

  return {
    uploadImages,
    deleteImage,
  };
}