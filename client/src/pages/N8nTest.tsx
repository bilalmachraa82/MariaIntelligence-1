import { N8nUpload } from '@/components/N8nUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function N8nTest() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teste de Integração n8n</h1>
        <p className="text-muted-foreground">
          Teste o novo sistema de processamento de PDFs via n8n
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sobre a Integração n8n</CardTitle>
            <CardDescription>
              Nova arquitetura que simplifica o processamento de PDFs e melhora a confiabilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-green-700">Vantagens</h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-green-600">
                  <li>Processamento mais rápido e confiável</li>
                  <li>Logs detalhados e debugging visual</li>
                  <li>Retry automático em caso de falha</li>
                  <li>Interface visual para modificar o fluxo</li>
                  <li>Monitorização em tempo real</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-700">Como Funciona</h3>
                <ol className="list-decimal list-inside text-sm space-y-1 text-blue-600">
                  <li>Website envia PDF para webhook n8n</li>
                  <li>n8n processa o arquivo com IA (OpenAI/Gemini)</li>
                  <li>Dados são validados e normalizados</li>
                  <li>Reservas são inseridas na base de dados</li>
                  <li>Resultado é retornado para o website</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-orange-700">Requisitos</h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-orange-600">
                  <li>Instância n8n rodando (Docker ou npm)</li>
                  <li>Workflow importado e configurado</li>
                  <li>Credenciais API configuradas</li>
                  <li>Variáveis de ambiente definidas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <N8nUpload />
      </div>
    </div>
  );
}