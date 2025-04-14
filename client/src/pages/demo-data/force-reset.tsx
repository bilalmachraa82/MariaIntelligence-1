import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, RefreshCw, CheckCircle2, Database } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { installDemoDataRemover, isForceCleanMode } from "../../force-disable-demo";

export default function ForceResetDemoData() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar status atual
  const [currentStatus, setCurrentStatus] = useState({
    demoDataRemoved: localStorage.getItem('demoDataRemoved') === 'true',
    hideDemoTasks: localStorage.getItem('hideDemoTasks') === 'true',
    showDemoDataInDashboard: localStorage.getItem('showDemoDataInDashboard') === 'true',
    forceCleanMode: localStorage.getItem('forceCleanMode') === 'true'
  });
  
  useEffect(() => {
    // Atualizar status a cada 2 segundos
    const interval = setInterval(() => {
      setCurrentStatus({
        demoDataRemoved: localStorage.getItem('demoDataRemoved') === 'true',
        hideDemoTasks: localStorage.getItem('hideDemoTasks') === 'true',
        showDemoDataInDashboard: localStorage.getItem('showDemoDataInDashboard') === 'true',
        forceCleanMode: localStorage.getItem('forceCleanMode') === 'true'
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Função para forçar a desativação total de dados demo
  const forceResetDemoData = async () => {
    setIsRemoving(true);
    setProgress(0);
    setError(null);
    
    try {
      // Passo 1: Configurar localStorage
      setProgress(10);
      localStorage.setItem('demoDataRemoved', 'true');
      localStorage.setItem('hideDemoTasks', 'true');
      localStorage.setItem('showDemoDataInDashboard', 'false');
      localStorage.setItem('forceCleanMode', 'true');
      
      // Atualizar status
      setCurrentStatus({
        demoDataRemoved: true,
        hideDemoTasks: true,
        showDemoDataInDashboard: false,
        forceCleanMode: true
      });
      
      // Passo 2: Chamar API para resetar dados
      setProgress(30);
      // Chamar API explicitamente com parâmetro forceCleanMode=true
      const resetResponse = await apiRequest("/api/demo/reset?forceCleanMode=true", {
        method: "POST",
      });
      
      console.log('Resultado da remoção forçada:', resetResponse);
      setProgress(60);
      
      // Passo 3: Instalar interceptor para adicionar parâmetros em todas as requisições
      // Passar true para habilitar o modo forçado
      setProgress(80);
      const interceptorInstalled = installDemoDataRemover(true);
      
      if (!interceptorInstalled) {
        throw new Error("Falha ao instalar interceptor de requisições");
      }
      
      console.log('Interceptor instalado com parâmetro forceCleanMode=true');
      
      setProgress(90);
      
      // Passo 4: Invalidar todas as queries para forçar recarregamento de dados
      await queryClient.invalidateQueries();
      
      setProgress(100);
      setSuccess(true);
      
      toast({
        title: "Dados de demonstração forçadamente removidos",
        description: "Todas as flags e dados de demonstração foram desativados com sucesso.",
      });
      
    } catch (error) {
      console.error("Erro ao forçar remoção de dados demo:", error);
      setError("Ocorreu um erro ao tentar remover os dados de demonstração. Verifique o console para mais detalhes.");
      
      toast({
        variant: "destructive",
        title: "Erro ao remover dados",
        description: "Ocorreu um erro ao forçar a remoção dos dados de demonstração.",
      });
    } finally {
      setTimeout(() => {
        setIsRemoving(false);
      }, 500);
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <Card className="shadow-lg border-red-200">
        <CardHeader className="bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <CardTitle className="text-xl text-red-800">
              Remoção Forçada de Dados de Demonstração
            </CardTitle>
          </div>
          <CardDescription className="text-red-700">
            Esta ferramenta remove todos os dados de demonstração e impede que sejam gerados novamente.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Status atual */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status Atual</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${currentStatus.demoDataRemoved ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex gap-2 items-center">
                  {currentStatus.demoDataRemoved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                  <span className="font-medium">demoDataRemoved</span>
                </div>
                <div className="mt-1 text-sm">
                  {currentStatus.demoDataRemoved ? (
                    <span className="text-green-700">Ativo (dados demo desativados)</span>
                  ) : (
                    <span className="text-amber-700">Inativo (dados demo permitidos)</span>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${currentStatus.hideDemoTasks ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex gap-2 items-center">
                  {currentStatus.hideDemoTasks ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                  <span className="font-medium">hideDemoTasks</span>
                </div>
                <div className="mt-1 text-sm">
                  {currentStatus.hideDemoTasks ? (
                    <span className="text-green-700">Ativo (tarefas demo ocultas)</span>
                  ) : (
                    <span className="text-amber-700">Inativo (tarefas demo visíveis)</span>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${!currentStatus.showDemoDataInDashboard ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex gap-2 items-center">
                  {!currentStatus.showDemoDataInDashboard ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                  <span className="font-medium">showDemoDataInDashboard</span>
                </div>
                <div className="mt-1 text-sm">
                  {!currentStatus.showDemoDataInDashboard ? (
                    <span className="text-green-700">Desativado (dados demo ocultos)</span>
                  ) : (
                    <span className="text-amber-700">Ativo (dados demo visíveis)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Informações */}
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Esta é uma ferramenta avançada</AlertTitle>
            <AlertDescription>
              Esta ferramenta modifica o comportamento interno do sistema para garantir que todos os dados de demonstração sejam permanentemente removidos e não sejam mais gerados.
            </AlertDescription>
          </Alert>
          
          {/* Status do processo */}
          {isRemoving && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <p className="font-medium">Removendo dados de demonstração...</p>
              </div>
              <Progress value={progress} className="h-2 w-full" />
              <p className="text-sm text-gray-600">Não feche esta página durante o processo.</p>
            </div>
          )}
          
          {success && !isRemoving && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Dados de demonstração removidos</AlertTitle>
              <AlertDescription>
                Todos os dados de demonstração foram removidos com sucesso e o sistema foi configurado para não gerar novos dados demo.
              </AlertDescription>
            </Alert>
          )}
          
          {error && !isRemoving && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao remover dados</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between bg-gray-50 border-t">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/demo-data")}
          >
            Voltar
          </Button>
          
          <Button 
            variant="destructive"
            onClick={forceResetDemoData}
            disabled={isRemoving || success}
            className="bg-red-600 hover:bg-red-700"
          >
            <Database className="mr-2 h-4 w-4" />
            {isRemoving ? "Removendo..." : "Remover Forçadamente Dados Demo"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}