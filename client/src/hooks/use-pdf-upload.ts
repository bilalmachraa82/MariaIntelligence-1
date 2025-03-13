import { useState } from "react";
import { 
  uploadAndProcessPDF, 
  createReservationFromExtractedData, 
  processPDFWithMistralOCR,
  processMultiplePDFs 
} from "@/lib/ocr";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Interface para resultados do processamento múltiplo
interface ProcessingResult {
  extractedData?: any;
  error?: boolean;
  message?: string;
  file: {
    filename: string;
    path: string;
  };
}

export function usePdfUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [multipleResults, setMultipleResults] = useState<ProcessingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Processa um único arquivo PDF
   * @param file Arquivo PDF a ser processado
   */
  const handleFileUpload = async (file: File) => {
    if (!file) {
      setError("Nenhum arquivo selecionado");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Apenas arquivos PDF são permitidos");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setExtractedData(null);
      setMultipleResults([]);
      setIsMultiMode(false);
      
      // Primeiro tentamos processar com o Mistral diretamente
      try {
        // Usar a função que processa o PDF diretamente com o Mistral AI
        const result = await processPDFWithMistralOCR(file);
        setExtractedData(result.extractedData);
        
        toast({
          title: "PDF Processado com Sucesso (Mistral AI)",
          description: "Os dados foram extraídos com IA e estão prontos para revisão.",
        });
      } catch (mistralError) {
        console.warn("Falha ao processar com Mistral diretamente, tentando via backend:", mistralError);
        
        // Se falhar, caímos de volta para o método tradicional via backend
        const result = await uploadAndProcessPDF(file);
        setExtractedData(result.extractedData);
        
        toast({
          title: "PDF Processado com Sucesso",
          description: "Os dados foram extraídos e estão prontos para revisão.",
        });
      }
    } catch (err) {
      console.error("Erro ao fazer upload do PDF:", err);
      setError(err instanceof Error ? err.message : "Falha ao processar PDF");
      
      toast({
        title: "Erro ao Processar PDF",
        description: err instanceof Error ? err.message : "Houve um erro ao processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Processa múltiplos arquivos PDF ao mesmo tempo
   * @param files Array de arquivos PDF
   */
  const handleMultipleFilesUpload = async (files: File[]) => {
    if (!files || files.length === 0) {
      setError("Nenhum arquivo selecionado");
      return;
    }

    // Verificar se todos os arquivos são PDFs
    const nonPdfFiles = files.filter(file => file.type !== "application/pdf");
    if (nonPdfFiles.length > 0) {
      setError(`${nonPdfFiles.length} arquivo(s) não são PDFs válidos`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setExtractedData(null);
      setMultipleResults([]);
      setIsMultiMode(true);
      
      // Processar múltiplos PDFs com o Mistral
      const results = await processMultiplePDFs(files);
      setMultipleResults(results);
      
      // Verificar se houve algum erro
      const successCount = results.filter(r => !r.error).length;
      const errorCount = results.length - successCount;
      
      if (errorCount > 0) {
        toast({
          title: "Processamento parcial",
          description: `${successCount} de ${files.length} PDFs foram processados com sucesso.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Processamento Concluído",
          description: `Todos os ${files.length} arquivos foram processados com sucesso.`,
        });
      }
    } catch (err) {
      console.error("Erro ao processar múltiplos PDFs:", err);
      setError(err instanceof Error ? err.message : "Falha ao processar PDFs");
      
      toast({
        title: "Erro no Processamento",
        description: err instanceof Error ? err.message : "Houve um erro ao processar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Confirma uma única reserva
   */
  const confirmReservation = async () => {
    if (!extractedData) {
      setError("Não há dados disponíveis para confirmação");
      return null;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      const result = await createReservationFromExtractedData(extractedData);
      
      toast({
        title: "Reserva Criada com Sucesso",
        description: `A reserva para ${extractedData.propertyName} foi confirmada.`,
      });
      
      // Reset the extracted data
      setExtractedData(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
      return result;
    } catch (err) {
      console.error("Error creating reservation:", err);
      setError(err instanceof Error ? err.message : "Failed to create reservation");
      
      toast({
        title: "Erro ao Criar Reserva",
        description: err instanceof Error ? err.message : "Houve um erro ao criar a reserva.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Confirma múltiplas reservas
   */
  const confirmMultipleReservations = async () => {
    if (!multipleResults || multipleResults.length === 0) {
      setError("Não há dados disponíveis para confirmação");
      return null;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Filtrar apenas resultados válidos
      const validResults = multipleResults.filter(result => !result.error && result.extractedData);
      
      if (validResults.length === 0) {
        toast({
          title: "Sem Dados Válidos",
          description: "Não há reservas válidas para criar.",
          variant: "destructive",
        });
        return null;
      }
      
      // Criar cada reserva individualmente
      const results = [];
      for (const result of validResults) {
        try {
          const createdReservation = await createReservationFromExtractedData(result.extractedData);
          results.push({
            success: true,
            data: createdReservation,
            filename: result.file.filename
          });
        } catch (err) {
          results.push({
            success: false,
            error: err instanceof Error ? err.message : "Erro desconhecido",
            filename: result.file.filename
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      toast({
        title: "Processamento Concluído",
        description: `${successCount} de ${validResults.length} reservas foram criadas com sucesso.`,
        variant: successCount === validResults.length ? "default" : "destructive",
      });
      
      // Limpar dados
      setMultipleResults([]);
      setIsMultiMode(false);
      
      // Invalidar consultas relevantes
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
      return results;
    } catch (err) {
      console.error("Erro ao criar múltiplas reservas:", err);
      setError(err instanceof Error ? err.message : "Falha ao criar reservas");
      
      toast({
        title: "Erro no Processamento",
        description: err instanceof Error ? err.message : "Houve um erro ao criar as reservas.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const clearData = () => {
    setExtractedData(null);
    setMultipleResults([]);
    setIsMultiMode(false);
    setError(null);
  };

  return {
    isUploading,
    extractedData,
    multipleResults,
    error,
    isMultiMode,
    handleFileUpload,
    handleMultipleFilesUpload,
    confirmReservation,
    confirmMultipleReservations,
    clearExtractedData: clearData,
  };
}
