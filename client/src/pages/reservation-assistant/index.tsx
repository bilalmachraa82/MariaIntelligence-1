import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, FileUp, Clock, AlertTriangle, Loader2, Clipboard, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

// Componente principal do assistente de reservas
export default function ReservationAssistant() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [text, setText] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [processingText, setProcessingText] = useState<boolean>(false);
  const [processingFile, setProcessingFile] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [savingReservations, setSavingReservations] = useState<boolean>(false);
  
  // Função para processar texto
  const processText = async () => {
    if (!text.trim()) {
      toast({
        title: "Texto em branco",
        description: "Por favor, insira o texto da reserva para processar.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setProcessingText(true);
      
      // Chamar API para processar texto
      const response = await apiRequest('/api/reservation-assistant/process', {
        method: 'POST',
        body: { text }
      });
      
      if (response.success) {
        setResult(response.data);
        if (response.data.reservations?.length > 0) {
          toast({
            title: "Processamento concluído",
            description: `${response.data.reservations.length} reserva(s) encontrada(s).`,
            variant: "default"
          });
        } else {
          toast({
            title: "Nenhuma reserva encontrada",
            description: "Não foi possível detectar reservas no texto fornecido.",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(response.message || "Erro ao processar texto");
      }
    } catch (error: any) {
      console.error("Erro ao processar texto:", error);
      toast({
        title: "Erro ao processar texto",
        description: error.message || "Ocorreu um erro ao processar o texto. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessingText(false);
    }
  };
  
  // Função para lidar com mudança no arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };
  
  // Função para abrir o seletor de arquivo
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Função para processar arquivo
  const processFile = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo PDF ou imagem para processar.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar o tipo do arquivo
    if (!file.type.includes('pdf') && !file.type.includes('image/')) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, selecione um arquivo PDF ou uma imagem (JPG, PNG).",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setProcessingFile(true);
      
      // Criar FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Chamar API para processar arquivo
      const response = await fetch('/api/reservation-assistant/upload', {
        method: 'POST',
        body: formData
      });
      
      const jsonResponse = await response.json();
      
      if (jsonResponse.success) {
        setResult(jsonResponse.data);
        if (jsonResponse.data.reservations?.length > 0) {
          toast({
            title: "Processamento concluído",
            description: `${jsonResponse.data.reservations.length} reserva(s) encontrada(s).`,
            variant: "default"
          });
        } else {
          toast({
            title: "Nenhuma reserva encontrada",
            description: "Não foi possível detectar reservas no arquivo fornecido.",
            variant: "destructive"
          });
        }
      } else {
        throw new Error(jsonResponse.message || "Erro ao processar arquivo");
      }
    } catch (error: any) {
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: error.message || "Ocorreu um erro ao processar o arquivo. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setProcessingFile(false);
    }
  };
  
  // Função para copiar texto para a área de transferência
  const copyToClipboard = () => {
    if (result?.responseMessage) {
      navigator.clipboard.writeText(result.responseMessage);
      toast({
        title: "Copiado!",
        description: "Resposta copiada para a área de transferência.",
        variant: "default"
      });
    }
  };
  
  // Função para salvar reservas na base de dados
  const saveReservations = async () => {
    if (!result?.reservations || result.reservations.length === 0) {
      toast({
        title: "Nenhuma reserva para salvar",
        description: "Não há reservas para salvar na base de dados.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSavingReservations(true);
      
      // Chamar API para salvar reservas
      const response = await apiRequest('/api/reservation-assistant/save', {
        method: 'POST',
        body: { reservations: result.reservations }
      });
      
      if (response.success) {
        toast({
          title: "Reservas salvas com sucesso",
          description: `${response.savedCount} reserva(s) salva(s) na base de dados.`,
          variant: "default"
        });
        
        // Invalidar o cache de reservas para atualizar a interface
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/reservations/dashboard'] });
      } else {
        throw new Error(response.message || "Erro ao salvar reservas");
      }
    } catch (error: any) {
      console.error("Erro ao salvar reservas:", error);
      toast({
        title: "Erro ao salvar reservas",
        description: error.message || "Ocorreu um erro ao salvar as reservas. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSavingReservations(false);
    }
  };
  
  // Função para renderizar markdown
  const renderMarkdown = (markdown: string) => {
    // Renderização simples de markdown
    return (
      <div 
        dangerouslySetInnerHTML={{ 
          __html: markdown
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/\n/g, '<br/>')
            .replace(/\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|/g, 
              '<div class="grid grid-cols-6 gap-2 border-b py-1"><div>$1</div><div>$2</div><div>$3</div><div>$4</div><div>$5</div><div>$6</div></div>')
        }} 
      />
    );
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Assistente de Reservas</h1>
      <p className="text-muted-foreground mb-6">
        Use o Gemini 2.5 Flash para extrair automaticamente informações de reservas de textos ou documentos.
      </p>
      
      <Tabs defaultValue="text">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="text">Texto</TabsTrigger>
          <TabsTrigger value="file">Arquivo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Processar Texto</CardTitle>
              <CardDescription>
                Cole o texto da reserva para extrair as informações automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="text">Texto da Reserva</Label>
                <Textarea
                  id="text"
                  placeholder="Cole aqui o texto da reserva..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                />
              </div>
              <Button 
                onClick={processText} 
                disabled={processingText || !text.trim()}
                className="w-full"
              >
                {processingText ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Processando...
                  </>
                ) : (
                  "Processar Texto"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Processar Arquivo</CardTitle>
              <CardDescription>
                Faça upload de um arquivo PDF ou imagem para extrair as informações automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/jpeg,image/png"
                className="hidden"
              />
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={triggerFileSelect}
              >
                <FileUp className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Clique para selecionar um arquivo ou arraste e solte
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Suporta PDF, JPG e PNG
                </p>
              </div>
              
              {file && (
                <div className="text-sm text-gray-700 bg-gray-100 p-2 rounded flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
              
              <Button 
                onClick={processFile} 
                disabled={processingFile || !file}
                className="w-full"
              >
                {processingFile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Processando...
                  </>
                ) : (
                  "Processar Arquivo"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Resultado do processamento */}
      {result && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Resultado</h2>
          
          {/* Alerta se houver informações cruciais faltando */}
          {result.missingCrucialInfo && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Informações cruciais faltando</AlertTitle>
              <AlertDescription>
                Algumas informações importantes estão faltando. Revise os resultados antes de salvar.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Resposta do assistente */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Resposta do Assistente</CardTitle>
                <CardDescription>
                  Interpretação e análise das informações de reserva
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyToClipboard}
                title="Copiar resposta"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {renderMarkdown(result.responseMessage || "")}
              </div>
            </CardContent>
          </Card>
          
          {/* Reservas detectadas */}
          {result.reservations && result.reservations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reservas Detectadas</CardTitle>
                <CardDescription>
                  {result.reservations.length} reserva(s) foram encontrada(s) no texto/arquivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Tabela de reservas */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Alojamento</th>
                        <th className="text-left p-2">Hóspede</th>
                        <th className="text-left p-2">Check-in</th>
                        <th className="text-left p-2">Check-out</th>
                        <th className="text-left p-2">Pessoas</th>
                        <th className="text-left p-2">Canal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.reservations.map((reservation: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{reservation.alojamento || "N/A"}</td>
                          <td className="p-2">{reservation.nome_hospede || "N/A"}</td>
                          <td className="p-2">{reservation.data_check_in || "N/A"}</td>
                          <td className="p-2">{reservation.data_check_out || "N/A"}</td>
                          <td className="p-2">{reservation.total_hospedes || "N/A"}</td>
                          <td className="p-2">{reservation.canal_reserva || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Botão para salvar reservas */}
                <div className="mt-6">
                  <Button
                    onClick={saveReservations}
                    disabled={savingReservations || result.missingCrucialInfo}
                    className="w-full"
                  >
                    {savingReservations ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Reservas na Base de Dados
                      </>
                    )}
                  </Button>
                  
                  {result.missingCrucialInfo && (
                    <p className="text-xs text-red-500 mt-2">
                      Não é possível salvar as reservas até que todas as informações cruciais estejam preenchidas.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}