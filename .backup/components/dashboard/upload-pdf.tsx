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

export function UploadPDF() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  // Por padrão, começamos com modo único (false) para simplificar a experiência do usuário
  const [isMultiUploadMode, setIsMultiUploadMode] = useState(false);
  const [isMultiResultsDialogOpen, setIsMultiResultsDialogOpen] = useState(false);
  const [mistralAvailable, setMistralAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const { 
    isUploading, 
    extractedData,
    multipleResults,
    isMultiMode,
    error, 
    handleFileUpload,
    handleMultipleFilesUpload,
    confirmReservation,
    confirmMultipleReservations,
    clearExtractedData
  } = usePdfUpload();

  // Verificar se a chave da API Mistral está configurada
  useEffect(() => {
    async function checkMistralApiKey() {
      try {
        const response = await fetch('/api/check-mistral-key', {
          method: 'GET'
        });
        if (response.ok) {
          const data = await response.json();
          setMistralAvailable(data.available);
          
          if (!data.available) {
            toast({
              title: "API Mistral não configurada",
              description: "O processamento de PDF será limitado. Contate o administrador para configurar a API Mistral.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar chave da API Mistral:", error);
        setMistralAvailable(false);
      }
    }
    
    checkMistralApiKey();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type !== 'application/pdf') {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
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
      handleFileUpload(file);
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
        
        // Verificar se todos os arquivos são PDFs
        const nonPdfFiles = filesArray.filter(file => file.type !== 'application/pdf');
        if (nonPdfFiles.length > 0) {
          toast({
            title: "Formato inválido",
            description: `${nonPdfFiles.length} arquivo(s) não são PDFs válidos.`,
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
        handleMultipleFilesUpload(filesArray);
      } 
      // Modo de upload único
      else {
        const file = e.dataTransfer.files[0];
        
        if (file.type !== 'application/pdf') {
          toast({
            title: "Formato inválido",
            description: "Por favor, selecione apenas arquivos PDF.",
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
        handleFileUpload(file);
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
      
      // Verificar se todos os arquivos são PDFs
      const nonPdfFiles = filesArray.filter(file => file.type !== 'application/pdf');
      if (nonPdfFiles.length > 0) {
        toast({
          title: "Formato inválido",
          description: `${nonPdfFiles.length} arquivo(s) não são PDFs válidos.`,
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
      handleMultipleFilesUpload(filesArray);
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
      <Card className="bg-white shadow">
        <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-lg leading-6 font-medium text-secondary-900">
              Processar {isMultiUploadMode ? "Múltiplas Reservas" : "Nova Reserva"}
            </CardTitle>
            <p className="mt-1 text-sm text-secondary-500">
              Faça upload de {isMultiUploadMode ? "múltiplos PDFs" : "um PDF"} de reservas para processamento automático.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleMultiUploadMode}
            className="shrink-0"
          >
            {isMultiUploadMode ? "Modo Único" : "Modo Múltiplo"}
          </Button>
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
                    accept=".pdf" 
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
                    accept=".pdf" 
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
                ? "Múltiplos PDFs até 10MB cada" 
                : "PDFs até 10MB"}
            </p>
            
            {/* Indicador de carregamento */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-center">
                  <FileText className="animate-pulse h-5 w-5 text-primary-500 mr-2" />
                  <p className="text-sm text-primary-600">
                    {isMultiUploadMode 
                      ? `Processando ${selectedFiles.length} arquivo(s)...` 
                      : "Processando arquivo..."}
                  </p>
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
                  {mistralAvailable !== null && (
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${mistralAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {mistralAvailable ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          API Mistral Ativa
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" />
                          API Mistral Inativa
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
                          O sistema utiliza a API Mistral AI para processar o PDF em duas etapas:
                          1. OCR (Optical Character Recognition) para extrair o texto
                          2. RAG (Retrieval-Augmented Generation) para estruturar os dados
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    O sistema analisará automaticamente o PDF da reserva usando tecnologia Mistral AI para extrair toda a informação relevante.
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
                A tecnologia Mistral AI extraiu e estruturou os seguintes dados da reserva:
              </p>
            </DialogHeader>
            <div className="mt-4">
              <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Propriedade</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData.propertyName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Hóspede</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData.guestName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Check-in</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{formatDate(extractedData.checkInDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Check-out</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{formatDate(extractedData.checkOutDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">N° de Hóspedes</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{extractedData.numGuests}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-500">Valor Total</div>
                    <div className="mt-1 text-sm text-secondary-900 font-medium">{formatCurrency(extractedData.totalAmount)}</div>
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
                A tecnologia Mistral AI processou {multipleResults.length} arquivos PDF e extraiu os seguintes dados:
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
                        {result.extractedData.propertyName}
                      </div>
                      <div className="text-secondary-700">
                        {result.extractedData.guestName}
                      </div>
                      <div className="text-secondary-700">
                        {formatDate(result.extractedData.checkInDate)}
                      </div>
                      <div className="text-secondary-700">
                        {formatDate(result.extractedData.checkOutDate)}
                      </div>
                      <div className="text-secondary-700">
                        {formatCurrency(result.extractedData.totalAmount)}
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
