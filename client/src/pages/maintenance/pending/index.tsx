import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, ClipboardList, ArrowRight, Calendar, Building2, AlertTriangle } from "lucide-react";

export default function MaintenancePending() {
  const [activeTab, setActiveTab] = useState("all");
  
  // Dados mockup para a interface - em produção viriam da API
  const maintenanceTasks = [
    {
      id: 1,
      propertyName: "Apartamento Ajuda",
      description: "Problema com torneira da cozinha - vazamento",
      priority: "high",
      dueDate: "2025-03-20",
      status: "pending",
      assignedTo: "Técnico João",
      reportedAt: "2025-03-09"
    },
    {
      id: 2,
      propertyName: "Vila SJ Estoril",
      description: "Troca de lâmpadas no corredor",
      priority: "medium", 
      dueDate: "2025-03-25",
      status: "pending",
      assignedTo: null,
      reportedAt: "2025-03-11"
    },
    {
      id: 3,
      propertyName: "Apartamento Cascais",
      description: "Verificação do sistema de ar condicionado",
      priority: "low",
      dueDate: "2025-04-05",
      status: "scheduled",
      assignedTo: "Empresa Clima Perfeito",
      reportedAt: "2025-03-10"
    }
  ];
  
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
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
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
          <TabsTrigger value="pending">Pendentes (2)</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas (1)</TabsTrigger>
        </TabsList>
        
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
      </Tabs>
    </div>
  );
}