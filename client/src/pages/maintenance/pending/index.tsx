import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, ClipboardList, ArrowRight, Calendar, Building2, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceTask } from "@shared/schema";
import { useMaintenanceTasks } from "@/hooks/use-maintenance-tasks";
import { useProperties } from "@/hooks/use-properties";

// Estender o tipo MaintenanceTask para incluir propertyName
interface ExtendedMaintenanceTask extends MaintenanceTask {
  propertyName: string;
}

export default function MaintenancePending() {
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  // Usar o hook de tarefas de manutenção
  const { maintenanceTasks: tasks = [], isLoading } = useMaintenanceTasks();
  const { properties = [] } = useProperties();
  
  // Adicionar nomes de propriedades às tarefas
  const maintenanceTasks: ExtendedMaintenanceTask[] = tasks.map(task => {
    const property = properties.find((p) => p.id === task.propertyId);
    return {
      ...task,
      propertyName: property ? property.name : `Propriedade #${task.propertyId}`,
    };
  });
  
  // Contadores de tarefas por status
  const pendingCount = maintenanceTasks.filter(task => task.status === "pending").length;
  const scheduledCount = maintenanceTasks.filter(task => task.status === "scheduled").length;
  
  // Função para determinar a cor do badge baseado na prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300";
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };
  
  // Função para traduzir a prioridade para PT
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return t("maintenance.priority.high", "Alta");
      case "medium":
        return t("maintenance.priority.medium", "Média");
      case "low":
        return t("maintenance.priority.low", "Baixa");
      default:
        return priority;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas de Manutenção</h1>
          <p className="text-maria-gray">Gerenciamento de todas as tarefas de manutenção pendentes</p>
        </div>
        <Link href="/manutencao/solicitacao">
          <Button className="mt-4 md:mt-0 bg-maria-primary hover:bg-maria-primary/90 text-white">
            <ClipboardList className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="all" className="mt-4" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas ({maintenanceTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingCount})</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas ({scheduledCount})</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : maintenanceTasks.length === 0 ? (
          <div className="py-20 text-center">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium">{t("maintenance.noTasks", "Sem tarefas de manutenção")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("maintenance.createFirst", "Crie sua primeira tarefa de manutenção para começar")}
            </p>
            <Button 
              onClick={() => setLocation("/manutencao/solicitacao")}
              className="mt-6 bg-maria-primary hover:bg-maria-primary/90 text-white"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              {t("maintenance.newRequest", "Nova Solicitação")}
            </Button>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              {maintenanceTasks.map(task => (
                <Card key={task.id} className="maintenance-card overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-maria-primary" />
                          {task.propertyName}
                        </CardTitle>
                        <CardDescription>
                          Reportado em {new Date(task.reportedAt).toLocaleDateString('pt-PT')}
                        </CardDescription>
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityText(task.priority)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 text-sm font-medium">{task.description}</p>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 text-xs text-maria-gray">
                      <div className="flex items-center mb-2 md:mb-0">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>Data limite: {new Date(task.dueDate).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <div>
                        {task.assignedTo ? (
                          <span>Atribuído a: {task.assignedTo}</span>
                        ) : (
                          <span className="flex items-center text-amber-600">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Não atribuído
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" className="mr-2">
                        Atribuir
                      </Button>
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Gerenciar
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              {maintenanceTasks.filter(task => task.status === "pending").map(task => (
                <Card key={task.id} className="maintenance-card overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-maria-primary" />
                          {task.propertyName}
                        </CardTitle>
                        <CardDescription>
                          Reportado em {new Date(task.reportedAt).toLocaleDateString('pt-PT')}
                        </CardDescription>
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityText(task.priority)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 text-sm font-medium">{task.description}</p>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 text-xs text-maria-gray">
                      <div className="flex items-center mb-2 md:mb-0">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>Data limite: {new Date(task.dueDate).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <div>
                        {task.assignedTo ? (
                          <span>Atribuído a: {task.assignedTo}</span>
                        ) : (
                          <span className="flex items-center text-amber-600">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Não atribuído
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" className="mr-2">
                        Atribuir
                      </Button>
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Gerenciar
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="scheduled" className="space-y-4">
              {maintenanceTasks.filter(task => task.status === "scheduled").map(task => (
                <Card key={task.id} className="maintenance-card overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Building2 className="mr-2 h-4 w-4 text-maria-primary" />
                          {task.propertyName}
                        </CardTitle>
                        <CardDescription>
                          Reportado em {new Date(task.reportedAt).toLocaleDateString('pt-PT')}
                        </CardDescription>
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityText(task.priority)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 text-sm font-medium">{task.description}</p>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 text-xs text-maria-gray">
                      <div className="flex items-center mb-2 md:mb-0">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>Data limite: {new Date(task.dueDate).toLocaleDateString('pt-PT')}</span>
                      </div>
                      <div>
                        {task.assignedTo ? (
                          <span>Atribuído a: {task.assignedTo}</span>
                        ) : (
                          <span className="flex items-center text-amber-600">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Não atribuído
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" size="sm" className="mr-2">
                        Reagendar
                      </Button>
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Gerenciar
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}