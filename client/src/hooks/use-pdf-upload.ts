import { useState } from "react";
import { uploadAndProcessPDF, createReservationFromExtractedData, processPDFWithMistralOCR } from "@/lib/ocr";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function usePdfUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const confirmReservation = async () => {
    if (!extractedData) {
      setError("No data available to confirm");
      return;
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

  return {
    isUploading,
    extractedData,
    error,
    handleFileUpload,
    confirmReservation,
    clearExtractedData: () => setExtractedData(null),
  };
}
