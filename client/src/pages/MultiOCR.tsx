import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';

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
  fileName?: string;
}

export default function MultiOCR() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OCRResult[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    setFiles(pdfFiles);
    setResults([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    try {
      const allResults: OCRResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 Processando arquivo ${i + 1}/${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append('pdf', file);

        try {
          const response = await fetch('/api/simple-ocr/process', {
            method: 'POST',
            body: formData,
          });

          const data: OCRResult = await response.json();
          allResults.push({
            ...data,
            fileName: file.name
          });

        } catch (error) {
          allResults.push({
            success: false,
            type: 'unknown',
            reservations: [],
            error: `Erro ao processar ${file.name}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'),
            fileName: file.name
          });
        }
      }

      setResults(allResults);

    } catch (error) {
      setResults([{
        success: false,
        type: 'unknown',
        reservations: [],
        error: 'Erro geral no processamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
      }]);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📄 Upload Múltiplo de PDFs
        </h1>
        <p className="text-gray-600">
          Faça upload de vários PDFs ao mesmo tempo (check-in + check-out, arquivos de controle, etc.)
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Múltiplos Arquivos PDF</CardTitle>
          <CardDescription>
            Suporte para PDFs de check-in, check-out e arquivos de controle com múltiplas reservas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {files.length > 0 && (
              <div className="text-sm text-gray-600 mt-2">
                <p className="font-medium">{files.length} arquivo(s) selecionado(s):</p>
                {files.map((file, index) => (
                  <p key={index} className="ml-2">
                    • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando {files.length} PDF(s)...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Processar {files.length} PDF(s)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">📊 Resultados do Processamento</h2>
          
          {results.map((result, fileIndex) => (
            <Card key={fileIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  {result.fileName || `Arquivo ${fileIndex + 1}`}
                </CardTitle>
                {result.success && (
                  <CardDescription>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                      {result.type === 'check-in' && '📥 Check-in'}
                      {result.type === 'check-out' && '📤 Check-out'}
                      {result.type === 'control-file' && '📋 Arquivo de Controle'}
                      {result.type === 'unknown' && '❓ Tipo Desconhecido'}
                    </span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success ? (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        {result.reservations.length === 1 ? '1 Reserva Extraída' : `${result.reservations.length} Reservas Extraídas`}
                      </h3>
                      
                      {result.reservations.map((reservation, index) => (
                        <Card key={index} className="mb-4 border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-gray-700">👤 Nome do Hóspede</p>
                                <p className="text-gray-900">{reservation.guestName || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">🏠 Propriedade</p>
                                <p className="text-gray-900">{reservation.propertyName || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">📅 Check-in</p>
                                <p className="text-gray-900">{reservation.checkInDate || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">📅 Check-out</p>
                                <p className="text-gray-900">{reservation.checkOutDate || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">💰 Valor Total</p>
                                <p className="text-gray-900">
                                  {reservation.totalAmount ? `€${reservation.totalAmount}` : 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">👥 Número de Hóspedes</p>
                                <p className="text-gray-900">{reservation.guestCount || 'N/A'}</p>
                              </div>
                              
                              {reservation.email && (
                                <div>
                                  <p className="font-medium text-gray-700">📧 Email</p>
                                  <p className="text-gray-900">{reservation.email}</p>
                                </div>
                              )}
                              
                              {reservation.phone && (
                                <div>
                                  <p className="font-medium text-gray-700">📞 Telefone</p>
                                  <p className="text-gray-900">{reservation.phone}</p>
                                </div>
                              )}
                              
                              {reservation.notes && (
                                <div className="md:col-span-2">
                                  <p className="font-medium text-gray-700">📝 Observações</p>
                                  <p className="text-gray-900">{reservation.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {result.extractedText && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                          👁️ Ver texto extraído do PDF
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                          {result.extractedText}
                        </pre>
                      </details>
                    )}
                  </>
                ) : (
                  <div className="text-red-600">
                    <p className="font-medium">❌ Erro no processamento:</p>
                    <p>{result.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}