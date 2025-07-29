import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "@/lib/motion-fallback";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, subDays, subMonths, addDays } from "date-fns";
import { useTranslation } from "react-i18next";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Icons
import { Database, Loader2, RefreshCw, AlertTriangle, Check, Info } from "lucide-react";

export function DemoDataManager() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [loadOptions, setLoadOptions] = useState({
    properties: true,
    owners: true,
    reservations: true,
    activities: true,
    financialDocuments: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load demo data
  const loadDemoData = async () => {
    setIsLoading(true);
    setProgress(0);
    
    try {
      // Collect options to include in payload
      const options = {
        include: Object.entries(loadOptions)
          .filter(([_, isSelected]) => isSelected)
          .map(([key]) => key)
      };
      
      // API call to generate demo data
      const response = await apiRequest("/api/demo/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });
      
      // Mock progress for visual feedback
      const timer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          return newProgress;
        });
      }, 300);
      
      // Success message
      toast({
        title: t("demoData.success", "Dados de demonstração carregados"),
        description: t("demoData.successDescription", `${response.itemsCreated || 'Múltiplos'} itens foram criados com sucesso.`),
      });
      
      // Configurar flags do localStorage quando dados são carregados novamente
      if (typeof window !== 'undefined') {
        // Remover a flag que indica que os dados de demonstração foram removidos
        localStorage.removeItem('demoDataRemoved');
        
        // Garantir que os dados de demonstração serão exibidos no dashboard
        localStorage.setItem('showDemoDataInDashboard', 'true');
        
        // Garantir que as tarefas de demonstração não são ocultadas
        localStorage.setItem('hideDemoTasks', 'false');
        
        console.log('Flags do localStorage configuradas para mostrar dados de demonstração');
      }
      
      // Invalidate all queries to refresh data
      await queryClient.invalidateQueries();
      
    } catch (error) {
      console.error("Erro ao carregar dados de demonstração:", error);
      toast({
        variant: "destructive",
        title: t("demoData.error", "Erro ao carregar dados"),
        description: t("demoData.errorDescription", "Ocorreu um erro ao gerar os dados de demonstração. Tente novamente."),
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setOpen(false);
        setProgress(0);
      }, 1000);
    }
  };

  // Reset demo data
  const resetDemoData = async () => {
    setIsLoading(true);
    setProgress(0);
    
    try {
      // API call to reset demo data
      await apiRequest("/api/demo/reset", {
        method: "POST",
      });
      
      // Mock progress for visual feedback
      const timer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      // Success message
      toast({
        title: t("demoData.resetSuccess", "Dados de demonstração removidos"),
        description: t("demoData.resetDescription", "Todos os dados de demonstração foram removidos com sucesso."),
      });
      
      // Configurar todas as flags no localStorage para ocultar dados de demonstração
      if (typeof window !== 'undefined') {
        // Marcar que os dados de demonstração foram removidos
        localStorage.setItem('demoDataRemoved', 'true');
        
        // Ocultar tarefas de demonstração
        localStorage.setItem('hideDemoTasks', 'true');
        
        // Não mostrar dados de demonstração no dashboard
        localStorage.setItem('showDemoDataInDashboard', 'false');
        
        console.log('Flags do localStorage configuradas para ocultar dados de demonstração');
      }
      
      // Invalidate all queries to refresh data
      await queryClient.invalidateQueries();
      
    } catch (error) {
      console.error("Erro ao resetar dados de demonstração:", error);
      toast({
        variant: "destructive",
        title: t("demoData.resetError", "Erro ao remover dados"),
        description: t("demoData.resetErrorDescription", "Ocorreu um erro ao remover os dados de demonstração. Tente novamente."),
      });
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setResetOpen(false);
        setProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Database className="mr-2 h-5 w-5 text-muted-foreground" />
            {t("demoData.title", "Dados de demonstração")}
          </CardTitle>
          <CardDescription>
            {t("demoData.description", "Carregue dados fictícios para demonstração ou remova-os quando necessário.")}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                  <Database className="mr-2 h-4 w-4" />
                  {t("demoData.load", "Carregar dados de demonstração")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {t("demoData.loadTitle", "Carregar dados de demonstração")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("demoData.loadDescription", "Selecione quais tipos de dados fictícios você deseja gerar para demonstração.")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <p>{t("demoData.generating", "Gerando dados de demonstração...")}</p>
                      </div>
                      <Progress value={progress} className="h-2 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="properties"
                          checked={loadOptions.properties}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              properties: !!checked,
                            })
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="properties"
                            className="text-sm font-medium leading-none"
                          >
                            {t("demoData.properties", "Propriedades")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("demoData.propertiesDesc", "Novas propriedades com dados detalhados.")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="owners"
                          checked={loadOptions.owners}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              owners: !!checked,
                            })
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="owners"
                            className="text-sm font-medium leading-none"
                          >
                            {t("demoData.owners", "Proprietários")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("demoData.ownersDesc", "Proprietários fictícios com contatos.")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="reservations"
                          checked={loadOptions.reservations}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              reservations: !!checked,
                            })
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="reservations"
                            className="text-sm font-medium leading-none"
                          >
                            {t("demoData.reservations", "Reservas")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("demoData.reservationsDesc", "Histórico e reservas futuras para propriedades.")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="activities"
                          checked={loadOptions.activities}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              activities: !!checked,
                            })
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="activities"
                            className="text-sm font-medium leading-none"
                          >
                            {t("demoData.activities", "Atividades")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("demoData.activitiesDesc", "Registro de atividades e eventos no sistema.")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="financialDocuments"
                          checked={loadOptions.financialDocuments}
                          onCheckedChange={(checked) =>
                            setLoadOptions({
                              ...loadOptions,
                              financialDocuments: !!checked,
                            })
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="financialDocuments"
                            className="text-sm font-medium leading-none"
                          >
                            {t("demoData.financialDocs", "Documentos Financeiros")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("demoData.financialDocsDesc", "Faturas, pagamentos e outros documentos financeiros.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                    {t("common.cancel", "Cancelar")}
                  </Button>
                  <Button type="submit" onClick={loadDemoData} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.loading", "Carregando...")}
                      </>
                    ) : (
                      t("common.confirm", "Confirmar")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("demoData.reset", "Resetar dados de demonstração")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t("demoData.resetTitle", "Resetar dados de demonstração")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("demoData.resetWarning", "Esta ação removerá todos os dados de demonstração gerados. Dados reais não serão afetados.")}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                        <p>{t("demoData.resetting", "Removendo dados de demonstração...")}</p>
                      </div>
                      <Progress value={progress} className="h-2 w-full" />
                    </div>
                  ) : (
                    <div className="flex p-3 bg-red-50 rounded-md">
                      <Info className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <p className="text-sm text-red-800">
                        {t("demoData.resetInfo", "Todos os dados marcados como demonstração serão removidos do sistema. Esta ação não pode ser desfeita.")}
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetOpen(false)} disabled={isLoading}>
                    {t("common.cancel", "Cancelar")}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={resetDemoData} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.loading", "Carregando...")}
                      </>
                    ) : (
                      t("demoData.confirmReset", "Sim, resetar dados")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 rounded-b-lg">
          <div className="flex items-center text-sm text-muted-foreground">
            <Info className="h-4 w-4 mr-2" />
            {t("demoData.footer", "Os dados de demonstração são usados apenas para visualização e podem ser removidos a qualquer momento.")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}