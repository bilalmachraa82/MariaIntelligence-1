import { useState } from "react";
import { 
  uploadAndProcessPDF, 
  createReservationFromExtractedData, 
  processPDFWithMistralOCR,
  processMultiplePDFs,
  processReservationFile 
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
  rawText?: string;
  fromCache?: boolean;
}

// Interface para opções de processamento
interface ProcessingOptions {
  useCache?: boolean;
  skipQualityCheck?: boolean;
}

export function usePdfUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [multipleResults, setMultipleResults] = useState<ProcessingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    useCache: true,
    skipQualityCheck: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Processa um único arquivo PDF ou imagem com o sistema avançado
   * @param file Arquivo (PDF ou imagem) a ser processado
   */
  const handleFileUpload = async (file: File) => {
    if (!file) {
      setError("Nenhum arquivo selecionado");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setExtractedData(null);
      setRawText(null);
      setMultipleResults([]);
      setIsMultiMode(false);
      
      // Disparar evento de progresso inicial
      dispatchProgressEvent(10, 1, file.name);
      
      // Usar o novo sistema avançado de processamento
      try {
        // Configurar opções de processamento
        const options = {
          useCache: processingOptions.useCache,
          skipQualityCheck: processingOptions.skipQualityCheck,
          onProgress: (progress: number) => {
            dispatchProgressEvent(progress, 1, file.name, progress === 100 ? 1 : 0);
          }
        };
        
        // Usar a nova função aprimorada que processa PDFs e imagens
        const result = await processReservationFile(file, options);
        
        // Definir dados extraídos e texto bruto
        setExtractedData(result.extractedData);
        if (result.rawText) {
          setRawText(result.rawText);
        }
        
        // Escolher a mensagem baseada em fonte dos dados (cache ou nova análise)
        if (result.fromCache) {
          toast({
            title: "Arquivo Processado (Cache)",
            description: "Os dados foram recuperados do cache e estão prontos para revisão.",
          });
        } else {
          toast({
            title: "Arquivo Processado com Sucesso",
            description: "Os dados foram extraídos com IA e estão prontos para revisão.",
          });
        }
      } catch (advancedError) {
        console.warn("Falha ao processar com sistema avançado, tentando métodos alternativos:", advancedError);
        
        // Tenta processar com Mistral diretamente como fallback
        try {
          dispatchProgressEvent(30, 1, file.name);
          
          // Método legado para PDFs
          if (file.type.includes('pdf')) {
            const result = await processPDFWithMistralOCR(file);
            setExtractedData(result.extractedData);
          } 
          // Método alternativo como último recurso
          else {
            const result = await uploadAndProcessPDF(file);
            setExtractedData(result.extractedData);
          }
          
          dispatchProgressEvent(100, 1, file.name, 1);
          
          toast({
            title: "Arquivo Processado (Método Alternativo)",
            description: "Os dados foram extraídos usando um método alternativo e estão prontos para revisão.",
          });
        } catch (fallbackError) {
          // Se todos os métodos falharem, relançar o erro original do sistema avançado
          throw advancedError;
        }
      }
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      setError(err instanceof Error ? err.message : "Falha ao processar arquivo");
      
      toast({
        title: "Erro ao Processar Arquivo",
        description: err instanceof Error ? err.message : "Houve um erro ao processar o arquivo.",
        variant: "destructive",
      });
      
      // Disparar evento de falha
      dispatchProgressEvent(100, 1, file.name, 0, 1);
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Função para disparar eventos de progresso do processamento
   */
  const dispatchProgressEvent = (
    percentage: number, 
    total: number, 
    currentFile: string, 
    success: number = 0, 
    failure: number = 0
  ) => {
    const event = new CustomEvent('pdf-processing-progress', {
      detail: {
        processed: success + failure,
        total,
        success,
        failure,
        currentFile,
        percentage
      }
    });
    window.dispatchEvent(event);
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

    // Verificar se todos os arquivos são formatos suportados
    const supportedFiles = files.filter(file => 
      file.type.includes('pdf') || 
      file.type.includes('image/jpeg') || 
      file.type.includes('image/png') || 
      file.type.includes('image/webp')
    );
    
    if (supportedFiles.length < files.length) {
      const unsupportedCount = files.length - supportedFiles.length;
      setError(`${unsupportedCount} arquivo(s) não são formatos suportados. Use PDFs, JPEGs, PNGs ou WEBPs.`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setExtractedData(null);
      setMultipleResults([]);
      setIsMultiMode(true);
      
      // Registrar início do processamento em lote
      dispatchProgressEvent(0, files.length, files[0].name);
      
      // Processar cada arquivo individualmente para maior controle
      const results = [];
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Atualizar progresso
          dispatchProgressEvent(
            Math.round((i / files.length) * 100),
            files.length,
            file.name,
            successCount,
            failureCount
          );
          
          // Usar a função aprimorada com cache e verificação de qualidade
          const result = await processReservationFile(file, {
            useCache: processingOptions.useCache,
            skipQualityCheck: processingOptions.skipQualityCheck
          });
          
          // Adicionar ao array de resultados
          results.push({
            success: true,
            error: false,
            extractedData: result.extractedData,
            rawText: result.rawText,
            fromCache: result.fromCache,
            file: {
              filename: file.name,
              path: URL.createObjectURL(file)
            }
          });
          
          successCount++;
        } catch (err) {
          console.error(`Erro ao processar arquivo ${file.name}:`, err);
          
          // Adicionar resultado com erro
          results.push({
            success: false,
            error: true,
            message: err instanceof Error ? err.message : "Erro desconhecido no processamento",
            file: {
              filename: file.name,
              path: URL.createObjectURL(file)
            }
          });
          
          failureCount++;
        }
      }
      
      // Atualizar progresso final
      dispatchProgressEvent(
        100,
        files.length,
        "Processamento concluído",
        successCount,
        failureCount
      );
      
      setMultipleResults(results);
      
      // Verificar resultados finais
      // Já temos o contador de sucessos e falhas, então não precisamos recalcular
      
      if (failureCount > 0) {
        toast({
          title: "Processamento parcial",
          description: `${successCount} de ${files.length} arquivos foram processados com sucesso.`,
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
