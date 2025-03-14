import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { generateAllDemoData, findAndRemoveDemoEntities } from "@/lib/demo-data-service";

// Layout components
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Icons
import { 
  Database, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  Info,
  Users,
  Home,
  Calendar,
  Activity,
  ArrowLeft
} from "lucide-react";

export default function DemoDataPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    counts?: { [key: string]: number };
    removed?: { [key: string]: number };
    error?: string;
  } | null>(null);
  const [loadOptions, setLoadOptions] = useState({
    owners: true,
    properties: true,
    reservations: true,
    activities: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar dados de demonstração
  const handleLoadDemoData = async () => {
    setIsLoading(true);
    setProgress(0);
    setResult(null);
    
    try {
      // Simular progresso para feedback visual
      const progressTimer = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 5;
          if (newProgress >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return newProgress;
        });
      }, 100);
      
      // Gerar dados de demonstração
      const response = await generateAllDemoData(loadOptions);
      
      // Completar o progresso
      clearInterval(progressTimer);
      setProgress(100);
      
      if (response.success) {
        setResult({
          success: true,
          counts: response.counts
        });
        
        // Feedback de sucesso
        toast({
          title: t("demoData.success", "Dados de demonstração carregados"),
          description: t(
            "demoData.successDescription", 
            `Foram criados: ${response.counts.owners} proprietários, ${response.counts.properties} propriedades, ${response.counts.reservations} reservas e ${response.counts.activities} atividades.`
          ),
        });
        
        // Atualizar dados em cache
        await queryClient.invalidateQueries({
          predicate: () => true, // Invalidar todas as queries
        });
      } else {
        setResult({
          success: false,
          error: "Ocorreu um erro ao gerar os dados de demonstração"
        });
        
        toast({
          variant: "destructive",
          title: t("demoData.error", "Erro ao carregar dados"),
          description: t("demoData.errorDescription", "Ocorreu um erro ao gerar os dados de demonstração. Tente novamente."),
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados de demonstração:", error);
      setResult({
        success: false,
        error: error.message || "Erro desconhecido"
      });
      
      toast({
        variant: "destructive",
        title: t("demoData.error", "Erro ao carregar dados"),
        description: t("demoData.errorDescription", "Ocorreu um erro ao gerar os dados de demonstração. Tente novamente."),
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // Remover dados de demonstração
  const handleRemoveDemoData = async () => {
    setIsRemoving(true);
    setProgress(0);
    setResult(null);
    
    try {
      // Simular progresso para feedback visual
      const progressTimer = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 5;
          if (newProgress >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return newProgress;
        });
      }, 100);
      
      // Buscar e remover entidades de demonstração
      const response = await findAndRemoveDemoEntities();
      
      // Completar o progresso
      clearInterval(progressTimer);
      setProgress(100);
      
      if (response.success) {
        const { removed } = response;
        
        setResult({
          success: true,
          removed: removed
        });
        
        // Feedback de sucesso
        toast({
          title: t("demoData.resetSuccess", "Dados de demonstração removidos"),
          description: t(
            "demoData.resetDescription", 
            `Foram removidos: ${removed.owners} proprietários, ${removed.properties} propriedades, ${removed.reservations} reservas e ${removed.activities} atividades.`
          ),
        });
        
        // Atualizar dados em cache
        await queryClient.invalidateQueries({
          predicate: () => true, // Invalidar todas as queries
        });
      } else {
        setResult({
          success: false,
          error: "Ocorreu um erro ao remover os dados de demonstração"
        });
        
        toast({
          variant: "destructive",
          title: t("demoData.resetError", "Erro ao remover dados"),
          description: t("demoData.resetErrorDescription", "Ocorreu um erro ao remover os dados de demonstração. Tente novamente."),
        });
      }
    } catch (error: any) {
      console.error("Erro ao remover dados de demonstração:", error);
      setResult({
        success: false,
        error: error.message || "Erro desconhecido"
      });
      
      toast({
        variant: "destructive",
        title: t("demoData.resetError", "Erro ao remover dados"),
        description: t("demoData.resetErrorDescription", "Ocorreu um erro ao remover os dados de demonstração. Tente novamente."),
      });
    } finally {
      setTimeout(() => {
        setIsRemoving(false);
      }, 500);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col space-y-8">
        {/* Header com breadcrumb */}
        <div>
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <a href="/" className="hover:text-primary flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> 
              {t("common.backToDashboard", "Voltar ao Dashboard")}
            </a>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight">{t("demoData.pageTitle", "Gerenciamento de Dados de Demonstração")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("demoData.pageDescription", "Crie ou remova dados fictícios para testar as funcionalidades do sistema")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seção de criação de dados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center text-xl">
                  <Database className="mr-2 h-5 w-5 text-blue-600" />
                  {t("demoData.createTitle", "Criar Dados de Demonstração")}
                </CardTitle>
                <CardDescription>
                  {t("demoData.createDescription", "Gere dados fictícios para visualizar as funcionalidades do sistema")}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t("demoData.noteTitle", "Importante")}</AlertTitle>
                  <AlertDescription>
                    {t("demoData.noteText", "Os dados de demonstração são identificados com [DEMO] e podem ser facilmente removidos posteriormente. Estes dados são apenas para fins de teste e não afetam os dados reais.")}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-md bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="owners-toggle">{t("demoData.owners", "Proprietários")}</Label>
                        <Switch
                          id="owners-toggle"
                          checked={loadOptions.owners}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              owners: checked,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("demoData.ownersDesc", "Proprietários fictícios para associar às propriedades")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-md bg-emerald-100">
                      <Home className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="properties-toggle">{t("demoData.properties", "Propriedades")}</Label>
                        <Switch
                          id="properties-toggle"
                          checked={loadOptions.properties}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              properties: checked,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("demoData.propertiesDesc", "Imóveis para aluguel com dados completos")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-md bg-amber-100">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reservations-toggle">{t("demoData.reservations", "Reservas")}</Label>
                        <Switch
                          id="reservations-toggle"
                          checked={loadOptions.reservations}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              reservations: checked,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("demoData.reservationsDesc", "Histórico e reservas futuras")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-md bg-purple-100">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="activities-toggle">{t("demoData.activities", "Atividades")}</Label>
                        <Switch
                          id="activities-toggle"
                          checked={loadOptions.activities}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              activities: checked,
                            })
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("demoData.activitiesDesc", "Histórico de atividades no sistema")}
                      </p>
                    </div>
                  </div>
                </div>
                
                {isLoading && (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <p>{t("demoData.generating", "Gerando dados de demonstração...")}</p>
                    </div>
                    <Progress value={progress} className="h-2 w-full" />
                  </div>
                )}
                
                {result && result.success && result.counts && (
                  <div className="bg-green-50 border border-green-100 rounded-md p-4 mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          {t("demoData.successTitle", "Dados gerados com sucesso")}
                        </h3>
                        <div className="mt-2 text-sm text-green-700 space-y-1">
                          <p>
                            {t("demoData.ownersCreated", "Proprietários")}: {result.counts.owners}
                          </p>
                          <p>
                            {t("demoData.propertiesCreated", "Propriedades")}: {result.counts.properties}
                          </p>
                          <p>
                            {t("demoData.reservationsCreated", "Reservas")}: {result.counts.reservations}
                          </p>
                          <p>
                            {t("demoData.activitiesCreated", "Atividades")}: {result.counts.activities}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {result && !result.success && (
                  <div className="bg-red-50 border border-red-100 rounded-md p-4 mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-red-100 rounded-full p-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {t("demoData.errorTitle", "Erro ao gerar dados")}
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{result.error || t("demoData.unknownError", "Ocorreu um erro desconhecido.")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t">
                <Button 
                  variant="default"
                  onClick={handleLoadDemoData} 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading", "Processando...")}
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      {t("demoData.load", "Carregar dados de demonstração")}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
          
          {/* Seção de remoção de dados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3 bg-gradient-to-r from-rose-50 to-red-50">
                <CardTitle className="flex items-center text-xl">
                  <RefreshCw className="mr-2 h-5 w-5 text-red-600" />
                  {t("demoData.removeTitle", "Remover Dados de Demonstração")}
                </CardTitle>
                <CardDescription>
                  {t("demoData.removeDescription", "Limpe todos os dados fictícios gerados anteriormente")}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t("demoData.warningTitle", "Atenção")}</AlertTitle>
                  <AlertDescription>
                    {t("demoData.warningText", "Esta ação removerá todos os dados marcados como [DEMO]. Esta operação não pode ser desfeita, mas seus dados reais permanecerão intactos.")}
                  </AlertDescription>
                </Alert>
                
                <div className="flex p-3 border rounded-md bg-gray-50">
                  <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    {t("demoData.removeInfo", "O sistema identificará automaticamente todos os registros de demonstração pelo sufixo [DEMO] em seus nomes. A remoção é feita com segurança, preservando a integridade dos dados reais.")}
                  </p>
                </div>
                
                {isRemoving && (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                      <p>{t("demoData.removing", "Removendo dados de demonstração...")}</p>
                    </div>
                    <Progress value={progress} className="h-2 w-full" />
                  </div>
                )}
                
                {result && result.success && result.removed && (
                  <div className="bg-green-50 border border-green-100 rounded-md p-4 mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          {t("demoData.resetSuccessTitle", "Dados removidos com sucesso")}
                        </h3>
                        <div className="mt-2 text-sm text-green-700 space-y-1">
                          <p>
                            {t("demoData.ownersRemoved", "Proprietários")}: {result.removed.owners}
                          </p>
                          <p>
                            {t("demoData.propertiesRemoved", "Propriedades")}: {result.removed.properties}
                          </p>
                          <p>
                            {t("demoData.reservationsRemoved", "Reservas")}: {result.removed.reservations}
                          </p>
                          <p>
                            {t("demoData.activitiesRemoved", "Atividades")}: {result.removed.activities}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t">
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveDemoData} 
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading", "Processando...")}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t("demoData.reset", "Remover dados de demonstração")}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}