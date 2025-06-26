import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ConsolidatedProcessingResult {
  success: boolean;
  extractedData?: {
    propertyName: string;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    checkInDate: string;
    checkOutDate: string;
    numGuests?: number;
    totalAmount?: number;
    platform?: string;
    reference?: string;
    platformFee?: number;
    cleaningFee?: number;
    checkInFee?: number;
    commission?: number;
    teamPayment?: number;
    propertyId?: number;
  };
  validation?: {
    status: string;
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: string;
    }>;
    missingFields: string[];
    warningFields: string[];
  };
  propertyFound: boolean;
  propertyId?: number;
  message: string;
  error?: string;
}

interface CreatedReservation {
  success: boolean;
  reservation?: {
    id: number;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: string;
    propertyId: number;
  };
  message: string;
  error?: string;
}

export function useConsolidatedPdf() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [processingResult, setProcessingResult] = useState<ConsolidatedProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Process a PDF file using the consolidated system
   */
  const processPDF = async (file: File): Promise<ConsolidatedProcessingResult | null> => {
    if (!file || file.type !== 'application/pdf') {
      setError("Por favor selecione um arquivo PDF válido");
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      console.log(`📄 Processando PDF: ${file.name} via sistema consolidado`);

      const response = await fetch('/api/pdf/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result: ConsolidatedProcessingResult = await response.json();
      
      setProcessingResult(result);
      
      if (result.success) {
        toast({
          title: "PDF processado com sucesso",
          description: `Dados extraídos para: ${result.extractedData?.guestName || 'Hóspede'}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Erro no processamento",
          description: result.message || "Falha ao processar PDF",
          variant: "destructive",
        });
        setError(result.message || "Falha no processamento");
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro no processamento:', error);
      
      setError(errorMessage);
      toast({
        title: "Erro no processamento",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Create a reservation from processed PDF data
   */
  const createReservation = async (data: ConsolidatedProcessingResult): Promise<boolean> => {
    if (!data.success || !data.extractedData) {
      setError("Dados insuficientes para criar reserva");
      return false;
    }

    setIsCreatingReservation(true);
    setError(null);

    try {
      console.log('📝 Criando reserva via sistema consolidado');

      const response = await fetch('/api/pdf/create-reservation-from-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedData: data.extractedData,
          validation: data.validation,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result: CreatedReservation = await response.json();

      if (result.success) {
        toast({
          title: "Reserva criada com sucesso",
          description: `Reserva ID: ${result.reservation?.id} para ${result.reservation?.guestName}`,
          variant: "default",
        });

        // Invalidate relevant queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
        queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });

        return true;
      } else {
        toast({
          title: "Erro ao criar reserva",
          description: result.message || "Falha ao criar reserva",
          variant: "destructive",
        });
        setError(result.message || "Falha ao criar reserva");
        return false;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao criar reserva:', error);
      
      setError(errorMessage);
      toast({
        title: "Erro ao criar reserva",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsCreatingReservation(false);
    }
  };

  /**
   * Process PDF and create reservation in one step
   */
  const processAndCreateReservation = async (file: File): Promise<boolean> => {
    const processResult = await processPDF(file);
    
    if (!processResult || !processResult.success) {
      return false;
    }

    // Check if data is valid enough to create reservation
    if (!processResult.validation?.isValid) {
      toast({
        title: "Dados incompletos",
        description: "Os dados extraídos precisam de revisão antes de criar a reserva",
        variant: "destructive",
      });
      return false;
    }

    if (!processResult.propertyFound) {
      toast({
        title: "Propriedade não encontrada",
        description: "Não foi possível identificar a propriedade nos dados extraídos",
        variant: "destructive",
      });
      return false;
    }

    return await createReservation(processResult);
  };

  /**
   * Clear all processing data
   */
  const clearData = () => {
    setProcessingResult(null);
    setError(null);
  };

  return {
    // State
    isProcessing,
    isCreatingReservation,
    processingResult,
    error,
    
    // Actions
    processPDF,
    createReservation,
    processAndCreateReservation,
    clearData,
  };
}