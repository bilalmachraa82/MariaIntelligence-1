import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import { usePdfUpload } from "@/hooks/use-pdf-upload";
import { 
  CloudUpload, 
  FileText, 
  AlertCircle, 
  Info,
  BrainCircuit,
  CheckCircle2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { MissingDataForm } from "@/components/ocr/MissingDataForm";

export function UploadPDF() {
  // Estados para arquivos selecionados
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Estados para diálogos e modais
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [isMultiResultsDialogOpen, setIsMultiResultsDialogOpen] = useState(false);
  
  // Estados de modo e visualização
  // Sempre usar modo múltiplo por padrão e sem opção de alterar
  const [isMultiUploadMode, setIsMultiUploadMode] = useState(true);
  const [showRawText, setShowRawText] = useState(false);
  
  // Estado de disponibilidade da API Gemini
  const [geminiAvailable, setGeminiAvailable] = useState<boolean | null>(null);
  
  // Estado para feedback visual do processamento
  const [processingProgress, setProcessingProgress] = useState<{
    processed: number;
    total: number;
    success: number;
    failure: number;
    currentFile: string;
    percentage: number;
    fromCache?: boolean;
  } | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const { 
    isUploading, 
    extractedData,
    multipleResults,
    isMultiMode,
    error, 
    rawText,
    missingFields,
    showMissingDataForm,
    handleFileUpload,
    handleMultipleFilesUpload,
    confirmReservation,
    confirmMultipleReservations,
    clearExtractedData,
    handleMissingDataComplete,
    closeMissingDataForm
  } = usePdfUpload();

  // Verificar se a chave da API Gemini está configurada
  useEffect(() => {
    async function checkGeminiApiKey() {
      try {
        const response = await fetch('/api/check-ai-services', {
          method: 'GET'
        });
        if (response.ok) {
          const data = await response.json();
          setGeminiAvailable(data.anyServiceAvailable);
          
          if (!data.anyServiceAvailable) {
            toast({
              title: "Serviços de IA não configurados",
              description: "O processamento de PDF será limitado ao OCR básico. Contate o administrador para configurar os serviços de IA (Mistral ou OpenRouter).",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar serviços de IA disponíveis:", error);
        setGeminiAvailable(false);
      }
    }
    
    checkGeminiApiKey();
  }, [toast]);
  
  // Ouvir eventos de progresso do processamento
  useEffect(() => {
    const progressHandler = (event: CustomEvent) => {
      setProcessingProgress(event.detail);
    };
    
    window.addEventListener('pdf-processing-progress', progressHandler as EventListener);
    
    return () => {
      window.removeEventListener('pdf-processing-progress', progressHandler as EventListener);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione apenas arquivos PDF ou imagens (JPG, PNG, WebP).",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      handleFileUpload(file, { useCache: false, skipQualityCheck: false });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Modo de upload múltiplo
      if (isMultiUploadMode) {
        const filesArray = Array.from(e.dataTransfer.files);
        
        // Verificar se todos os arquivos são PDFs ou imagens
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const invalidFiles = filesArray.filter(file => !allowedTypes.includes(file.type));
        if (invalidFiles.length > 0) {
          toast({
            title: "Formato inválido",
            description: `${invalidFiles.length} arquivo(s) não são PDFs ou imagens válidas (JPG, PNG, WebP).`,
            variant: "destructive",
          });
          return;
        }
        
        // Verificar tamanho dos arquivos
        const largeFiles = filesArray.filter(file => file.size > 10 * 1024 * 1024);
        if (largeFiles.length > 0) {
          toast({
            title: "Arquivos muito grandes",
            description: `${largeFiles.length} arquivo(s) excedem o limite de 10MB.`,
            variant: "destructive",
          });
          return;
        }
        
        setSelectedFiles(filesArray);
        handleMultipleFilesUpload(filesArray, { 
          useCache: false, 
          skipQualityCheck: false 
        });
      } 
      // Modo de upload único
      else {
        const file = e.dataTransfer.files[0];
        
        // Verificar se o arquivo é PDF ou imagem
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Formato inválido",
            description: "Por favor, selecione arquivos PDF, JPG, PNG ou WebP.",
            variant: "destructive",
          });
          return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
          toast({
            title: "Arquivo muito grande",
            description: "O tamanho máximo permitido é 10MB.",
            variant: "destructive",
          });
          return;
        }
        
        setSelectedFile(file);
        handleFileUpload(file, { useCache: false, skipQualityCheck: false });
      }
    }
  };

  const handleConfirmReservation = async () => {
    const result = await confirmReservation();
    if (result) {
      setIsValidationDialogOpen(false);
      setSelectedFile(null);
      clearExtractedData();
    }
  };

  // Efeito para abrir o diálogo de validação quando um único arquivo é processado
  useEffect(() => {
    if (extractedData && !isValidationDialogOpen && !isMultiUploadMode) {
      setIsValidationDialogOpen(true);
    }
  }, [extractedData, isValidationDialogOpen, isMultiUploadMode]);
  
  // Efeito para abrir o diálogo de resultados múltiplos quando vários arquivos são processados
  useEffect(() => {
    if (multipleResults && multipleResults.length > 0 && !isMultiResultsDialogOpen && isMultiUploadMode) {
      setIsMultiResultsDialogOpen(true);
    }
  }, [multipleResults, isMultiResultsDialogOpen, isMultiUploadMode]);

  // Função que lida com seleção de múltiplos arquivos
  const handleMultipleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      
      // Verificar se todos os arquivos são PDFs ou imagens
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      const invalidFiles = filesArray.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        toast({
          title: "Formato inválido",
          description: `${invalidFiles.length} arquivo(s) não são do formato válido (PDF, JPG, PNG, WebP).`,
          variant: "destructive",
        });
        return;
      }
      
      // Verificar tamanho dos arquivos
      const largeFiles = filesArray.filter(file => file.size > 10 * 1024 * 1024);
      if (largeFiles.length > 0) {
        toast({
          title: "Arquivos muito grandes",
          description: `${largeFiles.length} arquivo(s) excedem o limite de 10MB.`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFiles(filesArray);
      handleMultipleFilesUpload(filesArray, { 
        useCache: false, 
        skipQualityCheck: false 
      });
    }
  };

  // Função para alternar entre o modo de upload único e múltiplo
  const toggleMultiUploadMode = () => {
    setIsMultiUploadMode(!isMultiUploadMode);
    clearExtractedData();
    setSelectedFile(null);
    setSelectedFiles([]);
  };

  return (
    <>
      {/* Formulário para solicitar dados ausentes quando necessário */}
      <MissingDataForm
        open={showMissingDataForm}
        onClose={closeMissingDataForm}
        extractedData={extractedData}
        missing={missingFields}
        onSubmit={handleMissingDataComplete}
        isLoading={isUploading}
      />
      
      <Card className="bg-white shadow">
        <CardHeader className="px-4 py-5 sm:px-6">
          <div>
            <CardTitle className="text-lg leading-6 font-medium text-secondary-900">
              Processamento Inteligente de Documentos
            </CardTitle>
            <p className="mt-1 text-sm text-secondary-500">
              Faça upload de arquivos PDF de reservas para processamento automático com IA.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:px-6 space-y-6">
          <div 
            className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUploading) {
                const inputId = isMultiUploadMode ? 'multi-file-upload' : 'file-upload';
                document.getElementById(inputId)?.click();
              }
            }}
          >
            <CloudUpload className="mx-auto h-12 w-12 text-secondary-400" />
            <div className="mt-4 flex text-sm text-secondary-600 justify-center">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                <span>
                  {isMultiUploadMode 
                    ? "Faça upload de múltiplos arquivos" 
                    : "Faça upload de um arquivo"}
                </span>
                
                {/* Input para upload único */}
                {!isMultiUploadMode && (
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept=".pdf,.jpg,.jpeg,.png,.webp" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                )}
                
                {/* Input para upload múltiplo */}
                {isMultiUploadMode && (
                  <input 
                    id="multi-file-upload" 
                    name="multi-file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept=".pdf,.jpg,.jpeg,.png,.webp" 
                    multiple
                    onChange={handleMultipleFileSelect}
                    disabled={isUploading}
                  />
                )}
              </label>
              <p className="pl-1">ou arraste e solte</p>
            </div>
            <p className="text-xs text-secondary-500 mt-2">
              {isMultiUploadMode 
                ? "Múltiplos PDFs ou imagens (JPG, PNG, WebP) até 10MB cada" 
                : "PDFs ou imagens (JPG, PNG, WebP) até 10MB"}
            </p>
            
            {/* Indicador de carregamento */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center">
                    <FileText className="animate-pulse h-5 w-5 text-primary-500 mr-2" />
                    <p className="text-sm text-primary-600">
                      {isMultiUploadMode 
                        ? `Processando ${selectedFiles.length} arquivo(s)...` 
                        : "Processando arquivo..."}
                    </p>
                  </div>
                  
                  {/* Indicador de progresso para múltiplos arquivos */}
                  {isMultiUploadMode && processingProgress && (
                    <div className="w-full max-w-md space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                          style={{ width: `${(processingProgress.processed / processingProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-secondary-600">
                        <span>
                          Processado: {processingProgress.processed}/{processingProgress.total}
                        </span>
                        <span className="flex space-x-2">
                          <span className="text-green-600">{processingProgress.success} sucesso</span>
                          {processingProgress.failure > 0 && (
                            <span className="text-red-600">{processingProgress.failure} falha(s)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <p className="text-secondary-500">
                          Arquivo atual: {processingProgress.currentFile}
                        </p>
                        {processingProgress.fromCache && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Info className="h-3 w-3 mr-1" />
                            Usando cache
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Mensagem de erro */}
            {error && (
              <div className="mt-4 text-sm text-red-600">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {error}
              </div>
            )}
            
            {/* Exibição do arquivo único selecionado */}
            {!isMultiUploadMode && selectedFile && !isUploading && !error && !extractedData && (
              <div className="mt-4">
                <div className="flex items-center justify-center">
                  <FileText className="h-5 w-5 text-secondary-500 mr-2" />
                  <p className="text-sm text-secondary-600">
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => setIsFilePreviewOpen(true)}
                >
                  Visualizar arquivo
                </Button>
              </div>
            )}
            
            {/* Exibição de múltiplos arquivos selecionados */}
            {isMultiUploadMode && selectedFiles.length > 0 && !isUploading && !error && (
              <div className="mt-4">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-secondary-500 mr-2" />
                  <p className="text-sm text-secondary-600">
                    {selectedFiles.length} arquivo(s) selecionado(s)
                  </p>
                </div>
                <div className="max-h-32 overflow-y-auto border border-secondary-200 rounded-md p-2 text-left">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="text-sm text-secondary-600 py-1 border-b border-secondary-100 last:border-b-0">
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <BrainCircuit className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-blue-800">
                    Processamento com Inteligência Artificial
                  </h3>
                  {geminiAvailable !== null && (
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${geminiAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {geminiAvailable ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          API Gemini Ativa
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" />
                          API Gemini Inativa
                        </>
                      )}
                    </Badge>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                          <Info className="h-4 w-4 text-blue-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          O sistema utiliza a API Gemini AI para processar o PDF em duas etapas:
                          1. OCR (Optical Character Recognition) para extrair o texto
                          2. RAG (Retrieval-Augmented Generation) para estruturar os dados
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    O sistema analisará automaticamente o PDF da reserva usando tecnologia Gemini AI para extrair toda a informação relevante.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Extração OCR
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Análise Estruturada
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Processamento Rápido
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>



          <div>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setLocation("/reservations/new")}
            >
              Continuar Manualmente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      {isFilePreviewOpen && (
        <Dialog open={isFilePreviewOpen} onOpenChange={setIsFilePreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Visualizar PDF</DialogTitle>
            </DialogHeader>
            <PDFViewer 
              file={selectedFile} 
              onClose={() => setIsFilePreviewOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de validação para uma única reserva */}
      {isValidationDialogOpen && extractedData && !isMultiUploadMode && (
        <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BrainCircuit className="h-5 w-5 text-primary-500 mr-2" />
                Dados Extraídos com IA
              </DialogTitle>
              <p className="text-sm text-secondary-500 mt-1">
                A tecnologia Gemini AI extraiu e estruturou os seguintes dados da reserva:
              </p>
            </DialogHeader>
            <div className="mt-4">
              <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Propriedade</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData?.propertyName || "Não definida"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Hóspede</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData?.guestName || "Não definido"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Check-in</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData?.checkInDate ? formatDate(extractedData.checkInDate) : "Não definido"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Check-out</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData?.checkOutDate ? formatDate(extractedData.checkOutDate) : "Não definido"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">N° de Hóspedes</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData?.numGuests || "Não definido"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Valor Total</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData?.totalAmount ? formatCurrency(extractedData.totalAmount) : "Não definido"}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3 text-sm text-secondary-600">
                    <span className="font-medium">Plataforma:</span> {extractedData.platform || 'Booking.com'}
                  </div>
                </div>
                {extractedData.guestEmail && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3 text-sm text-secondary-600">
                      <span className="font-medium">Email:</span> {extractedData.guestEmail}
                    </div>
                  </div>
                )}
                {extractedData.guestPhone && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3 text-sm text-secondary-600">
                      <span className="font-medium">Telefone:</span> {extractedData.guestPhone}
                    </div>
                  </div>
                )}
              </div>
              
              {extractedData?.validationStatus && (
                <div className={`rounded-md p-4 mt-4 border ${
                  extractedData.validationStatus === 'valid' 
                    ? 'bg-green-50 border-green-200' 
                    : extractedData.validationStatus === 'needs_review'
                      ? 'bg-yellow-50 border-yellow-200'
                      : extractedData.validationStatus === 'incomplete'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {extractedData.validationStatus === 'valid' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : extractedData.validationStatus === 'needs_review' ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : extractedData.validationStatus === 'incomplete' ? (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${
                        extractedData.validationStatus === 'valid' 
                          ? 'text-green-800' 
                          : extractedData.validationStatus === 'needs_review'
                            ? 'text-yellow-800'
                            : extractedData.validationStatus === 'incomplete'
                              ? 'text-orange-800'
                              : 'text-red-800'
                      }`}>
                        {extractedData.validationStatus === 'valid' 
                          ? 'Dados Completos' 
                          : extractedData.validationStatus === 'needs_review'
                            ? 'Revisão Recomendada'
                            : extractedData.validationStatus === 'incomplete'
                              ? 'Dados Incompletos'
                              : 'Validação Falhou'}
                      </h3>
                      <div className={`mt-2 text-sm ${
                        extractedData.validationStatus === 'valid' 
                          ? 'text-green-700' 
                          : extractedData.validationStatus === 'needs_review'
                            ? 'text-yellow-700'
                            : extractedData.validationStatus === 'incomplete'
                              ? 'text-orange-700'
                              : 'text-red-700'
                      }`}>
                        <p>
                          {extractedData.validationStatus === 'valid' 
                            ? 'Todos os dados foram extraídos com sucesso. Verifique antes de confirmar.' 
                            : extractedData.validationStatus === 'needs_review'
                              ? 'Os dados foram extraídos, mas é recomendável revisar antes de confirmar.'
                              : extractedData.validationStatus === 'incomplete'
                                ? 'Alguns dados importantes não puderam ser extraídos. Por favor, edite manualmente.'
                                : 'Não foi possível validar os dados extraídos. Edite manualmente.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Se houver campos ausentes, listá-los */}
              {extractedData?.validation?.missingFields && extractedData.validation.missingFields.length > 0 && (
                <div className="rounded-md bg-yellow-50 p-4 mt-4 border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Campos Ausentes
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Os seguintes campos não puderam ser extraídos:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {extractedData.validation.missingFields.map((field: string, index: number) => (
                            <li key={index}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Se não houver status de validação, mostrar mensagem padrão */}
              {!extractedData?.validationStatus && (
                <div className="rounded-md bg-yellow-50 p-4 mt-4 border border-yellow-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Confirmação Necessária
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Verifique os dados extraídos pela IA antes de confirmar a reserva. 
                          Você pode editar quaisquer informações que precisem de correção.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button 
                variant="outline"
                onClick={() => setLocation("/reservations/new")}
              >
                Editar Dados
              </Button>
              <Button 
                onClick={handleConfirmReservation} 
                disabled={isUploading}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Diálogo de resultados múltiplos */}
      {isMultiResultsDialogOpen && multipleResults && multipleResults.length > 0 && (
        <Dialog open={isMultiResultsDialogOpen} onOpenChange={setIsMultiResultsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BrainCircuit className="h-5 w-5 text-primary-500 mr-2" />
                Processamento Múltiplo Concluído
              </DialogTitle>
              <p className="text-sm text-secondary-500 mt-1">
                A tecnologia Gemini AI processou {multipleResults.length} arquivos PDF e extraiu os seguintes dados:
              </p>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Processamento Concluído
                    </h3>
                    <div className="mt-1 text-sm text-green-700">
                      <p>
                        {multipleResults.length} reservas foram processadas com sucesso.
                        Revise os dados antes de confirmar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md">
                <div className="grid grid-cols-5 gap-2 bg-secondary-100 p-3 font-medium text-sm text-secondary-700 border-b">
                  <div>Propriedade</div>
                  <div>Hóspede</div>
                  <div>Check-in</div>
                  <div>Check-out</div>
                  <div>Valor</div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {multipleResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`grid grid-cols-5 gap-2 p-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-secondary-50'} border-b last:border-b-0`}
                    >
                      <div className="font-medium text-secondary-900">
                        {result.extractedData?.propertyName || "Não definida"}
                      </div>
                      <div className="text-secondary-700">
                        {result.extractedData?.guestName || "Não definido"}
                      </div>
                      <div className="text-secondary-700">
                        {result.extractedData?.checkInDate ? formatDate(result.extractedData.checkInDate) : "Não definido"}
                      </div>
                      <div className="text-secondary-700">
                        {result.extractedData?.checkOutDate ? formatDate(result.extractedData.checkOutDate) : "Não definido"}
                      </div>
                      <div className="text-secondary-700">
                        {result.extractedData?.totalAmount ? formatCurrency(result.extractedData.totalAmount) : "Não definido"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="rounded-md bg-blue-50 p-4 mt-4 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Resumo do Processamento
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    <div>
                      <span className="font-medium">Total de Arquivos:</span> {multipleResults.length}
                    </div>
                    <div>
                      <span className="font-medium">Sucesso:</span> {multipleResults.filter(r => !r.error).length}
                    </div>
                    <div>
                      <span className="font-medium">Falhas:</span> {multipleResults.filter(r => r.error).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsMultiResultsDialogOpen(false);
                  clearExtractedData();
                  setSelectedFiles([]);
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="gap-2"
                onClick={() => {
                  confirmMultipleReservations();
                  setIsMultiResultsDialogOpen(false);
                  clearExtractedData();
                  setSelectedFiles([]);
                  toast({
                    title: "Reservas Criadas",
                    description: `${multipleResults.filter(r => !r.error).length} reservas foram criadas com sucesso.`,
                    variant: "default",
                  });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Todas as Reservas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
