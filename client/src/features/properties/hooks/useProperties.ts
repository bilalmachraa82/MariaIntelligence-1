import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../services/propertyApi';
import { Property, PropertyFormData, PropertySearchParams } from '../types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: PropertyFormData) => propertyApi.createProperty(data),

    onMutate: async (newProperty) => {
      await queryClient.cancelQueries({ queryKey: ['properties'] });

      const previousProperties = queryClient.getQueryData(['properties']);

      // Optimistically update cache
      queryClient.setQueriesData({ queryKey: ['properties'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: [
              ...old.data.data,
              {
                ...newProperty,
                id: `temp-${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ],
            total: (old.data.total || 0) + 1
          }
        };
      });

      return { previousProperties };
    },

    onError: (err, newProperty, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties'], context.previousProperties);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao criar propriedade',
        variant: 'destructive'
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: 'Sucesso',
        description: 'Propriedade criada com sucesso'
      });
    }
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PropertyFormData> }) =>
      propertyApi.updateProperty(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['properties'] });
      await queryClient.cancelQueries({ queryKey: ['property', id] });

      const previousProperties = queryClient.getQueryData(['properties']);
      const previousProperty = queryClient.getQueryData(['property', id]);

      // Optimistically update in list
      queryClient.setQueriesData({ queryKey: ['properties'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((p: any) =>
              p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
            )
          }
        };
      });

      // Optimistically update single property cache
      queryClient.setQueryData(['property', id], (old: any) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      return { previousProperties, previousProperty };
    },

    onError: (err, { id }, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties'], context.previousProperties);
      }
      if (context?.previousProperty) {
        queryClient.setQueryData(['property', id], context.previousProperty);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar propriedade',
        variant: 'destructive'
      });
    },

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
      toast({
        title: 'Sucesso',
        description: 'Propriedade atualizada com sucesso'
      });
    }
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => propertyApi.deleteProperty(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['properties'] });
      await queryClient.cancelQueries({ queryKey: ['property', id] });

      const previousProperties = queryClient.getQueryData(['properties']);
      const previousProperty = queryClient.getQueryData(['property', id]);

      // Optimistically remove from list
      queryClient.setQueriesData({ queryKey: ['properties'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.filter((p: any) => p.id !== id),
            total: Math.max(0, (old.data.total || 0) - 1)
          }
        };
      });

      // Remove single property cache
      queryClient.removeQueries({ queryKey: ['property', id] });

      return { previousProperties, previousProperty };
    },

    onError: (err, id, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties'], context.previousProperties);
      }
      if (context?.previousProperty) {
        queryClient.setQueryData(['property', id], context.previousProperty);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao excluir propriedade',
        variant: 'destructive'
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: 'Sucesso',
        description: 'Propriedade excluída com sucesso'
      });
    }
  });
}

export function usePropertyImages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadImages = useMutation({
    mutationFn: ({ propertyId, files }: { propertyId: string; files: File[] }) =>
      propertyApi.uploadImages(propertyId, files),

    onMutate: async ({ propertyId, files }) => {
      await queryClient.cancelQueries({ queryKey: ['property', propertyId] });

      const previousProperty = queryClient.getQueryData(['property', propertyId]);

      // Optimistically add placeholder images
      queryClient.setQueryData(['property', propertyId], (old: any) => {
        if (!old) return old;
        const placeholders = files.map((file, index) => ({
          id: `temp-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          name: file.name,
          uploading: true
        }));
        return {
          ...old,
          images: [...(old.images || []), ...placeholders]
        };
      });

      return { previousProperty };
    },

    onError: (err, { propertyId }, context) => {
      if (context?.previousProperty) {
        queryClient.setQueryData(['property', propertyId], context.previousProperty);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload das imagens',
        variant: 'destructive'
      });
    },

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
      toast({
        title: 'Sucesso',
        description: 'Imagens enviadas com sucesso'
      });
    },
  });

  const deleteImage = useMutation({
    mutationFn: ({ propertyId, imageId }: { propertyId: string; imageId: string }) =>
      propertyApi.deleteImage(propertyId, imageId),

    onMutate: async ({ propertyId, imageId }) => {
      await queryClient.cancelQueries({ queryKey: ['property', propertyId] });

      const previousProperty = queryClient.getQueryData(['property', propertyId]);

      // Optimistically remove image
      queryClient.setQueryData(['property', propertyId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          images: (old.images || []).filter((img: any) => img.id !== imageId)
        };
      });

      return { previousProperty };
    },

    onError: (err, { propertyId }, context) => {
      if (context?.previousProperty) {
        queryClient.setQueryData(['property', propertyId], context.previousProperty);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao excluir imagem',
        variant: 'destructive'
      });
    },

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property', variables.propertyId] });
      toast({
        title: 'Sucesso',
        description: 'Imagem excluída com sucesso'
      });
    },
  });

  return {
    uploadImages,
    deleteImage,
  };
}