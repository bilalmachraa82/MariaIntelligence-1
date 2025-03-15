import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import {
  Card,
  Title,
  Text,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  AreaChart,
  BarChart,
  Legend,
  LineChart,
  Grid,
  Col,
  Badge,
  Flex,
  Select,
  SelectItem,
  Subtitle,
  Callout,
  Metric,
  CategoryBar,
  Divider,
} from "@tremor/react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Percent,
  Home,
  Users,
  CreditCard,
  Sparkles,
  Lightbulb,
  BarChart4,
  AreaChart as AreaChartIcon,
  Filter,
  ArrowUpDown,
  FileText,
  Download,
} from "lucide-react";
import { format, parseISO, subMonths, differenceInMonths, compareDesc, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatCurrency } from "@/lib/utils";
import { Card as ShadcnCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateRange } from "@/components/ui/date-range-picker";

// Definição dos tipos
interface TrendsReportProps {
  ownerId?: number;
  propertyId?: number;
  initialDateRange?: DateRange;
  isLoading?: boolean;
}

interface TrendDataPoint {
  date: string;
  revenue: number;
  profit: number;
  occupancy: number;
  reservations: number;
  averageRate: number;
}

interface PropertyTrend {
  propertyId: number;
  propertyName: string;
  data: TrendDataPoint[];
  totals: {
    totalRevenue: number;
    totalProfit: number;
    averageOccupancy: number;
    totalReservations: number;
    revenueGrowth: number;
    profitGrowth: number;
    occupancyGrowth: number;
  };
}

interface PerformanceInsight {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  trend: number;
  value: string;
  metric: string;
}

