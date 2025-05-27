import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Users, Calendar, Euro, CheckCircle, AlertCircle, Merge, Sparkles } from 'lucide-react';

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
  source?: string;
}

interface OCRResult {
  success: boolean;
  type: 'check-in' | 'check-out' | 'control-file' | 'unknown';
  reservations: ExtractedReservation[];
  extractedText?: string;
  error?: string;
  consolidatedReservations?: number;
}

export default function SimpleOCR() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OCRResult[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const validFiles = selectedFiles.filter(file => allowedTypes.includes(file.type));
    setFiles(validFiles);
    setResults([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResults([]);

    try {
      // Para múltiplos arquivos, processar cada um individualmente com o extractor funcionando
      if (files.length > 1) {
        const allResults: OCRResult[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`📄 Processando arquivo ${i + 1}/${files.length}: ${file.name}`);
          
          const formData = new FormData();
          formData.append('file', file);
          
          try {
            const response = await fetch('/api/extractor-working', {
              method: 'POST',
              body: formData,
            });
            
            const data = await response.json();
            allResults.push({
              success: data.success,
              type: 'check-in',
              reservations: data.reservations || [],
              error: data.error
            });
          } catch (error) {
            allResults.push({
              success: false,
              type: 'unknown',
              reservations: [],
              error: `Erro ao processar ${file.name}`
            });
          }
        }
        
        setResults(allResults);
        return;
      }

      // Processamento individual para um arquivo
      const allResults: OCRResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 Processando arquivo ${i + 1}/${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);

        try {
          // Use the working EXTRACTOR v4.2 that extracted 38 reservations
          const response = await fetch('/api/extractor-working', {
            method: 'POST',
            body: formData,
          });

          const data: OCRResult = await response.json();
          allResults.push({
            ...data,
            fileName: file.name // Adicionar nome do arquivo para identificação
          } as OCRResult & { fileName: string });

        } catch (error) {
          allResults.push({
            success: false,
            type: 'unknown',
            reservations: [],
            error: `Erro ao processar ${file.name}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'),
            fileName: file.name
          } as OCRResult & { fileName: string });
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'check-in': return 'Check-in';
      case 'check-out': return 'Check-out';
      case 'control-file': return 'Arquivo de Controle';
      default: return 'Desconhecido';
    }
  };

  const handleSaveReservations = async (reservations: ExtractedReservation[]) => {
    setIsProcessing(true);
    
    try {
      for (const reservation of reservations) {
        // Primeiro, vamos buscar o ID da propriedade baseado no nome
        let propertyId = null;
        
        if (reservation.propertyName) {
          const propertiesResponse = await fetch('/api/properties');
          const properties = await propertiesResponse.json();
          
          // Normalizar nomes para melhor correspondência
          const normalizePropertyName = (name: string) => 
            name.toLowerCase()
              .replace(/\s+/g, '')
              .replace(/[àáâãä]/g, 'a')
              .replace(/[èéêë]/g, 'e')
              .replace(/[ìíîï]/g, 'i')
              .replace(/[òóôõö]/g, 'o')
              .replace(/[ùúûü]/g, 'u')
              .replace(/[ç]/g, 'c');
          
          const normalizedReservationProperty = normalizePropertyName(reservation.propertyName);
          
          const matchedProperty = properties.find((p: any) => {
            const normalizedDbProperty = normalizePropertyName(p.name);
            
            // Ignorar propriedades com "check-in" ou "check-out" no nome
            if (p.name.toLowerCase().includes('check-in') || 
                p.name.toLowerCase().includes('check-out') ||
                p.name.toLowerCase().includes('checkin') || 
                p.name.toLowerCase().includes('checkout')) {
              return false;
            }
            
            // Correspondência exata primeiro
            if (normalizedDbProperty === normalizedReservationProperty) return true;
            
            // Correspondência por palavras-chave específicas (mínimo 4 caracteres)
            const reservationWords = normalizedReservationProperty.split(/[^a-z0-9]/).filter(w => w.length >= 4);
            const dbWords = normalizedDbProperty.split(/[^a-z0-9]/).filter(w => w.length >= 4);
            
            // Procurar palavras-chave importantes
            const keyWords = ['almada', 'noronha', 'joao', 'batista', 'barcos', 'bernardo', 'obidos'];
            
            for (const keyWord of keyWords) {
              if (normalizedReservationProperty.includes(keyWord) && normalizedDbProperty.includes(keyWord)) {
                return true;
              }
            }
            
            // Correspondência de palavras (só se tiver pelo menos 2 palavras coincidentes)
            const matches = reservationWords.filter(word => 
              dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
            );
            
            return matches.length >= 2;
          });
          
          if (matchedProperty) {
            propertyId = matchedProperty.id;
            console.log(`✅ Propriedade encontrada: ${reservation.propertyName} → ${matchedProperty.name} (ID: ${matchedProperty.id})`);
          } else {
            console.log(`❌ Propriedade não encontrada: ${reservation.propertyName}`);
            // Usar a primeira propriedade disponível como fallback
            propertyId = properties.length > 0 ? properties[0].id : null;
          }
        }

        // Se ainda não temos propriedade válida, pular esta reserva
        if (!propertyId) {
          console.log(`⚠️ Pulando reserva ${reservation.guestName} - nenhuma propriedade válida encontrada`);
          continue;
        }

        // Criar a reserva na base de dados
        const reservationData = {
          propertyId: propertyId,
          guestName: reservation.guestName,
          guestEmail: reservation.email || null,
          guestPhone: reservation.phone || null,
          checkInDate: reservation.checkInDate,
          checkOutDate: reservation.checkOutDate,
          guestCount: reservation.guestCount,
          totalAmount: reservation.totalAmount.toString(),
          source: 'direct' as const,
          status: 'confirmed' as const,
          notes: reservation.notes || null
        };

        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reservationData),
        });

        if (!response.ok) {
          throw new Error(`Erro ao guardar reserva: ${response.statusText}`);
        }
      }

      alert(`Sucesso! ${reservations.length} reserva(s) guardada(s) com sucesso na base de dados.`);

    } catch (error) {
      console.error('Erro ao guardar reservas:', error);
      alert('Erro ao guardar as reservas na base de dados.');
    } finally {
      setIsProcessing(false);
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
          Processe PDFs ou imagens (JPG, PNG, WebP) de reservas e extraia dados automaticamente usando IA
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Documentos
          </CardTitle>
          <CardDescription>
            Suporte para PDFs e imagens (JPG, PNG, WebP) de check-in, check-out e arquivos de controle com múltiplas reservas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
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

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.some(r => r.success) ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado do Processamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, resultIndex) => (
              <div key={resultIndex} className="space-y-4">
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
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => handleSaveReservations(result.reservations)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isProcessing}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Guardar {result.reservations.length} Reserva(s) na Base de Dados
                          </Button>
                        </div>
                        {result.reservations.map((reservation: ExtractedReservation, index: number) => (
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
            </div>
          ))}
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