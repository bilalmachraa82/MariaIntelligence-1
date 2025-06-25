import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Upload, Loader2 } from 'lucide-react';

interface N8nUploadResult {
  success: boolean;
  data?: {
    reservationsCreated: number;
    reservations: any[];
    processingTime: number;
    aiProvider: string;
  };
  error?: string;
  n8nExecutionId?: string;
}

export function N8nUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<N8nUploadResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResult({
        success: false,
        error: 'Apenas arquivos PDF são permitidos'
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setResult(null);

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/n8n/process-pdf', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();
      setResult(data);

    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar arquivo'
      });
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload via n8n
          </CardTitle>
          <CardDescription>
            Processar PDF de reservas usando integração n8n (mais rápido e confiável)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para enviar</span> ou arraste o arquivo
                  </p>
                  <p className="text-xs text-gray-500">Apenas arquivos PDF (máx. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processando via n8n...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {result && (
              <Alert className={result.success ? "border-green-500" : "border-red-500"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {result.success ? (
                      <div className="space-y-2">
                        <p className="font-medium text-green-800">
                          Processamento concluído com sucesso!
                        </p>
                        <div className="text-sm text-green-700">
                          <p>• {result.data?.reservationsCreated || 0} reservas criadas</p>
                          <p>• Tempo de processamento: {result.data?.processingTime || 0}ms</p>
                          <p>• IA utilizada: {result.data?.aiProvider || 'n8n'}</p>
                          {result.n8nExecutionId && (
                            <p>• ID execução n8n: {result.n8nExecutionId}</p>
                          )}
                        </div>
                        {result.data?.reservations && result.data.reservations.length > 0 && (
                          <div className="mt-3 text-sm">
                            <p className="font-medium">Reservas criadas:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {result.data.reservations.map((reservation, index) => (
                                <li key={index} className="text-green-700">
                                  {reservation.guestName} - {reservation.checkInDate} a {reservation.checkOutDate}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-medium text-red-800">Erro no processamento</p>
                        <p className="text-sm text-red-700">{result.error}</p>
                        {result.n8nExecutionId && (
                          <p className="text-xs text-red-600">
                            ID execução n8n: {result.n8nExecutionId}
                          </p>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status da integração n8n */}
      <N8nStatus />
    </div>
  );
}

// Componente para mostrar status da integração n8n
function N8nStatus() {
  const [status, setStatus] = useState<{
    success: boolean;
    n8nStatus: string;
    webhookUrl?: string;
    lastCheck?: string;
  } | null>(null);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/n8n/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        success: false,
        n8nStatus: 'erro',
        lastCheck: new Date().toISOString()
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Status da Integração n8n</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status?.n8nStatus === 'online' ? 'bg-green-500' : 
              status?.n8nStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm">
              {status?.n8nStatus === 'online' ? 'Online' :
               status?.n8nStatus === 'offline' ? 'Offline' : 'Não verificado'}
            </span>
            {status?.lastCheck && (
              <span className="text-xs text-gray-500">
                ({new Date(status.lastCheck).toLocaleTimeString()})
              </span>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkStatus}
          >
            Verificar Status
          </Button>
        </div>
        {status?.webhookUrl && (
          <p className="text-xs text-gray-600 mt-2">
            URL: {status.webhookUrl}
          </p>
        )}
      </CardContent>
    </Card>
  );
}