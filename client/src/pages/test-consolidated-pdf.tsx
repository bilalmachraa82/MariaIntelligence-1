import { ConsolidatedPdfUpload } from "@/components/ConsolidatedPdfUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TestTube, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  Brain,
  FileText
} from "lucide-react";
import { useState, useEffect } from "react";

interface SystemStatus {
  geminiAPI: boolean;
  database: boolean;
  propertiesCount: number;
  aroeiras: number;
}

export default function TestConsolidatedPdf() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isTestingSystem, setIsTestingSystem] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setIsTestingSystem(true);
    try {
      const response = await fetch('/api/pdf/test-system');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.systemStatus);
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setIsTestingSystem(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <TestTube className="h-8 w-8 text-primary" />
          Teste do Sistema Consolidado PDF
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Sistema melhorado com Gemini 2.5 Flash, processamento unificado e integração direta com a base de dados.
          Use os PDFs disponíveis para testar a funcionalidade completa.
        </p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status do Sistema
            <Button
              size="sm"
              variant="outline"
              onClick={checkSystemStatus}
              disabled={isTestingSystem}
            >
              {isTestingSystem ? 'Verificando...' : 'Atualizar'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Gemini API</p>
                  <Badge variant={systemStatus.geminiAPI ? "default" : "destructive"}>
                    {systemStatus.geminiAPI ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Base de Dados</p>
                  <Badge variant={systemStatus.database ? "default" : "destructive"}>
                    {systemStatus.database ? 'Conectada' : 'Desconectada'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">Propriedades</p>
                  <Badge variant="outline">
                    {systemStatus.propertiesCount} Total
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium">Aroeiras</p>
                  <Badge variant="outline">
                    {systemStatus.aroeiras} Propriedades
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <AlertCircle className="h-5 w-5" />
              Carregando status do sistema...
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Files Available for Testing */}
      <Card>
        <CardHeader>
          <CardTitle>PDFs Disponíveis para Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Controlo_5 de Outubro (9).pdf</h4>
              <p className="text-sm text-gray-600">
                Arquivo de controlo com múltiplas reservas para teste de processamento em lote.
              </p>
              <Badge variant="outline" className="mt-2">Arquivo de Controlo</Badge>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Controlo_Aroeira I (6).pdf</h4>
              <p className="text-sm text-gray-600">
                Controlo específico da propriedade Aroeira I - teste de matching de propriedade.
              </p>
              <Badge variant="outline" className="mt-2">Aroeira I</Badge>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">entrada.pdf</h4>
              <p className="text-sm text-gray-600">
                PDF de entrada/check-in para teste de dados de reserva individual.
              </p>
              <Badge variant="outline" className="mt-2">Check-in</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Upload Component */}
      <ConsolidatedPdfUpload />

      {/* Endpoints Information */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoints do Sistema Consolidado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge>POST</Badge>
              <div>
                <code className="text-sm font-mono">/api/pdf/upload-pdf</code>
                <p className="text-sm text-gray-600 mt-1">
                  Processa PDF e extrai dados de reserva usando Gemini 2.5 Flash
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge>POST</Badge>
              <div>
                <code className="text-sm font-mono">/api/pdf/create-reservation-from-pdf</code>
                <p className="text-sm text-gray-600 mt-1">
                  Cria reserva na base de dados a partir dos dados extraídos
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge variant="outline">GET</Badge>
              <div>
                <code className="text-sm font-mono">/api/pdf/test-system</code>
                <p className="text-sm text-gray-600 mt-1">
                  Verifica status do sistema consolidado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}