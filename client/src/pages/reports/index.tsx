import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { PageWithInspiration } from "@/components/layout/page-with-inspiration";
import { StatsCardWithQuote } from "@/components/ui/stats-card-with-quote";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency, calculateOccupancyColor } from "@/lib/utils";
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth } from "date-fns";
import { Download, FileText, Home, Users, Briefcase, ClipboardCheck } from "lucide-react";

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

// Interface para representar os dados de estatísticas gerais
interface Statistics {
  totalRevenue: number;
  netProfit: number;
  occupancyRate: number;
  reservationsCount: number;
  topProperties: PropertyStatistics[];
}

// Interface para representar os dados de estatísticas de propriedades
interface PropertyStatistics {
  id: number;
  name: string;
  occupancyRate: number;
  profit: number;
  totalRevenue: number;
  totalCosts: number;
  reservationsCount: number;
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
  const { data: statistics, isLoading: isLoadingStats } = useQuery<Statistics>({
    queryKey: ["/api/statistics", selectedDateRange.startDate, selectedDateRange.endDate],
  });
  
  // Fetch properties
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  
  // Fetch property statistics if a specific property is selected
  const { data: propertyStats, isLoading: isLoadingPropertyStats } = useQuery<PropertyStatistics>({
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
  const topPropertiesData = (statistics?.topProperties || []) as PropertyStatistics[];
  
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
    <PageWithInspiration context="reports" quotePosition="before" rotating={true}>
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
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="general" className="flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{t("reports.overview", "Visão Geral")}</span>
          </TabsTrigger>
          <TabsTrigger value="owner" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{t("reports.owner", "Proprietário")}</span>
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">{t("reports.operational", "Operacional")}</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Conteúdo de Visão Geral */}
        <TabsContent value="general" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{t("reports.overviewReport", "Relatório Geral")}</h3>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t("reports.exportReport", "Exportar Relatório")}
            </Button>
          </div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCardWithQuote
              title={t("reports.totalRevenue", "Receita Total")}
              quoteContext="finance"
            >
              {isLoadingStats ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="text-3xl font-bold">
                  {formatCurrency(statistics?.totalRevenue || 0)}
                </div>
              )}
            </StatsCardWithQuote>
            
            <StatsCardWithQuote
              title={t("reports.totalExpenses", "Despesas Totais")}
              quoteContext="finance"
            >
              {isLoadingStats ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(statistics?.totalRevenue ? statistics.totalRevenue - statistics.netProfit : 0)}
                </div>
              )}
            </StatsCardWithQuote>
            
            <StatsCardWithQuote
              title={t("reports.netProfit", "Lucro Líquido")}
              quoteContext="finance"
            >
              {isLoadingStats ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(statistics?.netProfit || 0)}
                </div>
              )}
            </StatsCardWithQuote>
            
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

          {/* Charts - Primary Insights */}
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
                      <Tooltip formatter={(value: ValueType) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Detalhamento de Receitas */}
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.revenueBreakdown", "Detalhamento de Receitas")}</CardTitle>
                <CardDescription>Distribuição das fontes de receita</CardDescription>
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
                        data={[
                          { name: t("reports.fixedPaymentIncome", "Pagamentos Fixos"), value: 450 },
                          { name: t("reports.commissionIncome", "Comissões"), value: 430 },
                          { name: t("reports.checkInFeesIncome", "Taxas de Check-in"), value: 160 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#4ade80" /> {/* Verde para pagamentos fixos */}
                        <Cell fill="#60a5fa" /> {/* Azul para comissões */}
                        <Cell fill="#f97316" /> {/* Laranja para taxas de check-in */}
                      </Pie>
                      <Tooltip formatter={(value: ValueType) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts - Secondary Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalhamento de Despesas */}
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.expensesBreakdown", "Detalhamento de Despesas")}</CardTitle>
                <CardDescription>Distribuição dos custos operacionais</CardDescription>
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
                        data={[
                          { name: t("reports.cleaningExpenses", "Limpeza"), value: 280 },
                          { name: t("reports.maintenanceExpenses", "Manutenção"), value: 120 },
                          { name: t("reports.suppliesExpenses", "Suprimentos"), value: 80 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#f43f5e" /> {/* Vermelho para despesas de limpeza */}
                        <Cell fill="#a78bfa" /> {/* Roxo para manutenção */}
                        <Cell fill="#fbbf24" /> {/* Amarelo para suprimentos */}
                      </Pie>
                      <Tooltip formatter={(value: ValueType) => formatCurrency(Number(value))} />
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
                        <p className="text-lg font-bold text-green-600">{formatCurrency(propertyStats.profit)}</p>
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
                      <Tooltip formatter={(value: ValueType) => formatCurrency(Number(value))} />
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
      </Tabs>
    </PageWithInspiration>
  );
}