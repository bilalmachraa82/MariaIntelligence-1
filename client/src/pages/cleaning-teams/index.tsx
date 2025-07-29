import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Info, Edit, Trash2, Search, FileCheck, FileText, Users, Phone, User, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Property } from "@shared/schema";

// Interface para os prestadores de serviço de limpeza
interface CleaningServiceProvider {
  id: number;
  name: string;
  nif: string;
  address?: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive";
  completedCleanings: number;
  propertiesCount: number;
}

// Dados reais dos prestadores de serviço
const serviceProviders: CleaningServiceProvider[] = [
  {
    id: 1,
    name: 'ANA CRISTINA PARADA DE ALMEIDA TEIXEIRA',
    nif: '208914560',
    address: 'R FILIPE FOLQUE Nº 12 - 5º ESQº 2810-215 ALMADA',
    email: 'cristinateixeira.fotos@gmail.com',
    phone: '+351 914 123 456',
    status: 'active',
    completedCleanings: 35,
    propertiesCount: 8
  },
  {
    id: 2,
    name: 'MELANIE NEVES CARVALHO PEREIRA',
    nif: '245862021',
    address: 'R MESTRE JOSÉ AGOSTINHO LOTE 16 2450-502 NAZARÉ',
    email: 'homedeluxe.limpezas@gmail.com',
    phone: '+351 920 987 654',
    status: 'active',
    completedCleanings: 42,
    propertiesCount: 12
  },
  {
    id: 3,
    name: 'VERA LUCIA BOTELHO RODRIGUES',
    nif: '214791904',
    address: '8100-118 QUERENÇA',
    email: 'veratiago04082010@gmail.com',
    phone: '+351 936 456 789',
    status: 'active',
    completedCleanings: 28,
    propertiesCount: 7
  },
  {
    id: 4,
    name: 'MARIA FAZ (EQUIPA INTERNA)',
    nif: '999999990',
    address: 'Lisboa',
    email: 'info@mariafaz.pt',
    phone: '+351 910 000 000',
    status: 'active',
    completedCleanings: 153,
    propertiesCount: 18
  }
];

export default function CleaningTeamsPage() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const isPortuguese = i18n.language?.startsWith("pt");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtra os prestadores de serviço com base no termo de pesquisa
  const filteredProviders = serviceProviders.filter(provider => 
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.nif.includes(searchTerm)
  );
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("cleaningTeams.title", "Prestadores de Serviço")}</h1>
        <Button onClick={() => navigate(isPortuguese ? "/equipas-limpeza/nova" : "/cleaning-teams/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("cleaningTeams.addTeam", "Adicionar Prestador")}
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("cleaningTeams.searchPlaceholder", "Pesquisar prestadores...")}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">{t("cleaningTeams.teams", "Prestadores")}</TabsTrigger>
          <TabsTrigger value="schedule">{t("cleaningTeams.schedule", "Agendamento")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("cleaningTeams.allTeams", "Todos os Prestadores")}</CardTitle>
              <CardDescription>
                {t("cleaningTeams.managementDescription", "Gerencie todos os prestadores de serviço da sua operação.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cleaningTeams.name", "Nome")}</TableHead>
                    <TableHead>{t("cleaningTeams.contact", "Contacto")}</TableHead>
                    <TableHead>{t("common.nif", "NIF")}</TableHead>
                    <TableHead>{t("cleaningTeams.status", "Estado")}</TableHead>
                    <TableHead className="text-right">{t("common.actions", "Ações")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>
                        <div>{provider.phone}</div>
                        <div className="text-xs text-muted-foreground">{provider.email}</div>
                      </TableCell>
                      <TableCell>{provider.nif}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={provider.status === "active" ? "outline" : "destructive"}
                          className="capitalize bg-green-50 text-green-700 border-green-200"
                        >
                          {provider.status === "active" 
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
                              ? `/equipas-limpeza/${provider.id}` 
                              : `/cleaning-teams/${provider.id}`
                            )}
                            title={t("common.view", "Ver")}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(isPortuguese 
                              ? `/equipas-limpeza/editar/${provider.id}` 
                              : `/cleaning-teams/edit/${provider.id}`
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
        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("cleaningTeams.schedule", "Agendamento")}</CardTitle>
              <CardDescription>
                {t("cleaningTeams.scheduleDescription", "Visualize e gerencie o agendamento de limpezas.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => navigate(isPortuguese 
                  ? "/equipas-limpeza/agendamentos" 
                  : "/cleaning-teams/schedules"
                )}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                {t("cleaningTeams.viewSchedules", "Ver Agendamentos")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}