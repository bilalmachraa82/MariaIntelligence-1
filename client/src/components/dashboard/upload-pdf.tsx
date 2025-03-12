import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PDFViewer } from "@/components/ui/pdf-viewer";
import { usePdfUpload } from "@/hooks/use-pdf-upload";
import { 
  CloudUpload, 
  FileText, 
  AlertCircle, 
  Info 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export function UploadPDF() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { 
    isUploading, 
    extractedData, 
    error, 
    handleFileUpload, 
    confirmReservation,
    clearExtractedData
  } = usePdfUpload();

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
  };

  const handleConfirmReservation = async () => {
    const result = await confirmReservation();
    if (result) {
      setIsValidationDialogOpen(false);
      setSelectedFile(null);
      clearExtractedData();
    }
  };

  // When extraction is successful, open validation dialog
  if (extractedData && !isValidationDialogOpen) {
    setIsValidationDialogOpen(true);
  }

  return (
    <>
      <Card className="bg-white shadow">
        <CardHeader className="px-4 py-5 sm:px-6">
          <CardTitle className="text-lg leading-6 font-medium text-secondary-900">
            Processar Nova Reserva
          </CardTitle>
          <p className="mt-1 text-sm text-secondary-500">
            Faça upload de PDFs de reservas para processamento automático.
          </p>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:px-6 space-y-6">
          <div 
            className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <CloudUpload className="mx-auto h-12 w-12 text-secondary-400" />
            <div className="mt-4 flex text-sm text-secondary-600 justify-center">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                <span>Faça upload de um arquivo</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              <p className="pl-1">ou arraste e solte</p>
            </div>
            <p className="text-xs text-secondary-500 mt-2">PDFs até 10MB</p>
            
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-center">
                  <FileText className="animate-pulse h-5 w-5 text-primary-500 mr-2" />
                  <p className="text-sm text-primary-600">Processando arquivo...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 text-sm text-red-600">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {error}
              </div>
            )}
            
            {selectedFile && !isUploading && !error && !extractedData && (
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
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  O sistema usará OCR e RAG para extrair e validar os dados automaticamente.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Link href="/reservations/new">
              <Button className="w-full" variant="outline">
                Continuar Manualmente
              </Button>
            </Link>
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

      {/* Validation Dialog */}
      {isValidationDialogOpen && extractedData && (
        <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dados Extraídos com Sucesso</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-secondary-500 mb-4">
                O sistema extraiu e validou os seguintes dados da reserva:
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-secondary-500">Propriedade</div>
                  <div className="mt-1 text-sm text-secondary-900">{extractedData.propertyName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-500">Hóspede</div>
                  <div className="mt-1 text-sm text-secondary-900">{extractedData.guestName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-500">Check-in</div>
                  <div className="mt-1 text-sm text-secondary-900">{formatDate(extractedData.checkInDate)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-500">Check-out</div>
                  <div className="mt-1 text-sm text-secondary-900">{formatDate(extractedData.checkOutDate)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-500">N° de Hóspedes</div>
                  <div className="mt-1 text-sm text-secondary-900">{extractedData.numGuests}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-secondary-500">Valor Total</div>
                  <div className="mt-1 text-sm text-secondary-900">{formatCurrency(extractedData.totalAmount)}</div>
                </div>
              </div>
              
              <div className="rounded-md bg-yellow-50 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Atenção
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Verifique os dados extraídos antes de confirmar a reserva.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Link href="/reservations/new">
                <Button variant="outline">Editar Dados</Button>
              </Link>
              <Button onClick={handleConfirmReservation} disabled={isUploading}>
                Confirmar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
