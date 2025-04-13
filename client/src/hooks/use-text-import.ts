import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface TextImportResult {
  success: boolean;
  needsClarification?: boolean;
  reservationData?: any;
  clarificationQuestions?: string[];
  reservation?: any;
  message?: string;
  error?: string;
}

export function useTextImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<TextImportResult | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const importFromText = async (text: string, propertyId?: number) => {
    if (!text.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, forneça um texto para análise.",
        variant: "destructive",
      });
      return null;
    }

    setIsImporting(true);

    try {
      const data = {
        text,
        propertyId,
        userAnswers: Object.keys(clarificationAnswers).length > 0 ? clarificationAnswers : undefined
      };

      const result = await apiRequest<TextImportResult>('/api/reservations/import-text', {
        method: 'POST',
        data
      });

      setImportData(result);

      // Se precisamos de esclarecimentos, não mostrar toast ainda
      if (result.needsClarification) {
        toast({
          title: "Precisamos de algumas informações",
          description: "Por favor, responda às perguntas para completar a importação.",
        });
      } else if (result.success) {
        toast({
          title: "Importação bem-sucedida",
          description: "Os dados da reserva foram extraídos com sucesso.",
        });
      } else {
        toast({
          title: "Erro na importação",
          description: result.message || "Não foi possível extrair os dados da reserva.",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Erro ao importar texto:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Falha na importação",
        description: `Ocorreu um erro ao analisar o texto: ${errorMessage}`,
        variant: "destructive",
      });
      
      setImportData({
        success: false,
        error: errorMessage
      });
      
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const updateClarificationAnswer = (question: string, answer: string) => {
    setClarificationAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };

  const resetImport = () => {
    setImportData(null);
    setClarificationAnswers({});
  };

  return {
    isImporting,
    importData,
    clarificationAnswers,
    importFromText,
    updateClarificationAnswer,
    resetImport
  };
}