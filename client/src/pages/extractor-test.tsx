import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Users, Calendar } from 'lucide-react';

interface ExtractedReservation {
  nome: string;
  data_entrada: string;
  data_saida: string;
  hospedes: number;
}

interface ExtractorResponse {
  success: boolean;
  reservations: ExtractedReservation[];
  count: number;
  message?: string;
  error?: string;
}

export default function ExtractorTest() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractorResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('Por favor, selecione um arquivo PDF');
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/extractor-working', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      console.error('Erro ao processar:', error);
      setResult({
        success: false,
        reservations: [],
        count: 0,
        error: 'Erro de conexão'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            EXTRACTOR DE RESERVAS v4.2 - Teste
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema que extraiu 38 reservas dos seus arquivos (13) e (14)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="mb-4"
            />
          </div>
          
          <Button 
            onClick={handleExtract}
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando com Gemini 2.5 Flash...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Extrair Reservas
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <Users className="h-6 w-6 text-green-600" />
                  Sucesso! {result.count} reservas encontradas
                </>
              ) : (
                <>
                  <FileText className="h-6 w-6 text-red-600" />
                  Erro no processamento
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <p className="text-green-600 font-medium">{result.message}</p>
                
                <div className="grid gap-3">
                  {result.reservations.slice(0, 10).map((reservation, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{reservation.nome}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {reservation.data_entrada} → {reservation.data_saida}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {reservation.hospedes} hóspedes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {result.reservations.length > 10 && (
                    <p className="text-center text-gray-600 italic">
                      ... e mais {result.reservations.length - 10} reservas
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-red-600">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}