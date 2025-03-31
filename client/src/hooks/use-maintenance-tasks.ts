import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaintenanceTask, InsertMaintenanceTask } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

/**
 * Hook para gerenciar tarefas de manutenção
 */
export function useMaintenanceTasks(propertyId?: number, status?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Construir a URL de consulta com base nos parâmetros
  let queryUrl = '/api/maintenance-tasks';
  let params = new URLSearchParams();
  
  if (propertyId) {
    params.append('propertyId', propertyId.toString());
  }
  
  if (status) {
    params.append('status', status);
  }
  
  const queryString = params.toString();
  if (queryString) {
    queryUrl += `?${queryString}`;
  }

  // Consultar tarefas de manutenção
  const { data: maintenanceTasks = [], isLoading, isError, error } = useQuery<MaintenanceTask[]>({
    queryKey: ['/api/maintenance-tasks', { propertyId, status }],
    queryFn: () => apiRequest(queryUrl),
    retry: 1, // Limitar novas tentativas para evitar loops em caso de falha
  });

  // Criar nova tarefa de manutenção
  const createMutation = useMutation({
    mutationFn: async (newTask: InsertMaintenanceTask) => {
      return await apiRequest('/api/maintenance-tasks', {
        method: 'POST',
        data: newTask,
      });
    },
    onSuccess: () => {
      // Invalidar consultas para recarregar dados
      queryClient.invalidateQueries({ 
        queryKey: ['/api/maintenance-tasks'] 
      });
      
      toast({
        title: t('maintenance.taskCreated', 'Tarefa criada com sucesso'),
        description: t('maintenance.taskCreatedDescription', 'A nova tarefa de manutenção foi adicionada ao sistema.'),
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao criar tarefa:', error);
      toast({
        title: t('maintenance.errorCreating', 'Erro ao criar tarefa'),
        description: error.message || t('maintenance.tryAgain', 'Tente novamente mais tarde.'),
        variant: 'destructive',
      });
    },
  });

  // Atualizar tarefa de manutenção
  const updateMutation = useMutation({
    mutationFn: async ({ id, taskData }: { id: number, taskData: Partial<InsertMaintenanceTask> }) => {
      return await apiRequest(`/api/maintenance-tasks/${id}`, {
        method: 'PATCH',
        data: taskData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-tasks'] });
      toast({
        title: t('maintenance.taskUpdated', 'Tarefa atualizada'),
        description: t('maintenance.taskUpdatedDescription', 'A tarefa de manutenção foi atualizada com sucesso.'),
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: t('maintenance.errorUpdating', 'Erro ao atualizar tarefa'),
        description: error.message || t('maintenance.tryAgain', 'Tente novamente mais tarde.'),
        variant: 'destructive',
      });
    },
  });

  // Deletar tarefa de manutenção
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/maintenance-tasks/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-tasks'] });
      toast({
        title: t('maintenance.taskDeleted', 'Tarefa removida'),
        description: t('maintenance.taskDeletedDescription', 'A tarefa de manutenção foi removida com sucesso.'),
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar tarefa:', error);
      toast({
        title: t('maintenance.errorDeleting', 'Erro ao remover tarefa'),
        description: error.message || t('maintenance.tryAgain', 'Tente novamente mais tarde.'),
        variant: 'destructive',
      });
    },
  });

  return {
    maintenanceTasks,
    isLoading,
    isError,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isPendingCreate: createMutation.isPending,
    isPendingUpdate: updateMutation.isPending,
    isPendingDelete: deleteMutation.isPending,
  };
}