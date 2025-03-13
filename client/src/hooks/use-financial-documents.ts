import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type FinancialDocument, type FinancialDocumentItem, type PaymentRecord } from "@shared/schema";

// Types para uso nas operações de filtragem
export interface FinancialDocumentFilters {
  type?: 'incoming' | 'outgoing';
  status?: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  entityId?: number;
  entityType?: 'owner' | 'supplier';
  startDate?: string;
  endDate?: string;
}

// Obter todos os documentos financeiros (com filtros opcionais)
export function useFinancialDocuments(filters?: FinancialDocumentFilters) {
  // Construir os parâmetros de query string para os filtros
  const queryParams = new URLSearchParams();
  
  if (filters) {
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.entityId) queryParams.append('entityId', filters.entityId.toString());
    if (filters.entityType) queryParams.append('entityType', filters.entityType);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/financial-documents?${queryString}` : '/api/financial-documents';
  
  return useQuery({
    queryKey: ["/api/financial-documents", filters],
    queryFn: async () => {
      const res = await apiRequest("GET", endpoint);
      return await res.json();
    }
  });
}

// Obter um documento financeiro específico pelo ID (incluindo itens e pagamentos)
export function useFinancialDocument(id: number | undefined) {
  return useQuery({
    queryKey: ["/api/financial-documents", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/financial-documents/${id}`);
      return await res.json();
    }
  });
}

// Criar um novo documento financeiro
export function useCreateFinancialDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (documentData: Omit<FinancialDocument, "id" | "createdAt" | "updatedAt"> & { items?: Omit<FinancialDocumentItem, "id" | "documentId" | "createdAt">[] }) => {
      const res = await apiRequest("POST", "/api/financial-documents", documentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Atualizar um documento financeiro existente
export function useUpdateFinancialDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FinancialDocument> }) => {
      const res = await apiRequest("PATCH", `/api/financial-documents/${id}`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents", variables.id] });
    },
  });
}

// Excluir um documento financeiro
export function useDeleteFinancialDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/financial-documents/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Obter os itens de um documento financeiro
export function useFinancialDocumentItems(documentId: number | undefined) {
  return useQuery({
    queryKey: ["/api/financial-document-items", documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/financial-document-items/${documentId}`);
      return await res.json();
    }
  });
}

// Criar um novo item de documento financeiro
export function useCreateFinancialDocumentItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itemData: Omit<FinancialDocumentItem, "id" | "createdAt">) => {
      const res = await apiRequest("POST", "/api/financial-document-items", itemData);
      return await res.json();
    },
    onSuccess: (data) => {
      const documentId = data.documentId;
      queryClient.invalidateQueries({ queryKey: ["/api/financial-document-items", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Atualizar um item de documento financeiro
export function useUpdateFinancialDocumentItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FinancialDocumentItem> }) => {
      const res = await apiRequest("PATCH", `/api/financial-document-items/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      const documentId = data.documentId;
      queryClient.invalidateQueries({ queryKey: ["/api/financial-document-items", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Excluir um item de documento financeiro
export function useDeleteFinancialDocumentItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/financial-document-items/${id}`);
      return id;
    },
    onSuccess: (_, variables) => {
      // Como não temos acesso ao documentId após a exclusão, precisamos invalidar todas as consultas relevantes
      queryClient.invalidateQueries({ queryKey: ["/api/financial-document-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Obter todos os registros de pagamento (opcionalmente filtrados por documento)
export function usePaymentRecords(documentId?: number) {
  const endpoint = documentId 
    ? `/api/payment-records?documentId=${documentId}` 
    : '/api/payment-records';
  
  return useQuery({
    queryKey: ["/api/payment-records", documentId],
    queryFn: async () => {
      const res = await apiRequest("GET", endpoint);
      return await res.json();
    }
  });
}

// Obter um registro de pagamento específico pelo ID
export function usePaymentRecord(id: number | undefined) {
  return useQuery({
    queryKey: ["/api/payment-records", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/payment-records/${id}`);
      return await res.json();
    }
  });
}

// Criar um novo registro de pagamento
export function useCreatePaymentRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentData: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">) => {
      const res = await apiRequest("POST", "/api/payment-records", paymentData);
      return await res.json();
    },
    onSuccess: (data) => {
      const documentId = data.documentId;
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Atualizar um registro de pagamento
export function useUpdatePaymentRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PaymentRecord> }) => {
      const res = await apiRequest("PATCH", `/api/payment-records/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      const documentId = data.documentId;
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents", documentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Excluir um registro de pagamento
export function useDeletePaymentRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payment-records/${id}`);
      return id;
    },
    onSuccess: () => {
      // Como não temos acesso ao documentId após a exclusão, precisamos invalidar todas as consultas relevantes
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
    },
  });
}

// Obter relatório financeiro por proprietário
export function useOwnerFinancialReport(ownerId: number | undefined, month?: string, year?: string) {
  const queryParams = new URLSearchParams();
  
  if (month) queryParams.append('month', month);
  if (year) queryParams.append('year', year);
  
  const queryString = queryParams.toString();
  const endpoint = queryString 
    ? `/api/reports/owner/${ownerId}?${queryString}` 
    : `/api/reports/owner/${ownerId}`;
  
  return useQuery({
    queryKey: ["/api/reports/owner", ownerId, month, year],
    enabled: !!ownerId && !!month && !!year,
    queryFn: async () => {
      const res = await apiRequest("GET", endpoint);
      return await res.json();
    }
  });
}

// Obter relatório financeiro geral
export function useFinancialSummary(startDate?: string, endDate?: string) {
  const queryParams = new URLSearchParams();
  
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const queryString = queryParams.toString();
  const endpoint = queryString 
    ? `/api/reports/financial-summary?${queryString}` 
    : '/api/reports/financial-summary';
  
  return useQuery({
    queryKey: ["/api/reports/financial-summary", startDate, endDate],
    queryFn: async () => {
      const res = await apiRequest("GET", endpoint);
      return await res.json();
    }
  });
}