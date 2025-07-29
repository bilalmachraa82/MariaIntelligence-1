import { useState } from "react";
import { motion } from "@/lib/motion-fallback";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { generateAllDemoData, findAndRemoveDemoEntities } from "@/lib/demo-data-service";

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
import { Switch } from "@/components/ui/switch";

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
  Activity
} from "lucide-react";

export function DemoDataManager() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
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
      const result = await generateAllDemoData(loadOptions);
      
      // Completar o progresso
      clearInterval(progressTimer);
      setProgress(100);
      
      if (result.success) {
        // Feedback de sucesso
        toast({
          title: t("demoData.success", "Dados de demonstração carregados"),
          description: t(
            "demoData.successDescription", 
            `Foram criados: ${result.counts.owners} proprietários, ${result.counts.properties} propriedades, ${result.counts.reservations} reservas e ${result.counts.activities} atividades.`
          ),
        });
        
        // Atualizar dados em cache
        await queryClient.invalidateQueries({
          predicate: () => true, // Invalidar todas as queries
        });
      } else {
        toast({
          variant: "destructive",
          title: t("demoData.error", "Erro ao carregar dados"),
          description: t("demoData.errorDescription", "Ocorreu um erro ao gerar os dados de demonstração. Tente novamente."),
        });
      }
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

  // Remover dados de demonstração
  const handleRemoveDemoData = async () => {
    setIsRemoving(true);
    setProgress(0);
    
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
      const result = await findAndRemoveDemoEntities();
      
      // Completar o progresso
      clearInterval(progressTimer);
      setProgress(100);
      
      if (result.success) {
        const { removed } = result;
        const totalRemoved = removed.owners + removed.properties + removed.reservations + removed.activities;
        
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
        toast({
          variant: "destructive",
          title: t("demoData.resetError", "Erro ao remover dados"),
          description: t("demoData.resetErrorDescription", "Ocorreu um erro ao remover os dados de demonstração. Tente novamente."),
        });
      }
    } catch (error) {
      console.error("Erro ao remover dados de demonstração:", error);
      toast({
        variant: "destructive",
        title: t("demoData.resetError", "Erro ao remover dados"),
        description: t("demoData.resetErrorDescription", "Ocorreu um erro ao remover os dados de demonstração. Tente novamente."),
      });
    } finally {
      setTimeout(() => {
        setIsRemoving(false);
        setResetOpen(false);
        setProgress(0);
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <Card className="bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-xl flex items-center">
            <Database className="mr-2 h-5 w-5 text-blue-500" />
            {t("demoData.title", "Dados de demonstração")}
          </CardTitle>
          <CardDescription>
            {t("demoData.description", "Carregue dados fictícios para visualizar as funcionalidades do dashboard.")}
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
                    {t("demoData.loadDescription", "Selecione quais tipos de dados você deseja gerar para visualização.")}
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
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-md bg-blue-100">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label>{t("demoData.owners", "Proprietários")}</Label>
                            <Switch
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
                            <Label>{t("demoData.properties", "Propriedades")}</Label>
                            <Switch
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
                            <Label>{t("demoData.reservations", "Reservas")}</Label>
                            <Switch
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
                            <Label>{t("demoData.activities", "Atividades")}</Label>
                            <Switch
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
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                    {t("common.cancel", "Cancelar")}
                  </Button>
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
                  {t("demoData.reset", "Remover dados de demonstração")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {t("demoData.resetTitle", "Remover dados de demonstração")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("demoData.resetWarning", "Esta ação removerá todos os dados marcados como demonstração. Dados reais não serão afetados.")}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  {isRemoving ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                        <p>{t("demoData.resetting", "Removendo dados de demonstração...")}</p>
                      </div>
                      <Progress value={progress} className="h-2 w-full" />
                    </div>
                  ) : (
                    <div className="flex p-3 bg-red-50 rounded-md">
                      <Info className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">
                        {t("demoData.resetInfo", "Todos os dados marcados como demonstração serão removidos permanentemente. Esta ação não pode ser desfeita.")}
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetOpen(false)} disabled={isRemoving}>
                    {t("common.cancel", "Cancelar")}
                  </Button>
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
                      t("demoData.confirmReset", "Sim, remover dados")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 rounded-b-lg border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Info className="h-4 w-4 mr-2 flex-shrink-0" />
            {t("demoData.footer", "Os dados de demonstração são identificados com [DEMO] e não afetam os dados reais.")}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}