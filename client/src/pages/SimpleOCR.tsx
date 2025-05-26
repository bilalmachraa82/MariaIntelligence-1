import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Users, Calendar, Euro, CheckCircle, AlertCircle } from 'lucide-react';

interface ExtractedReservation {
  guestName: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  guestCount: number;
  email?: string;
  phone?: string;
  notes?: string;
}

interface OCRResult {
  success: boolean;
  type: 'check-in' | 'check-out' | 'control-file' | 'unknown';
  reservations: ExtractedReservation[];
  extractedText?: string;
  error?: string;
}

export default function SimpleOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/simple-ocr/process', {
        method: 'POST',
        body: formData,
      });

      const data: OCRResult = await response.json();
      setResult(data);

    } catch (error) {
      setResult({
        success: false,
        type: 'unknown',
        reservations: [],
        error: 'Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'check-in': return 'bg-green-100 text-green-800';
      case 'check-out': return 'bg-blue-100 text-blue-800';
      case 'control-file': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'check-in': return 'Check-in';
      case 'check-out': return 'Check-out';
      case 'control-file': return 'Arquivo de Controle';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-PT');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">OCR Inteligente</h1>
        <p className="text-gray-600 mt-2">
          Processe PDFs de reservas e extraia dados automaticamente usando IA
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de PDF
          </CardTitle>
          <CardDescription>
            Suporte para PDFs de check-in, check-out e arquivos de controle com múltiplas reservas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Arquivo selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando PDF...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Processar PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado do Processamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <>
                <div className="flex items-center gap-4">
                  <Badge className={getTypeColor(result.type)}>
                    {getTypeLabel(result.type)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {result.reservations.length} reserva(s) encontrada(s)
                  </span>
                </div>

                {result.reservations.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma reserva foi encontrada no documento processado.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {result.reservations.map((reservation, index) => (
                      <Card key={index} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="font-semibold">{reservation.guestName}</span>
                              </div>
                              {reservation.propertyName && (
                                <p className="text-sm text-gray-600">
                                  Propriedade: {reservation.propertyName}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">
                                  {formatDate(reservation.checkInDate)} → {formatDate(reservation.checkOutDate)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {reservation.guestCount} hóspede(s)
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Euro className="h-4 w-4 text-gray-500" />
                                <span className="font-semibold text-green-600">
                                  €{reservation.totalAmount.toFixed(2)}
                                </span>
                              </div>
                              {reservation.email && (
                                <p className="text-sm text-gray-600">
                                  📧 {reservation.email}
                                </p>
                              )}
                              {reservation.phone && (
                                <p className="text-sm text-gray-600">
                                  📱 {reservation.phone}
                                </p>
                              )}
                            </div>
                          </div>

                          {reservation.notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded">
                              <p className="text-sm text-gray-700">
                                <strong>Notas:</strong> {reservation.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.error || 'Erro ao processar o documento'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">1. Upload</h3>
              <p className="text-sm text-gray-600">Selecione um arquivo PDF com dados de reservas</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">2. Processamento</h3>
              <p className="text-sm text-gray-600">A IA extrai automaticamente os dados das reservas</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">3. Resultado</h3>
              <p className="text-sm text-gray-600">Visualize e confirme os dados extraídos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}