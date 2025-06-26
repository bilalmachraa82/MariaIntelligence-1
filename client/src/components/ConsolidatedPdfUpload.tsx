import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Calendar,
  User,
  Home,
  Euro,
  Users
} from "lucide-react";
import { useConsolidatedPdf } from "@/hooks/use-consolidated-pdf";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ConsolidatedPdfUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isProcessing,
    isCreatingReservation,
    processingResult,
    error,
    processPDF,
    createReservation,
    processAndCreateReservation,
    clearData
  } = useConsolidatedPdf();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearData();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleProcessOnly = async () => {
    if (!selectedFile) return;
    await processPDF(selectedFile);
  };

  const handleProcessAndCreate = async () => {
    if (!selectedFile) return;
    const success = await processAndCreateReservation(selectedFile);
    if (success) {
      setSelectedFile(null);
      clearData();
    }
  };

  const handleCreateReservation = async () => {
    if (!processingResult) return;
    const success = await createReservation(processingResult);
    if (success) {
      setSelectedFile(null);
      clearData();
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    clearData();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'VALID': return 'bg-green-100 text-green-800';
      case 'INCOMPLETE': return 'bg-yellow-100 text-yellow-800';
      case 'NEEDS_REVIEW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Sistema Consolidado de PDF
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema melhorado com Gemini 2.5 Flash - processamento mais rápido e preciso
          </p>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {selectedFile ? selectedFile.name : 'Clique ou arraste um PDF aqui'}
              </p>
              <p className="text-sm text-gray-500">
                Apenas arquivos PDF (máximo 10MB)
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFile && (
            <div className="mt-4 flex gap-2 justify-center">
              <Button
                onClick={handleProcessOnly}
                disabled={isProcessing}
                variant="outline"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Processar PDF
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleProcessAndCreate}
                disabled={isProcessing || isCreatingReservation}
              >
                {isProcessing || isCreatingReservation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isProcessing ? 'Processando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Processar e Criar Reserva
                  </>
                )}
              </Button>
              
              <Button onClick={handleClear} variant="outline">
                Limpar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Erro no Processamento</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado do Processamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Overview */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={processingResult.success ? "default" : "destructive"}>
                {processingResult.success ? 'Sucesso' : 'Falha'}
              </Badge>
              
              {processingResult.validation && (
                <Badge className={getValidationStatusColor(processingResult.validation.status)}>
                  {processingResult.validation.status}
                </Badge>
              )}
              
              <Badge variant={processingResult.propertyFound ? "default" : "secondary"}>
                {processingResult.propertyFound ? 'Propriedade Encontrada' : 'Propriedade Não Identificada'}
              </Badge>
            </div>

            <p className="text-sm text-gray-600">{processingResult.message}</p>

            {/* Extracted Data */}
            {processingResult.extractedData && (
              <div className="space-y-4">
                <Separator />
                <h4 className="font-medium">Dados Extraídos</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Propriedade</p>
                      <p className="font-medium">{processingResult.extractedData.propertyName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Hóspede</p>
                      <p className="font-medium">{processingResult.extractedData.guestName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Check-in</p>
                      <p className="font-medium">{formatDate(processingResult.extractedData.checkInDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Check-out</p>
                      <p className="font-medium">{formatDate(processingResult.extractedData.checkOutDate)}</p>
                    </div>
                  </div>
                  
                  {processingResult.extractedData.totalAmount && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Valor Total</p>
                        <p className="font-medium">{formatCurrency(processingResult.extractedData.totalAmount)}</p>
                      </div>
                    </div>
                  )}
                  
                  {processingResult.extractedData.numGuests && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Hóspedes</p>
                        <p className="font-medium">{processingResult.extractedData.numGuests}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation Issues */}
                {processingResult.validation && (
                  <div className="space-y-2">
                    {processingResult.validation.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700">Erros de Validação:</p>
                        <ul className="text-xs text-red-600 ml-4 list-disc">
                          {processingResult.validation.errors.map((error, index) => (
                            <li key={index}>{error.field}: {error.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {processingResult.validation.missingFields.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-yellow-700">Campos em Falta:</p>
                        <p className="text-xs text-yellow-600">{processingResult.validation.missingFields.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {processingResult.success && processingResult.validation?.isValid && processingResult.propertyFound && (
                  <div className="pt-4">
                    <Button
                      onClick={handleCreateReservation}
                      disabled={isCreatingReservation}
                      className="w-full"
                    >
                      {isCreatingReservation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando Reserva...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Criar Reserva
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}