// Componente principal
export function TrendsReport({
  ownerId,
  propertyId,
  initialDateRange,
  isLoading = false
}: TrendsReportProps) {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  
  // Estados
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [granularity, setGranularity] = useState<string>("monthly");
  const [selectedProperty, setSelectedProperty] = useState<number | undefined>(propertyId);
  const [showYoY, setShowYoY] = useState<boolean>(true);
  const [sortOption, setSortOption] = useState<string>("revenue");
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || {
      from: subMonths(new Date(), 12),
      to: new Date()
    }
  );
  
  // Referência para gráficos (para exportação como imagem)
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Dados simulados de tendências (seriam substituídos por dados reais da API)
  const [trendsData, setTrendsData] = useState<PropertyTrend[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  
  // Efeito para carregar os dados
  useEffect(() => {
    async function loadTrendsData() {
      setIsLoadingData(true);
      
      // Em um ambiente real, esta seria uma chamada API
      // com dateRange.from, dateRange.to, ownerId e propertyId
      
      // Simular atraso de rede
      setTimeout(() => {
        const mockData = generateMockTrendsData(
          dateRange.from as Date, 
          dateRange.to as Date,
          granularity, 
          ownerId,
          propertyId
        );
        setTrendsData(mockData);
        setIsLoadingData(false);
      }, 800);
    }
    
    loadTrendsData();
  }, [dateRange, granularity, ownerId, propertyId]);
  
  // Função para gerar dados para testes de interface (seria removida na implementação real)
  function generateMockTrendsData(
    startDate: Date, 
    endDate: Date, 
    granularity: string,
    ownerId?: number,
    propertyId?: number
  ): PropertyTrend[] {
    // Implementação minima para teste de UI
    // No ambiente real, esses dados seriam obtidos do backend
    const properties = [];
    const propertyNames = [
      "Villa Oceano", "Casa do Sol", "Apartamento Central", 
      "Loft Moderno", "Vila das Flores", "Chalé da Montanha"
    ];
    
    const months = differenceInMonths(endDate, startDate) + 1;
    
    for (let i = 0; i < (propertyId ? 1 : 5); i++) {
      const propertyData: TrendDataPoint[] = [];
      const baseRevenue = 2000 + Math.random() * 3000;
      const baseOccupancy = 50 + Math.random() * 30;
      
      let currentDate = startOfMonth(startDate);
      let totalRevenue = 0;
      let totalProfit = 0;
      let totalOccupancy = 0;
      
      // Gerar pontos de dados para cada mês
      while (currentDate <= endDate) {
        const month = currentDate.getMonth();
        const seasonalFactor = 1 + (month >= 5 && month <= 8 ? 0.3 : 0); // Fator sazonal (verão)
        
        // Simular crescimento ao longo do tempo
        const timeProgression = differenceInMonths(currentDate, startDate) / Math.max(1, months);
        const growthFactor = 1 + timeProgression * 0.2; // Crescimento gradual
        
        // Adicionar variação aleatória
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        // Calcular métricas para este mês
        const revenue = baseRevenue * seasonalFactor * growthFactor * randomFactor;
        const profit = revenue * (0.4 + Math.random() * 0.2); // Margem entre 40% e 60%
        const occupancy = Math.min(100, baseOccupancy * seasonalFactor * growthFactor * randomFactor);
        const reservations = Math.round(occupancy / 10 + Math.random() * 5);
        const averageRate = revenue / Math.max(1, reservations);
        
        propertyData.push({
          date: format(currentDate, "yyyy-MM-dd"),
          revenue: Math.round(revenue),
          profit: Math.round(profit),
          occupancy: Math.round(occupancy),
          reservations,
          averageRate: Math.round(averageRate)
        });
        
        totalRevenue += revenue;
        totalProfit += profit;
        totalOccupancy += occupancy;
        
        // Avançar para o próximo mês
        currentDate = endOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      }
      
      // Calcular médias e crescimento
      const avgOccupancy = totalOccupancy / propertyData.length;
      const firstHalfData = propertyData.slice(0, Math.ceil(propertyData.length / 2));
      const secondHalfData = propertyData.slice(Math.ceil(propertyData.length / 2));
      
      const firstHalfRevenue = firstHalfData.reduce((sum, item) => sum + item.revenue, 0);
      const secondHalfRevenue = secondHalfData.reduce((sum, item) => sum + item.revenue, 0);
      const revenueGrowth = firstHalfRevenue > 0 
        ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
        : 100;
        
      const firstHalfProfit = firstHalfData.reduce((sum, item) => sum + item.profit, 0);
      const secondHalfProfit = secondHalfData.reduce((sum, item) => sum + item.profit, 0);
      const profitGrowth = firstHalfProfit > 0 
        ? ((secondHalfProfit - firstHalfProfit) / firstHalfProfit) * 100 
        : 100;
        
      const firstHalfOccupancy = firstHalfData.reduce((sum, item) => sum + item.occupancy, 0) / firstHalfData.length;
      const secondHalfOccupancy = secondHalfData.reduce((sum, item) => sum + item.occupancy, 0) / secondHalfData.length;
      const occupancyGrowth = firstHalfOccupancy > 0 
        ? ((secondHalfOccupancy - firstHalfOccupancy) / firstHalfOccupancy) * 100 
        : 100;
      
      properties.push({
        propertyId: i + 1,
        propertyName: propertyId ? "Propriedade Selecionada" : propertyNames[i],
        data: propertyData,
        totals: {
          totalRevenue,
          totalProfit,
          averageOccupancy: avgOccupancy,
          totalReservations: propertyData.reduce((sum, item) => sum + item.reservations, 0),
          revenueGrowth,
          profitGrowth,
          occupancyGrowth
        }
      });
    }
    
    return properties;
  }
  
  // Calcular dados agregados para todas as propriedades
  const aggregatedData = useMemo(() => {
    if (trendsData.length === 0) return [];
    
    // Obtenha todas as datas únicas em todos os conjuntos de dados
    const allDates = new Set<string>();
    trendsData.forEach(property => {
      property.data.forEach(item => allDates.add(item.date));
    });
    
    // Ordenar datas
    const sortedDates = Array.from(allDates).sort();
    
    // Agregar dados por data
    return sortedDates.map(date => {
      const aggregated: any = { date };
      
      // Soma de receita e lucro
      aggregated.revenue = trendsData.reduce((sum, property) => {
        const dataPoint = property.data.find(d => d.date === date);
        return sum + (dataPoint?.revenue || 0);
      }, 0);
      
      aggregated.profit = trendsData.reduce((sum, property) => {
        const dataPoint = property.data.find(d => d.date === date);
        return sum + (dataPoint?.profit || 0);
      }, 0);
      
      // Média de ocupação
      const occupancyValues = trendsData
        .map(property => {
          const dataPoint = property.data.find(d => d.date === date);
          return dataPoint?.occupancy;
        })
        .filter(Boolean) as number[];
      
      aggregated.occupancy = occupancyValues.length > 0
        ? occupancyValues.reduce((sum, val) => sum + val, 0) / occupancyValues.length
        : 0;
      
      // Total de reservas
      aggregated.reservations = trendsData.reduce((sum, property) => {
        const dataPoint = property.data.find(d => d.date === date);
        return sum + (dataPoint?.reservations || 0);
      }, 0);
      
      // Média de tarifa
      aggregated.averageRate = aggregated.reservations > 0
        ? aggregated.revenue / aggregated.reservations
        : 0;
      
      return aggregated;
    });
  }, [trendsData]);
  
  // Calcular insights de desempenho
  const performanceInsights: PerformanceInsight[] = useMemo(() => {
    if (trendsData.length === 0) return [];
    
    // Calcular totais gerais
    const totalRevenue = trendsData.reduce((sum, p) => sum + p.totals.totalRevenue, 0);
    const totalProfit = trendsData.reduce((sum, p) => sum + p.totals.totalProfit, 0);
    const avgOccupancy = trendsData.reduce((sum, p) => sum + p.totals.averageOccupancy, 0) / trendsData.length;
    const totalReservations = trendsData.reduce((sum, p) => sum + p.totals.totalReservations, 0);
    
    // Média de crescimentos
    const avgRevenueGrowth = trendsData.reduce((sum, p) => sum + p.totals.revenueGrowth, 0) / trendsData.length;
    const avgProfitGrowth = trendsData.reduce((sum, p) => sum + p.totals.profitGrowth, 0) / trendsData.length;
    const avgOccupancyGrowth = trendsData.reduce((sum, p) => sum + p.totals.occupancyGrowth, 0) / trendsData.length;
    
    // Propriedade com melhor desempenho em receita
    const bestRevenueProperty = [...trendsData].sort((a, b) => b.totals.totalRevenue - a.totals.totalRevenue)[0];
    
    // Propriedade com melhor crescimento
    const bestGrowthProperty = [...trendsData].sort((a, b) => b.totals.revenueGrowth - a.totals.revenueGrowth)[0];
    
    return [
      {
        title: t("trendsReport.revenueGrowth", "Crescimento de Receita"),
        description: `${t("trendsReport.compared", "Comparado ao")} ${t("trendsReport.previousPeriod", "período anterior")}`,
        icon: <TrendingUp size={20} />,
        color: avgRevenueGrowth >= 0 ? "emerald" : "rose",
        trend: avgRevenueGrowth,
        value: formatCurrency(totalRevenue),
        metric: "revenue"
      },
      {
        title: t("trendsReport.profitGrowth", "Crescimento de Lucro"),
        description: t("trendsReport.profitMargin", "Margem de {{margin}}%", {
          margin: ((totalProfit / totalRevenue) * 100).toFixed(1)
        }),
        icon: <DollarSign size={20} />,
        color: avgProfitGrowth >= 0 ? "emerald" : "rose",
        trend: avgProfitGrowth,
        value: formatCurrency(totalProfit),
        metric: "profit"
      },
      {
        title: t("trendsReport.occupancyTrend", "Tendência de Ocupação"),
        description: `${avgOccupancy.toFixed(1)}% ${t("trendsReport.average", "média")}`,
        icon: <Percent size={20} />,
        color: avgOccupancyGrowth >= 0 ? "emerald" : "amber",
        trend: avgOccupancyGrowth,
        value: `${avgOccupancy.toFixed(1)}%`,
        metric: "occupancy"
      },
      {
        title: t("trendsReport.topProperty", "Propriedade Destaque"),
        description: bestRevenueProperty?.propertyName || "-",
        icon: <Home size={20} />,
        color: "blue",
        trend: bestRevenueProperty?.totals.revenueGrowth || 0,
        value: formatCurrency(bestRevenueProperty?.totals.totalRevenue || 0),
        metric: "property"
      }
    ];
  }, [trendsData, t]);
  
  // Opções para o seletor de granularidade
  const granularityOptions = [
    { value: "monthly", label: t("trendsReport.monthly", "Mensal") },
    { value: "quarterly", label: t("trendsReport.quarterly", "Trimestral") },
    { value: "yearly", label: t("trendsReport.yearly", "Anual") }
  ];
  
  // Opções para ordenação
  const sortOptions = [
    { value: "revenue", label: t("trendsReport.byRevenue", "Por Receita") },
    { value: "profit", label: t("trendsReport.byProfit", "Por Lucro") },
    { value: "growth", label: t("trendsReport.byGrowth", "Por Crescimento") },
    { value: "occupancy", label: t("trendsReport.byOccupancy", "Por Ocupação") }
  ];
  
  // Função para exportar para CSV
  const exportToCSV = (data: any[], filename: string) => {
    // Criar cabeçalhos 
    const headers = Object.keys(data[0]);
    
    // Converter dados para linhas CSV
    const csvRows = [
      headers.join(','), // Cabeçalho
      ...data.map(row => {
        return headers.map(header => {
          const cell = row[header];
          // Formatar células com vírgulas ou aspas
          if (cell == null) return '';
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',');
      })
    ];
    
    // Criar blob e iniciar download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  };
  
  // Função para exportar para PDF
  const exportToPDF = (data: any[], title: string, filename: string) => {
    const doc = new jsPDF();
    
    // Adicionar título
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    
    // Adicionar data do relatório
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `${t("export.generatedOn", "Gerado em")}: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      14, 30
    );
    
    // Preparar dados para a tabela
    const tableColumns = Object.keys(data[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1),
      dataKey: key
    }));
    
    // Adicionar tabela
    (doc as any).autoTable({
      startY: 40,
      columns: tableColumns,
      body: data,
      headStyles: { fillColor: [66, 91, 235], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      margin: { top: 40 },
    });
    
    // Salvar arquivo
    doc.save(filename);
  };
  
  // Renderizar indicador de tendência
  const renderTrend = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-emerald-500 text-xs font-medium">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          +{value.toFixed(1)}%
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-rose-500 text-xs font-medium">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {value.toFixed(1)}%
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-500 text-xs font-medium">
        {value.toFixed(1)}%
      </div>
    );
  };
  
  if (isLoading) {
    return <TrendsReportSkeleton />;
  }
  
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Cabeçalho do relatório de tendências */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold mb-2"
            >
              {t("trendsReport.title", "Análise de Tendências")}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              {t("trendsReport.description", "Acompanhe as tendências de desempenho ao longo do tempo")}
            </motion.p>
          </div>
          
          {/* Botões de exportação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                const formattedStartDate = dateRange.from ? format(new Date(dateRange.from), "yyyy-MM-dd") : '';
                const formattedEndDate = dateRange.to ? format(new Date(dateRange.to), "yyyy-MM-dd") : '';
                const exportData = aggregatedData.map(item => ({
                  data: format(new Date(item.date), "dd/MM/yyyy"),
                  receita: item.revenue.toFixed(2),
                  lucro: item.profit.toFixed(2),
                  ocupacao: `${item.occupancy.toFixed(1)}%`,
                  reservas: item.reservations
                }));
                
                exportToCSV(
                  exportData, 
                  `tendencias_${formattedStartDate}_${formattedEndDate}.csv`
                );
              }}
            >
              <BarChart4 className="h-4 w-4" />
              {t("export.csv", "Exportar CSV")}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                const formattedStartDate = dateRange.from ? format(new Date(dateRange.from), "yyyy-MM-dd") : '';
                const formattedEndDate = dateRange.to ? format(new Date(dateRange.to), "yyyy-MM-dd") : '';
                const exportData = aggregatedData.map(item => ({
                  data: format(new Date(item.date), "dd/MM/yyyy"),
                  receita: formatCurrency(item.revenue),
                  lucro: formatCurrency(item.profit),
                  ocupacao: `${item.occupancy.toFixed(1)}%`,
                  reservas: item.reservations
                }));
                
                exportToPDF(
                  exportData,
                  `${t("trendsReport.title", "Análise de Tendências")} (${formattedStartDate} - ${formattedEndDate})`,
                  `tendencias_${formattedStartDate}_${formattedEndDate}.pdf`
                );
              }}
            >
              <Download className="h-4 w-4" />
              {t("export.pdf", "Exportar PDF")}
            </Button>
          </div>
        </div>
        
        {/* Controles de filtro */}
        <div className="bg-background border rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="w-full lg:w-64">
              <Label htmlFor="date-range" className="mb-2 block">
                {t("trendsReport.period", "Período")}
              </Label>
              <div className="border rounded-md p-2 flex gap-2 items-center">
                <span className="text-sm">
                  {dateRange.from && format(new Date(dateRange.from), "dd/MM/yyyy")} - {dateRange.to && format(new Date(dateRange.to), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
            
            <div className="w-full lg:w-auto flex-1">
              <Label htmlFor="granularity" className="mb-2 block">
                {t("trendsReport.granularity", "Granularidade")}
              </Label>
              <Select
                id="granularity"
                value={granularity}
                onValueChange={setGranularity}
              >
                {granularityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            {!propertyId && (
              <div className="w-full lg:w-auto flex-1">
                <Label htmlFor="sortBy" className="mb-2 block">
                  {t("trendsReport.sortBy", "Ordenar por")}
                </Label>
                <Select
                  id="sortBy"
                  value={sortOption}
                  onValueChange={setSortOption}
                  icon={ArrowUpDown}
                >
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}
            
            <div className="w-full lg:w-auto flex items-center space-x-2 pt-4 lg:pt-0">
              <Switch
                id="show-yoy"
                checked={showYoY}
                onCheckedChange={setShowYoY}
              />
              <Label htmlFor="show-yoy">
                {t("trendsReport.yearOverYear", "Comparação Interanual")}
              </Label>
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoadingData ? (
          <TrendsReportSkeleton />
        ) : (
          <>
            {/* Insights cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {performanceInsights.map((insight, idx) => (
                <Card 
                  key={idx}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    "hover:shadow-lg hover:translate-y-[-2px]"
                  )}
                  decoration="top"
                  decorationColor={insight.color}
                >
                  <div className="flex items-center justify-between">
                    <Text>{insight.title}</Text>
                    {renderTrend(insight.trend)}
                  </div>
                  <Metric className="mt-2 flex items-center">
                    <span className={`h-5 w-5 mr-2 text-${insight.color}-500`}>
                      {insight.icon}
                    </span>
                    {insight.value}
                  </Metric>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {insight.description}
                  </Text>
                </Card>
              ))}
            </motion.div>
            
            {/* Abas para diferentes visualizações */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <TabGroup
                index={activeTab === "overview" ? 0 : activeTab === "properties" ? 1 : 2}
                onIndexChange={(index) => 
                  setActiveTab(index === 0 ? "overview" : index === 1 ? "properties" : "metrics")
                }
              >
                <TabList className="mb-6" variant="solid">
                  <Tab icon={Activity}>{t("trendsReport.overview", "Visão Geral")}</Tab>
                  <Tab icon={Home}>{t("trendsReport.properties", "Propriedades")}</Tab>
                  <Tab icon={BarChart4}>{t("trendsReport.metrics", "Métricas")}</Tab>
                </TabList>
                
                <TabPanels>
                  {/* Painel Visão Geral */}
                  <TabPanel>
                    <Card className="overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Title>{t("trendsReport.revenueAndProfit", "Receita e Lucro")}</Title>
                          <Text className="mt-1">{t("trendsReport.overTime", "Evolução ao longo do tempo")}</Text>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8">
                                <Filter className="h-3.5 w-3.5 mr-1" />
                                {t("trendsReport.filters", "Filtros")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("trendsReport.comingSoon", "Em breve")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="h-[350px] mt-4">
                        <AreaChart
                          data={aggregatedData}
                          index="date"
                          categories={["revenue", "profit"]}
                          colors={["indigo", "emerald"]}
                          valueFormatter={formatCurrency}
                          showLegend={true}
                          showGridLines={false}
                          showAnimation={true}
                          className="h-full"
                          curveType="natural"
                        />
                      </div>
                      
                      <Divider />
                      
                      <div className="mt-4">
                        <Title>{t("trendsReport.occupancyAndReservations", "Ocupação e Reservas")}</Title>
                        <Text className="mt-1">{t("trendsReport.relatedMetrics", "Métricas relacionadas")}</Text>
                        
                        <Grid numItemsMd={2} className="mt-4 gap-6">
                          <Card className="max-w-full overflow-hidden">
                            <Title className="text-sm">{t("trendsReport.occupancy", "Ocupação (%)")}</Title>
                            <div className="h-[200px] mt-2">
                              <LineChart
                                data={aggregatedData}
                                index="date"
                                categories={["occupancy"]}
                                colors={["blue"]}
                                valueFormatter={(value) => `${value.toFixed(1)}%`}
                                showLegend={false}
                                showGridLines={false}
                                showAnimation={true}
                                className="h-full"
                                curveType="natural"
                              />
                            </div>
                          </Card>
                          
                          <Card className="max-w-full overflow-hidden">
                            <Title className="text-sm">{t("trendsReport.reservations", "Reservas (quantidade)")}</Title>
                            <div className="h-[200px] mt-2">
                              <BarChart
                                data={aggregatedData}
                                index="date"
                                categories={["reservations"]}
                                colors={["amber"]}
                                showLegend={false}
                                showGridLines={false}
                                showAnimation={true}
                                className="h-full"
                              />
                            </div>
                          </Card>
                        </Grid>
                      </div>
                      
                      {/* Insights de AI */}
                      <Card className="mt-6 bg-primary/5 border-none">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <Title>{t("trendsReport.aiInsights", "Insights Inteligentes")}</Title>
                        </div>
                        
                        <Grid numItemsMd={2} className="gap-4">
                          <Callout
                            title={t("trendsReport.performanceSummary", "Resumo de Desempenho")}
                            icon={Lightbulb}
                            color="amber"
                          >
                            {t("trendsReport.performanceSummaryText", 
                              "A receita mostra um crescimento de {{growth}}% ao longo do período analisado, com tendência {{trend}} nos últimos 3 meses.", 
                              { 
                                growth: Math.abs(performanceInsights[0].trend).toFixed(1),
                                trend: performanceInsights[0].trend > 0 ? 
                                  t("trendsReport.positive", "positiva") : 
                                  t("trendsReport.negative", "negativa")
                              }
                            )}
                            <br /><br />
                            {t("trendsReport.profitInfo",
                              "A margem de lucro média foi de {{margin}}%, {{comparison}} que o período anterior.",
                              {
                                margin: (aggregatedData.reduce((sum, d) => sum + (d.profit / d.revenue * 100), 0) / aggregatedData.length).toFixed(1),
                                comparison: performanceInsights[1].trend > 0 ? 
                                  t("trendsReport.higher", "maior") : 
                                  t("trendsReport.lower", "menor")
                              }
                            )}
                          </Callout>
                          
                          <Callout
                            title={t("trendsReport.opportunities", "Oportunidades")}
                            icon={TrendingUp}
                            color="emerald"
                          >
                            <ul className="space-y-2 list-disc pl-4">
                              <li>
                                {t("trendsReport.opportunityText1", 
                                  "A propriedade {{property}} mostra o maior potencial de crescimento com {{growth}}%.", 
                                  { 
                                    property: performanceInsights[3].description,
                                    growth: Math.abs(performanceInsights[3].trend).toFixed(1)
                                  }
                                )}
                              </li>
                              <li>
                                {t("trendsReport.opportunityText2", 
                                  "Períodos de baixa ocupação representam oportunidades para estratégias promocionais."
                                )}
                              </li>
                            </ul>
                          </Callout>
                        </Grid>
                      </Card>
                    </Card>
                  </TabPanel>
                  
                  {/* Painel de Propriedades */}
                  <TabPanel>
                    <Card>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <Title>{t("trendsReport.propertiesComparison", "Comparação de Propriedades")}</Title>
                          <Text className="mt-1">
                            {t("trendsReport.propertiesComparisonDesc", 
                              "Desempenho comparativo por propriedade durante o período selecionado"
                            )}
                          </Text>
                        </div>
                      </div>
                      
                      {/* Grid de propriedades - versão desktop */}
                      {!isMobile && (
                        <div className="grid grid-cols-1 gap-6">
                          {trendsData
                            .sort((a, b) => {
                              if (sortOption === "revenue") return b.totals.totalRevenue - a.totals.totalRevenue;
                              if (sortOption === "profit") return b.totals.totalProfit - a.totals.totalProfit;
                              if (sortOption === "growth") return b.totals.revenueGrowth - a.totals.revenueGrowth;
                              return b.totals.averageOccupancy - a.totals.averageOccupancy;
                            })
                            .map((property, idx) => (
                              <motion.div
                                key={property.propertyId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="mb-4"
                              >
                                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                                  <Grid numItemsMd={12} className="gap-6">
                                    {/* Informações da propriedade */}
                                    <Col numColSpanMd={3}>
                                      <div className="flex flex-col h-full justify-between">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-primary" />
                                            <Title className="text-base">{property.propertyName}</Title>
                                          </div>
                                          
                                          <div className="mt-4 space-y-2">
                                            <div>
                                              <Text className="text-sm text-muted-foreground">
                                                {t("trendsReport.totalRevenue", "Receita Total")}
                                              </Text>
                                              <div className="flex items-center justify-between">
                                                <Metric className="text-lg">
                                                  {formatCurrency(property.totals.totalRevenue)}
                                                </Metric>
                                                {renderTrend(property.totals.revenueGrowth)}
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <Text className="text-sm text-muted-foreground">
                                                {t("trendsReport.profit", "Lucro")}
                                              </Text>
                                              <div className="flex items-center justify-between">
                                                <Metric className="text-lg">
                                                  {formatCurrency(property.totals.totalProfit)}
                                                </Metric>
                                                {renderTrend(property.totals.profitGrowth)}
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <Text className="text-sm text-muted-foreground">
                                                {t("trendsReport.avgOccupancy", "Ocupação Média")}
                                              </Text>
                                              <div className="flex items-center justify-between">
                                                <Metric className="text-lg">
                                                  {property.totals.averageOccupancy.toFixed(1)}%
                                                </Metric>
                                                {renderTrend(property.totals.occupancyGrowth)}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="mt-4 w-full"
                                          onClick={() => setSelectedProperty(property.propertyId)}
                                        >
                                          {t("trendsReport.viewDetails", "Ver Detalhes")}
                                        </Button>
                                      </div>
                                    </Col>
                                    
                                    {/* Gráfico de tendência */}
                                    <Col numColSpanMd={9}>
                                      <div className="h-[220px]">
                                        <AreaChart
                                          data={property.data}
                                          index="date"
                                          categories={["revenue", "profit"]}
                                          colors={["indigo", "emerald"]}
                                          valueFormatter={formatCurrency}
                                          showLegend={true}
                                          showGridLines={false}
                                          showAnimation={true}
                                          className="h-full"
                                          curveType="natural"
                                        />
                                      </div>
                                    </Col>
                                  </Grid>
                                </Card>
                              </motion.div>
                            ))}
                        </div>
                      )}
                      
                      {/* Cards de propriedades - versão mobile */}
                      {isMobile && (
                        <div className="space-y-4">
                          {trendsData
                            .sort((a, b) => {
                              if (sortOption === "revenue") return b.totals.totalRevenue - a.totals.totalRevenue;
                              if (sortOption === "profit") return b.totals.totalProfit - a.totals.totalProfit;
                              if (sortOption === "growth") return b.totals.revenueGrowth - a.totals.revenueGrowth;
                              return b.totals.averageOccupancy - a.totals.averageOccupancy;
                            })
                            .map((property, idx) => (
                              <motion.div
                                key={property.propertyId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                              >
                                <Card className="overflow-hidden">
                                  <div className="flex items-center mb-3">
                                    <Home className="h-4 w-4 mr-2 text-primary" />
                                    <Title className="text-base">{property.propertyName}</Title>
                                  </div>
                                  
                                  <Grid numItemsSm={2} className="gap-4">
                                    <Col>
                                      <Text className="text-muted-foreground text-sm">
                                        {t("trendsReport.revenue", "Receita")}
                                      </Text>
                                      <Flex alignItems="center" justifyContent="between">
                                        <p className="text-lg font-semibold">
                                          {formatCurrency(property.totals.totalRevenue)}
                                        </p>
                                        {renderTrend(property.totals.revenueGrowth)}
                                      </Flex>
                                    </Col>
                                    <Col>
                                      <Text className="text-muted-foreground text-sm">
                                        {t("trendsReport.profit", "Lucro")}
                                      </Text>
                                      <Flex alignItems="center" justifyContent="between">
                                        <p className={cn(
                                          "text-lg font-semibold",
                                          property.totals.totalProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                          {formatCurrency(property.totals.totalProfit)}
                                        </p>
                                        {renderTrend(property.totals.profitGrowth)}
                                      </Flex>
                                    </Col>
                                  </Grid>
                                  
                                  <div className="mt-4">
                                    <Text className="text-muted-foreground text-sm">
                                      {t("trendsReport.occupancyRate", "Taxa de Ocupação")}
                                    </Text>
                                    <div className="mt-1">
                                      <CategoryBar
                                        values={[property.totals.averageOccupancy, 100 - property.totals.averageOccupancy]}
                                        colors={["blue", "slate"]}
                                        markerValue={property.totals.averageOccupancy}
                                        showAnimation={true}
                                        className="h-2"
                                      />
                                      <div className="flex justify-between text-xs mt-1">
                                        <span>{property.totals.averageOccupancy.toFixed(1)}%</span>
                                        <span className="text-muted-foreground">
                                          {renderTrend(property.totals.occupancyGrowth)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 w-full"
                                    onClick={() => setSelectedProperty(property.propertyId)}
                                  >
                                    {t("trendsReport.viewDetails", "Ver Detalhes")}
                                  </Button>
                                </Card>
                              </motion.div>
                            ))}
                        </div>
                      )}
                    </Card>
                  </TabPanel>
                  
                  {/* Painel de Métricas */}
                  <TabPanel>
                    <Card>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <Title>{t("trendsReport.keyMetrics", "Métricas-Chave")}</Title>
                          <Text className="mt-1">
                            {t("trendsReport.keyMetricsDesc", "Análise detalhada das principais métricas de negócio")}
                          </Text>
                        </div>
                      </div>
                      
                      <Grid numItemsMd={2} className="gap-6">
                        <Card>
                          <Title>{t("trendsReport.revenueAndProfitMargin", "Receita e Margem de Lucro")}</Title>
                          <div className="h-[280px] mt-4">
                            <BarChart
                              data={aggregatedData}
                              index="date"
                              categories={["revenue"]}
                              colors={["indigo"]}
                              valueFormatter={formatCurrency}
                              yAxisWidth={60}
                              showLegend={false}
                              showGridLines={false}
                              showAnimation={true}
                              className="h-full"
                              // Renderização de barras secundárias para mostrar margens
                              // (seria implementado em uma versão real)
                            />
                          </div>
                        </Card>
                        
                        <Card>
                          <Title>{t("trendsReport.reservationsAndAverageRate", "Reservas e Tarifa Média")}</Title>
                          <div className="h-[280px] mt-4">
                            <BarChart
                              data={aggregatedData}
                              index="date"
                              categories={["reservations"]}
                              colors={["amber"]}
                              valueFormatter={(value) => value.toString()}
                              yAxisWidth={40}
                              showLegend={false}
                              showGridLines={false}
                              showAnimation={true}
                              className="h-full"
                            />
                          </div>
                        </Card>
                        
                        <Card>
                          <Title>{t("trendsReport.occupancyRate", "Taxa de Ocupação")}</Title>
                          <div className="h-[280px] mt-4">
                            <LineChart
                              data={aggregatedData}
                              index="date"
                              categories={["occupancy"]}
                              colors={["blue"]}
                              valueFormatter={(value) => `${value.toFixed(1)}%`}
                              yAxisWidth={40}
                              showLegend={false}
                              showGridLines={false}
                              showAnimation={true}
                              className="h-full"
                              curveType="natural"
                            />
                          </div>
                        </Card>
                        
                        <Card>
                          <Title>{t("trendsReport.averageDailyRate", "Tarifa Média Diária")}</Title>
                          <div className="h-[280px] mt-4">
                            <LineChart
                              data={aggregatedData}
                              index="date"
                              categories={["averageRate"]}
                              colors={["violet"]}
                              valueFormatter={formatCurrency}
                              yAxisWidth={60}
                              showLegend={false}
                              showGridLines={false}
                              showAnimation={true}
                              className="h-full"
                              curveType="natural"
                            />
                          </div>
                        </Card>
                      </Grid>
                      
                      {/* Análise de tendências */}
                      <Card className="mt-6 bg-primary/5 border-none">
                        <div className="flex items-center gap-2 mb-4">
                          <AreaChartIcon className="h-5 w-5 text-primary" />
                          <Title>{t("trendsReport.trendAnalysis", "Análise de Tendências")}</Title>
                        </div>
                        
                        <Grid numItemsMd={3} className="gap-4">
                          <Callout
                            title={t("trendsReport.seasonality", "Sazonalidade")}
                            icon={Calendar}
                            color="amber"
                          >
                            <p className="text-sm mt-2">
                              {t("trendsReport.seasonalityText", 
                                "Os meses de {{highSeason}} mostram os melhores desempenhos, com taxas de ocupação {{occupancyRate}}% superiores à média anual.",
                                { 
                                  highSeason: aggregatedData.length > 6 ? "junho a agosto" : "alta temporada",
                                  occupancyRate: "20-30"
                                }
                              )}
                            </p>
                          </Callout>
                          
                          <Callout
                            title={t("trendsReport.pricing", "Preços")}
                            icon={CreditCard}
                            color="blue"
                          >
                            <p className="text-sm mt-2">
                              {t("trendsReport.pricingText", 
                                "A tarifa média diária tem {{trend}} de {{percentage}}% ao longo do período analisado, indicando {{indicator}}.",
                                { 
                                  trend: "aumento",
                                  percentage: "15",
                                  indicator: "valorização das propriedades"
                                }
                              )}
                            </p>
                          </Callout>
                          
                          <Callout
                            title={t("trendsReport.guests", "Hóspedes")}
                            icon={Users}
                            color="indigo"
                          >
                            <p className="text-sm mt-2">
                              {t("trendsReport.guestsText", 
                                "O número de reservas {{trend}} em {{percentage}}%, com uma média de {{average}} noites por estadia.",
                                { 
                                  trend: "aumentou",
                                  percentage: "12",
                                  average: "3.5"
                                }
                              )}
                            </p>
                          </Callout>
                        </Grid>
                      </Card>
                    </Card>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            </motion.div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Componente de skeleton para estado de carregamento
function TrendsReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="bg-background border rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="h-10 w-full lg:w-64" />
          <Skeleton className="h-10 w-full lg:w-48" />
          <Skeleton className="h-10 w-full lg:w-48" />
          <Skeleton className="h-6 w-full lg:w-48 mt-4 lg:mt-2" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <ShadcnCard key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28 mb-2" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </ShadcnCard>
        ))}
      </div>
      
      <div>
        <Skeleton className="h-10 w-full mb-6" />
        
        <ShadcnCard>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full mb-6" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72 mb-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
            
            <Skeleton className="h-[180px] w-full" />
          </CardContent>
        </ShadcnCard>
      </div>
    </div>
  );
}

// Funções de exportação de dados
function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(',');
  const csvData = data.map(row => Object.values(row).join(',')).join('\n');
  const csvContent = `${headers}\n${csvData}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

function exportToPDF(data: any[], title: string, filename: string) {
  const doc = new jsPDF();
  
  // Configuração de estilos e página
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(11);
  doc.text(new Date().toLocaleDateString(), 14, 30);
  
  // Tabela de dados
  const tableColumn = Object.keys(data[0]);
  const tableRows = data.map(item => Object.values(item));
  
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 40 }
  });
  
  doc.save(filename);
}