import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Info, Edit, Trash2, Search, Star, FileCheck } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CleaningTeamsPage() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const isPortuguese = i18n.language?.startsWith("pt");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dados simulados de equipes de limpeza
  const teams = [
    { 
      id: 1, 
      name: "Equipa Lisboa Centro", 
      manager: "Ana Silva",
      members: 3, 
      phone: "+351 912 345 678",
      email: "lisboa.centro@mariafaz.pt",
      rating: 4.8,
      status: "active",
      completedCleanings: 245,
      propertiesCount: 12
    },
    { 
      id: 2, 
      name: "Equipa Porto", 
      manager: "Miguel Costa",
      members: 4, 
      phone: "+351 922 345 678",
      email: "porto@mariafaz.pt",
      rating: 4.6,
      status: "active",
      completedCleanings: 187,
      propertiesCount: 8
    },
    { 
      id: 3, 
      name: "Equipa Algarve", 
      manager: "Carla Santos",
      members: 5, 
      phone: "+351 932 345 678",
      email: "algarve@mariafaz.pt",
      rating: 4.9,
      status: "active",
      completedCleanings: 320,
      propertiesCount: 15
    },
    { 
      id: 4, 
      name: "Equipa Lisboa Norte", 
      manager: "José Pereira",
      members: 2, 
      phone: "+351 962 345 678",
      email: "lisboa.norte@mariafaz.pt",
      rating: 4.5,
      status: "inactive",
      completedCleanings: 78,
      propertiesCount: 4
    },
  ];
  
  // Filtra as equipes com base no termo de pesquisa
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Dados simulados de eficiência das equipes
  const teamEfficiency = [
    { teamId: 1, month: "Janeiro", score: 98 },
    { teamId: 1, month: "Fevereiro", score: 97 },
    { teamId: 1, month: "Março", score: 99 },
    { teamId: 2, month: "Janeiro", score: 95 },
    { teamId: 2, month: "Fevereiro", score: 94 },
    { teamId: 2, month: "Março", score: 96 },
    { teamId: 3, month: "Janeiro", score: 99 },
    { teamId: 3, month: "Fevereiro", score: 99 },
    { teamId: 3, month: "Março", score: 100 },
    { teamId: 4, month: "Janeiro", score: 92 },
    { teamId: 4, month: "Fevereiro", score: 90 },
    { teamId: 4, month: "Março", score: 93 },
  ];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("cleaningTeams.title", "Equipas de Limpeza")}</h1>
        <Button onClick={() => navigate(isPortuguese ? "/equipas-limpeza/nova" : "/cleaning-teams/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("cleaningTeams.addTeam", "Adicionar Equipa")}
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("cleaningTeams.searchPlaceholder", "Pesquisar equipas...")}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">{t("cleaningTeams.teams", "Equipas")}</TabsTrigger>
          <TabsTrigger value="performance">{t("cleaningTeams.performance", "Desempenho")}</TabsTrigger>
          <TabsTrigger value="schedule">{t("cleaningTeams.schedule", "Agendamento")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("cleaningTeams.allTeams", "Todas as Equipas")}</CardTitle>
              <CardDescription>
                {t("cleaningTeams.managementDescription", "Gerencie todas as equipas de limpeza da sua operação.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cleaningTeams.name", "Nome")}</TableHead>
                    <TableHead>{t("cleaningTeams.manager", "Gestor")}</TableHead>
                    <TableHead>{t("cleaningTeams.members", "Membros")}</TableHead>
                    <TableHead>{t("cleaningTeams.contact", "Contacto")}</TableHead>
                    <TableHead>{t("cleaningTeams.rating", "Avaliação")}</TableHead>
                    <TableHead>{t("cleaningTeams.status", "Estado")}</TableHead>
                    <TableHead className="text-right">{t("common.actions", "Ações")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.manager}</TableCell>
                      <TableCell>{team.members}</TableCell>
                      <TableCell>
                        <div>{team.phone}</div>
                        <div className="text-xs text-muted-foreground">{team.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span>{team.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={team.status === "active" ? "success" : "destructive"}
                          className="capitalize"
                        >
                          {team.status === "active" 
                            ? t("cleaningTeams.statusActive", "Ativa") 
                            : t("cleaningTeams.statusInactive", "Inativa")
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(isPortuguese 
                              ? `/equipas-limpeza/${team.id}` 
                              : `/cleaning-teams/${team.id}`
                            )}
                            title={t("common.view", "Ver")}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(isPortuguese 
                              ? `/equipas-limpeza/editar/${team.id}` 
                              : `/cleaning-teams/edit/${team.id}`
                            )}
                            title={t("common.edit", "Editar")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t("common.delete", "Apagar")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teams.filter(team => team.status === "active").map((team) => (
              <Card key={team.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">{team.name}</CardTitle>
                  <CardDescription>{team.manager}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("cleaningTeams.completedCleanings", "Limpezas Concluídas")}:</span>
                      <Badge variant="outline" className="font-mono">
                        <FileCheck className="h-3 w-3 mr-1" />
                        {team.completedCleanings}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("cleaningTeams.properties", "Propriedades")}:</span>
                      <Badge variant="outline" className="font-mono">
                        {team.propertiesCount}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{t("cleaningTeams.efficiency", "Eficiência")}:</span>
                      <Badge variant="outline" className={
                        teamEfficiency.find(e => e.teamId === team.id && e.month === "Março")?.score! >= 98 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : teamEfficiency.find(e => e.teamId === team.id && e.month === "Março")?.score! >= 95 
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                      }>
                        {teamEfficiency.find(e => e.teamId === team.id && e.month === "Março")?.score}%
                      </Badge>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate(isPortuguese 
                      ? `/relatorios-limpeza?equipa=${team.id}` 
                      : `/cleaning-reports?team=${team.id}`
                    )}
                  >
                    {t("cleaningTeams.viewReport", "Ver Relatórios")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("cleaningTeams.schedule", "Agendamento")}</CardTitle>
              <CardDescription>
                {t("cleaningTeams.scheduleDescription", "Visualize e gerencie o agendamento de limpezas.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-12">
                <p className="text-muted-foreground text-center">
                  {t("cleaningTeams.comingSoon", "Em breve: Calendário de agendamento de limpezas")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}