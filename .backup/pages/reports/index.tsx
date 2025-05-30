import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatCurrency, calculateOccupancyColor } from "@/lib/utils";
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth } from "date-fns";
import { Download, FileText, Home, Users, Briefcase, ClipboardCheck } from "lucide-react";

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const dateRanges: DateRange[] = [
  {
    label: "Últimos 30 dias",
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Mês atual",
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Mês anterior",
    startDate: format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
    endDate: format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
  },
  {
    label: "Últimos 3 meses",
    startDate: format(subMonths(new Date(), 3), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Ano atual",
    startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Ano anterior",
    startDate: format(new Date(new Date().getFullYear() - 1, 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().getFullYear() - 1, 11, 31), "yyyy-MM-dd"),
  },
];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<string>("general");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(dateRanges[0]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  
  // Fetch statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics", selectedDateRange.startDate, selectedDateRange.endDate],
  });
  
  // Fetch properties
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  
  // Fetch property statistics if a specific property is selected
  const { data: propertyStats, isLoading: isLoadingPropertyStats } = useQuery({
    queryKey: ["/api/statistics/property", selectedPropertyId !== "all" ? parseInt(selectedPropertyId) : undefined],
    enabled: selectedPropertyId !== "all",
  });

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    const selectedRange = dateRanges.find(range => range.label === value);
    if (selectedRange) {
      setSelectedDateRange(selectedRange);
    }
  };

  // Handle property change
  const handlePropertyChange = (value: string) => {
    setSelectedPropertyId(value);
  };

  // Prepare chart data for top properties
  const topPropertiesData = statistics?.topProperties || [];
  
  // Prepare data for pie chart
  const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  
  const pieChartData = [
    { name: t("reports.revenue", "Receita"), value: statistics?.totalRevenue || 0 },
    { name: t("reports.operationalCosts", "Custos Operacionais"), value: statistics?.totalRevenue ? statistics.totalRevenue - statistics.netProfit : 0 }
  ];

  // Prepare occupation data for selected property
  const occupancyData = [
    { name: t("reports.occupied", "Ocupado"), value: propertyStats?.occupancyRate || 0 },
    { name: t("reports.available", "Disponível"), value: 100 - (propertyStats?.occupancyRate || 0) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">{t("reports.title", "Relatórios")}</h2>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex gap-3 w-full">
            <Select 
              value={selectedDateRange.label} 
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("reports.period", "Período")} />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range.label} value={range.label}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedPropertyId} 
              onValueChange={handlePropertyChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("reports.property", "Propriedade")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("reports.allProperties", "Todas as propriedades")}</SelectItem>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              {t("reports.exportReport", "Exportar Relatório")}
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="general" className="flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{t("reports.general", "Geral")}</span>
          </TabsTrigger>
          <TabsTrigger value="owner" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{t("reports.owner", "Proprietário")}</span>
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{t("reports.operational", "Operacional")}</span>
          </TabsTrigger>
          <TabsTrigger value="cleaningTeams" className="flex items-center">
            <Home className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{t("reports.cleaningTeams", "Equipas de Limpeza")}</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Conteúdo de Relatório Geral */}
        <TabsContent value="general" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {formatCurrency(statistics?.totalRevenue || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Lucro Líquido</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(statistics?.netProfit || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Taxa de Ocupação</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {Math.round(statistics?.occupancyRate || 0)}%
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {statistics?.reservationsCount || 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Profit */}
            <Card>
              <CardHeader>
                <CardTitle>Receita vs Lucro</CardTitle>
                <CardDescription>Análise comparativa de receita e lucro</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoadingStats ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Propriedades com Maior Desempenho</CardTitle>
                <CardDescription>
                  {selectedPropertyId === "all" 
                    ? "Taxa de ocupação e rentabilidade das propriedades" 
                    : "Detalhes da propriedade selecionada"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {(isLoadingStats && selectedPropertyId === "all") || 
                 (isLoadingPropertyStats && selectedPropertyId !== "all") ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : selectedPropertyId === "all" ? (
                  topPropertiesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topPropertiesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="occupancyRate" name="Ocupação (%)" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="profit" name="Lucro (€)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-secondary-500">Não há dados disponíveis.</p>
                    </div>
                  )
                ) : propertyStats ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={occupancyData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}%`}
                          >
                            <Cell fill="#0ea5e9" />
                            <Cell fill="#e2e8f0" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="pt-4 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-sm text-secondary-500">Receita Total</p>
                        <p className="text-lg font-bold">{formatCurrency(propertyStats.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Lucro Líquido</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(propertyStats.netProfit)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Custos Totais</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(propertyStats.totalCosts)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Reservas</p>
                        <p className="text-lg font-bold">{propertyStats.reservationsCount}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-secondary-500">Não há dados disponíveis para esta propriedade.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property Occupancy */}
          {selectedPropertyId === "all" && (
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Ocupação por Propriedade</CardTitle>
                <CardDescription>Análise detalhada da ocupação de cada propriedade</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center">
                        <Skeleton className="h-4 w-36" />
                        <div className="flex-1 mx-2">
                          <Skeleton className="h-2 w-full" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : topPropertiesData.length > 0 ? (
                  <div className="space-y-3">
                    {topPropertiesData.map((property) => (
                      <div key={property.id} className="flex items-center">
                        <span className="text-sm font-medium text-secondary-900 w-36 truncate">{property.name}</span>
                        <div className="flex-1 mx-2">
                          <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-2 ${calculateOccupancyColor(property.occupancyRate)} rounded-full`} 
                              style={{ width: `${property.occupancyRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-secondary-900">{Math.round(property.occupancyRate)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-secondary-500 py-4">
                    Sem dados de ocupação disponíveis
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Relatório de Proprietário */}
        <TabsContent value="owner" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t("reports.ownerReport", "Relatório de Proprietário")}</h3>
            <Button variant="outline" asChild>
              <Link href="/reports/owner-report" className="inline-flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                {t("reports.viewFullReport", "Ver relatório completo")}
              </Link>
            </Button>
          </div>
          
          {/* Prévia do relatório de proprietário */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Proprietários por Receita</CardTitle>
                <CardDescription>Baseado no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Proprietário</span>
                      <span className="font-medium">Receita Total</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>José Gustavo</span>
                      <span className="font-medium">{formatCurrency(1200)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Ana Oliveira</span>
                      <span className="font-medium">{formatCurrency(970)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pedro Santos</span>
                      <span className="font-medium">{formatCurrency(300)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Visão Geral de Pagamentos</CardTitle>
                <CardDescription>Distribuição de receitas e custos</CardDescription>
              </CardHeader>
              <CardContent className="h-48">
                {isLoadingStats ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Valor para proprietários", value: 1600 },
                          { name: "Comissão Maria Faz", value: 430 },
                          { name: "Custos de limpeza", value: 280 },
                          { name: "Taxas de check-in", value: 160 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                        }
                      >
                        <Cell fill="#0ea5e9" />
                        <Cell fill="#10b981" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Desempenho de Propriedades por Proprietário</CardTitle>
                <CardDescription>Taxa de ocupação por proprietário</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <div className="flex items-center">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">José Gustavo</span>
                        <span>73%</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: "73%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Ana Oliveira</span>
                        <span>64%</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: "64%" }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">Pedro Santos</span>
                        <span>42%</span>
                      </div>
                      <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: "42%" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Relatório Operacional */}
        <TabsContent value="operational" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t("reports.operationalReport", "Relatório Operacional")}</h3>
            <div className="flex gap-2">
              <Select defaultValue="today">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="tomorrow">Amanhã</SelectItem>
                  <SelectItem value="thisWeek">Esta semana</SelectItem>
                  <SelectItem value="nextWeek">Próxima semana</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Check-ins de Hoje</CardTitle>
                <CardDescription>Entradas programadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-2xl">3</span>
                    <span className="text-muted-foreground">Previstos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 bg-green-500 rounded-full w-2/3" />
                    <div className="h-2 bg-secondary-200 rounded-full w-1/3" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>2 Concluídos</span>
                    <span>1 Pendente</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Check-outs de Hoje</CardTitle>
                <CardDescription>Saídas programadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-2xl">4</span>
                    <span className="text-muted-foreground">Previstos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 bg-blue-500 rounded-full w-3/4" />
                    <div className="h-2 bg-secondary-200 rounded-full w-1/4" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>3 Concluídos</span>
                    <span>1 Pendente</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Limpezas de Hoje</CardTitle>
                <CardDescription>Limpezas agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-2xl">5</span>
                    <span className="text-muted-foreground">Agendadas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 bg-purple-500 rounded-full w-3/5" />
                    <div className="h-2 bg-secondary-200 rounded-full w-2/5" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>3 Concluídas</span>
                    <span>2 Pendentes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Programação de Atividades</CardTitle>
              <CardDescription>Próximos check-ins, check-outs e limpezas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Hoje, {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</h4>
                  
                  <div className="relative pl-6 border-l border-dashed border-secondary-200 pb-4">
                    <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-green-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Check-in: Apartamento Ajuda</p>
                        <p className="text-sm text-muted-foreground">Maria Silva (2 adultos, 1 criança)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">14:00</p>
                        <p className="text-sm text-green-600">Confirmado</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative pl-6 border-l border-dashed border-secondary-200 pb-4">
                    <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-blue-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Check-out: Apartamento Belém</p>
                        <p className="text-sm text-muted-foreground">Carlos Mendes (2 adultos)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">11:00</p>
                        <p className="text-sm text-blue-600">Concluído</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative pl-6 border-l border-dashed border-secondary-200">
                    <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-purple-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Limpeza: Apartamento Belém</p>
                        <p className="text-sm text-muted-foreground">Equipa Limpezas Express</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">12:30</p>
                        <p className="text-sm text-purple-600">Em andamento</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Amanhã, {new Date(Date.now() + 86400000).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</h4>
                  
                  <div className="relative pl-6 border-l border-dashed border-secondary-200 pb-4">
                    <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-green-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Check-in: Apartamento Cascais</p>
                        <p className="text-sm text-muted-foreground">João Pereira (2 adultos)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">15:00</p>
                        <p className="text-sm text-yellow-600">Pendente</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative pl-6 border-l border-dashed border-secondary-200">
                    <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-purple-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Limpeza: Apartamento Alfama</p>
                        <p className="text-sm text-muted-foreground">Equipa CleanHome</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">10:00</p>
                        <p className="text-sm text-yellow-600">Pendente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Relatório de Equipes de Limpeza */}
        <TabsContent value="cleaningTeams" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t("reports.cleaningTeamsReport", "Relatório de Equipas de Limpeza")}</h3>
            <div className="flex gap-2">
              <Select defaultValue="thisMonth">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">Este mês</SelectItem>
                  <SelectItem value="lastMonth">Mês anterior</SelectItem>
                  <SelectItem value="lastThreeMonths">Últimos 3 meses</SelectItem>
                  <SelectItem value="thisYear">Este ano</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
          
          {/* Estatísticas de desempenho */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total de Limpezas</CardTitle>
                <CardDescription>Este mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">87</div>
                <p className="text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  12% vs mês anterior
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Média de Avaliação</CardTitle>
                <CardDescription>Todas as equipas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">4.6</div>
                <div className="flex text-yellow-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipPath="inset(0 40% 0 0)"></path>
                  </svg>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Pago</CardTitle>
                <CardDescription>Este mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(4320)}</div>
                <p className="text-sm text-muted-foreground">
                  Média: {formatCurrency(49.66)} por limpeza
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Limpezas Pendentes</CardTitle>
                <CardDescription>Nos próximos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">18</div>
                <p className="text-sm text-orange-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  5% vs semana anterior
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Desempenho por equipe */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desempenho por Equipa</CardTitle>
              <CardDescription>Classificação e métricas de desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium py-2 pl-2">Equipa</th>
                        <th className="text-center font-medium py-2">Limpezas</th>
                        <th className="text-center font-medium py-2">Avaliação</th>
                        <th className="text-center font-medium py-2">Tempo Médio</th>
                        <th className="text-center font-medium py-2">Valor Pago</th>
                        <th className="text-center font-medium py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 pl-2">
                          <div className="font-medium">Maria Faz</div>
                          <div className="text-xs text-muted-foreground">6 membros</div>
                        </td>
                        <td className="text-center py-3">32</td>
                        <td className="text-center py-3">
                          <div className="flex justify-center text-yellow-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="ml-1">4.8</span>
                          </div>
                        </td>
                        <td className="text-center py-3">2h 15m</td>
                        <td className="text-center py-3">{formatCurrency(1600)}</td>
                        <td className="text-center py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 pl-2">
                          <div className="font-medium">Cristina</div>
                          <div className="text-xs text-muted-foreground">4 membros</div>
                        </td>
                        <td className="text-center py-3">28</td>
                        <td className="text-center py-3">
                          <div className="flex justify-center text-yellow-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="ml-1">4.5</span>
                          </div>
                        </td>
                        <td className="text-center py-3">1h 58m</td>
                        <td className="text-center py-3">{formatCurrency(1340)}</td>
                        <td className="text-center py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 pl-2">
                          <div className="font-medium">Primavera</div>
                          <div className="text-xs text-muted-foreground">5 membros</div>
                        </td>
                        <td className="text-center py-3">19</td>
                        <td className="text-center py-3">
                          <div className="flex justify-center text-yellow-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="ml-1">4.3</span>
                          </div>
                        </td>
                        <td className="text-center py-3">2h 25m</td>
                        <td className="text-center py-3">{formatCurrency(950)}</td>
                        <td className="text-center py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 pl-2">
                          <div className="font-medium">Home Deluxe</div>
                          <div className="text-xs text-muted-foreground">3 membros</div>
                        </td>
                        <td className="text-center py-3">8</td>
                        <td className="text-center py-3">
                          <div className="flex justify-center text-yellow-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="ml-1">4.7</span>
                          </div>
                        </td>
                        <td className="text-center py-3">2h 05m</td>
                        <td className="text-center py-3">{formatCurrency(430)}</td>
                        <td className="text-center py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de tendências */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Tendências de Pagamentos</CardTitle>
                  <CardDescription>Histórico de pagamentos às equipas nos últimos 6 meses</CardDescription>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Equipa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as equipas</SelectItem>
                    <SelectItem value="1">Maria Faz</SelectItem>
                    <SelectItem value="2">Cristina</SelectItem>
                    <SelectItem value="3">Primavera</SelectItem>
                    <SelectItem value="4">Maria João</SelectItem>
                    <SelectItem value="5">Home Deluxe</SelectItem>
                    <SelectItem value="6">Setubal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { month: 'Jan', amount: 2850 },
                    { month: 'Fev', amount: 3250 },
                    { month: 'Mar', amount: 3450 },
                    { month: 'Abr', amount: 3750 },
                    { month: 'Mai', amount: 4100 },
                    { month: 'Jun', amount: 4320 }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip formatter={(value) => [`${formatCurrency(value)}`, 'Valor Pago']} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" name="Valor Pago" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}