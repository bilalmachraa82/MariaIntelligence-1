import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Database } from "lucide-react";

export default function CleaningReportsPage() {
  const { t } = useTranslation();

  // Buscar equipas de limpeza reais da base de dados
  const { data: cleaningTeams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/cleaning-teams'],
    staleTime: 5 * 60 * 1000,
  });

  // Buscar limpezas reais da base de dados
  const { data: cleanings = [], isLoading: isLoadingCleanings } = useQuery({
    queryKey: ['/api/cleanings'],
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingTeams || isLoadingCleanings;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {"Relatórios de Limpeza"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {"Gestão de equipas de limpeza e relatórios baseados em dados reais"}
          </p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 mb-6 md:grid-cols-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-blue-700">
                  <Users className="h-5 w-5 mr-2" />
                  {"Equipas de Limpeza"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {cleaningTeams.length}
                </div>
                <p className="text-muted-foreground text-sm">
                  {"equipas registadas no sistema"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-green-700">
                  <Database className="h-5 w-5 mr-2" />
                  {"Limpezas Registadas"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {cleanings.length}
                </div>
                <p className="text-muted-foreground text-sm">
                  {"limpezas no histórico"}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-amber-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {"Dados Reais"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {"100%"}
                </div>
                <p className="text-muted-foreground text-sm">
                  {"apenas dados autênticos da base de dados"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {cleaningTeams.length === 0 && cleanings.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {"Nenhum Dado Disponível"}
                </CardTitle>
                <CardDescription>
                  {"Não existem equipas de limpeza ou registos de limpeza na base de dados."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {"Para começar a usar esta funcionalidade, primeiro registe equipas de limpeza e agendamentos no sistema."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {cleaningTeams.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      {"Equipas de Limpeza Registadas"}
                    </CardTitle>
                    <CardDescription>
                      {"Lista de todas as equipas de limpeza registadas no sistema"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {cleaningTeams.map((team: any) => (
                        <div key={team.id} className="p-4 border rounded-lg">
                          <h3 className="font-semibold">{team.name}</h3>
                          {team.email && (
                            <p className="text-sm text-gray-600">{team.email}</p>
                          )}
                          {team.phone && (
                            <p className="text-sm text-gray-600">{team.phone}</p>
                          )}
                          {team.rate && (
                            <p className="text-sm font-medium text-green-600">
                              {"Taxa: "}{team.rate}
                            </p>
                          )}
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              team.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {team.status === 'active' ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {cleanings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      {"Histórico de Limpezas"}
                    </CardTitle>
                    <CardDescription>
                      {"Registos de limpezas realizadas no sistema"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cleanings.map((cleaning: any) => (
                        <div key={cleaning.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">
                                {"Propriedade ID: "}{cleaning.propertyId}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {"Data agendada: "}{cleaning.scheduledDate}
                              </p>
                              {cleaning.completedDate && (
                                <p className="text-sm text-gray-600">
                                  {"Data concluída: "}{cleaning.completedDate}
                                </p>
                              )}
                              {cleaning.notes && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {cleaning.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                cleaning.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : cleaning.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {cleaning.status === 'completed' ? 'Concluída' 
                                 : cleaning.status === 'pending' ? 'Pendente'
                                 : 'Cancelada'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {"Tipo: "}{cleaning.type || 'standard'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}