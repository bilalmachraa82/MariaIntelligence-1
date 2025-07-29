import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format, subDays } from "date-fns";
import { motion } from "@/lib/motion-fallback";
import { type Reservation, type Activity } from "@shared/schema";

// UI Components
import {
  Card,
  Text,
  Title,
  Metric,
  Flex,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  ProgressBar,
  BadgeDelta,
  Icon,
  BarList,
  BarChart
} from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Download,
  FileUp,
  LineChart,
  DollarSign, Euro as EuroIcon,
  TrendingUp,
  UserCheck,
  BarChart3,
  PieChart,
  Users,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Custom components
import { RecentReservations } from "./recent-reservations";
import { RecentActivity } from "./recent-activity";
import { RevenueVsProfitChart } from "./revenue-vs-profit-chart";
import { FinancialDistributionChart } from "./financial-distribution-chart";

// Componentes personalizados
import { DemoDataManager } from "../demo-data-manager";

// Utils
import { formatCurrency, calculateOccupancyColor } from "@/lib/utils";

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
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Mês anterior",
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 0), "yyyy-MM-dd"),
  },
  {
    label: "Trimestre atual",
    startDate: format(new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Ano atual",
    startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: custom * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

export default function NewModernDashboard({ minimal = false }: { minimal?: boolean }) {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(dateRanges[0]);
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Interface para tipagem das estatísticas
  interface StatisticsData {
    totalRevenue: number;
    netProfit: number;
    occupancyRate: number;
    revenueChange?: number;
    profitChange?: number;
    reservationsCount: number;
    reservationsChange?: number;
    topProperties: Array<{
      id: number;
      name: string;
      occupancyRate: number;
    }>;
  }
  
  // Fetch statistics with staleTime and cache configuration
  const { data: statistics, isLoading: isLoadingStats } = useQuery<StatisticsData>({
    queryKey: ["/api/statistics", selectedDateRange.startDate, selectedDateRange.endDate],
    staleTime: 0, // Sempre considera os dados obsoletos para forçar nova busca
    gcTime: 0, // Não armazena em cache (gcTime substituiu cacheTime na v5)
    refetchOnWindowFocus: true, // Atualiza quando a janela recebe foco
    refetchOnMount: true, // Atualiza quando o componente é montado
  });

  // Fetch recent reservations
  const { data: reservations, isLoading: isLoadingReservations } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
    staleTime: 0,
    gcTime: 30 * 1000, // Cache de 30 segundos
    refetchOnWindowFocus: true,
  });
  
  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities?limit=4"],
    staleTime: 0,
    gcTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    const selectedRange = dateRanges.find(range => range.label === value);
    if (selectedRange) {
      setSelectedDateRange(selectedRange);
      
      // Invalidar as consultas para forçar uma nova requisição com as novas datas
      queryClient.invalidateQueries({
        queryKey: ["/api/statistics"]
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/statistics/monthly-revenue"]
      });
    }
  };

  // Interface para tipagem dos dados de receita mensal
  interface MonthlyStats {
    year: number;
    granularity: 'week' | 'biweek' | 'month';
    revenueByMonth: Array<{
      month: string;
      revenue: number;
      profit: number;
    }>;
  }
  
  // Buscar dados de receita mensal da API
  const { data: monthlyStats, isLoading: isLoadingMonthly } = useQuery<MonthlyStats>({
    queryKey: ["/api/statistics/monthly-revenue", selectedDateRange.startDate, selectedDateRange.endDate],
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  
  // Adicionar logs quando os dados são recebidos
  useEffect(() => {
    if (monthlyStats) {
      console.log("📊 Dados de receita mensal recebidos:", monthlyStats);
      console.log(`📅 Período selecionado: ${selectedDateRange.startDate} até ${selectedDateRange.endDate}`);
      console.log(`🧮 Granularidade: ${monthlyStats.granularity || 'não definida'}`);
    }
  }, [monthlyStats, selectedDateRange]);
  
  // Prepare data for charts
  const revenueData = monthlyStats && monthlyStats.revenueByMonth 
    ? monthlyStats.revenueByMonth.map((item: any) => {
        console.log(`📈 Item de dados: ${item.month} - Receita: ${item.revenue} - Lucro: ${item.profit}`);
        return {
          name: item.month,
          Receita: item.revenue,
          Lucro: item.profit
        };
      })
    : [];
    
  // Determinar o texto do badge de análise conforme a granularidade
  const getGranularityLabel = () => {
    console.log(`🏷️ Granularidade atual: ${monthlyStats?.granularity || 'não definida'}`);
    
    if (!monthlyStats || !monthlyStats.granularity) return "Análise Mensal";
    
    switch (monthlyStats.granularity) {
      case 'week':
        return "Análise Semanal";
      case 'biweek':
        return "Análise Quinzenal";
      case 'month':
      default:
        return "Análise Mensal";
    }
  };

  // Recent reservations data (latest 4)
  const recentReservations = reservations?.slice(0, 4) || [];

  // Preparing financial data for pie chart with custom color values
  const financialData = statistics?.totalRevenue
    ? [
        { 
          name: 'Receita Líquida', 
          value: statistics.netProfit, 
          color: "#10b981", // tailwind emerald-500
          textColor: "#059669"
        },
        { 
          name: 'Custos e Despesas', 
          value: statistics.totalRevenue - statistics.netProfit, 
          color: "#f43f5e", // tailwind rose-500
          textColor: "#e11d48"
        }
      ]
    : [];

  // Prepare property occupancy data
  const propertyOccupancyData = statistics && Array.isArray(statistics.topProperties) 
    ? statistics.topProperties.map((property: any) => ({
        name: property.name.length > 15 ? property.name.substring(0, 15) + "..." : property.name,
        Ocupação: property.occupancyRate
      }))
    : [];

  // Color palette for charts
  const colorPalette = [
    'blue',
    'emerald',
    'indigo',
    'amber',
    'rose',
    'cyan',
    'violet',
  ];

  // Se for modo minimal, renderiza uma versão simplificada adequada para o card na página principal
  if (minimal) {
    return (
      <div className="w-full space-y-4">
        {/* KPI Cards simplificados em linha horizontal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800/40">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">{t("dashboard.totalRevenue", "Receita Total")}</p>
              <EuroIcon className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-primary mt-1">
              {isLoadingStats ? "..." : formatCurrency(statistics?.totalRevenue || 0)}
            </p>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs font-medium">{t("dashboard.netProfit", "Lucro Líquido")}</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-primary mt-1">
              {isLoadingStats ? "..." : formatCurrency(statistics?.netProfit || 0)}
            </p>
          </div>
        </div>
        
        {/* Gráfico de receita simplificado */}
        <div className="bg-gradient-to-r from-blue-50/80 to-emerald-50/80 dark:from-blue-950/10 dark:to-emerald-950/10 p-3 rounded-lg border border-blue-100/50 dark:border-blue-800/20">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-medium text-muted-foreground">{getGranularityLabel()}</p>
            <Badge variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">
              {selectedDateRange.label}
            </Badge>
          </div>
          
          {isLoadingMonthly ? (
            <div className="h-24 w-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : revenueData.length > 0 ? (
            <div className="h-24">
              <BarChart
                data={revenueData}
                index="name"
                categories={["Receita"]}
                colors={["blue"]}
                showLegend={false}
                showYAxis={false}
                showXAxis={true}
                showGridLines={false}
                showAnimation={true}
                className="h-24 -mx-1 text-xs font-medium"
              />
            </div>
          ) : (
            <div className="h-24 w-full flex items-center justify-center">
              <p className="text-xs text-muted-foreground">{t("dashboard.noData", "Sem dados para este período")}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Versão completa do dashboard
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 max-w-[1600px]">
      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl opacity-20"></div>
      </div>

      {/* Header with modern glass-morphism style */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-background/70 backdrop-blur-sm rounded-2xl p-6 border border-border/30 shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-500">
              {t("dashboard.title", "Dashboard")}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-lg text-base">
              {t("dashboard.description", "Visão geral do seu negócio de aluguel de imóveis")}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <Select 
              value={selectedDateRange.label} 
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="w-[200px] bg-background/70 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all">
                <Calendar className="mr-2 h-4 w-4 opacity-70" />
                <SelectValue placeholder={t("dashboard.period", "Período")} />
              </SelectTrigger>
              <SelectContent className="bg-background/80 backdrop-blur-sm border-border/30">
                {dateRanges.map((range) => (
                  <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation("/upload-pdf")}
              className="whitespace-nowrap bg-background/70 backdrop-blur-sm border-border/50 hover:bg-background/90 transition-all"
            >
              <FileUp className="mr-2 h-4 w-4" />
              {t("pdfUpload.uploadButton", "Importar PDF")}
            </Button>
            
            <Button 
              variant="default"
              className="whitespace-nowrap bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 transition-all"
              onClick={() => {
                alert(t("dashboard.exportNotImplemented", 'Exportação de dados implementada na versão completa'));
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("dashboard.export", "Exportar")}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Main tabs */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={1}
      >
        <TabGroup defaultIndex={0} onIndexChange={(index) => setSelectedTab(index === 0 ? "overview" : "details")}>
          <TabList className="mt-6">
            <Tab icon={PieChart}>{t("dashboard.overview", "Visão Geral")}</Tab>
            <Tab icon={BarChart3}>{t("dashboard.details", "Detalhes")}</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
                <motion.div 
                  custom={2} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-800/70 backdrop-blur-lg border border-blue-500/30 overflow-hidden relative rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 animate-gradient-x"></div>
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-blue-500/20 filter blur-xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-blue-400/10 filter blur-lg group-hover:bg-blue-400/20 transition-all duration-500"></div>
                    
                    <Flex alignItems="start" className="relative z-10 p-1">
                      <div className="flex-1">
                        <Text className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">{t("dashboard.totalRevenue", "Receita Total")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-10 w-36 mt-2" />
                        ) : (
                          <Metric className="text-blue-600 dark:text-blue-400 font-extrabold text-3xl mt-1 leading-tight">{formatCurrency(statistics?.totalRevenue || 0)}</Metric>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3.5 rounded-full shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 transform group-hover:scale-110">
                        <EuroIcon className="h-7 w-7 text-white" />
                      </div>
                    </Flex>
                    {!isLoadingStats && statistics?.revenueChange && (
                      <Flex className="mt-3 space-x-2 relative z-10 px-1 pb-1">
                        <div className={`flex text-xs items-center ${statistics.revenueChange > 0 ? 'text-emerald-500' : 'text-rose-500'} rounded-full px-2.5 py-1.5 ${statistics.revenueChange > 0 ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' : 'bg-rose-500/15 ring-1 ring-rose-500/30'} font-medium shadow-sm`}>
                          {statistics.revenueChange > 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1.5 stroke-[2.5]" /> : 
                            <TrendingUp className="h-4 w-4 mr-1.5 transform rotate-180 stroke-[2.5]" />
                          }
                          <span className="font-bold">{Math.abs(statistics.revenueChange)}%</span>
                        </div>
                        <Text className="text-xs text-muted-foreground font-medium">{t("dashboard.comparedToPrevious", "em relação ao período anterior")}</Text>
                      </Flex>
                    )}
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={3} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-800/70 backdrop-blur-lg border border-emerald-500/30 overflow-hidden relative rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 animate-gradient-x"></div>
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/20 filter blur-xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-emerald-400/10 filter blur-lg group-hover:bg-emerald-400/20 transition-all duration-500"></div>
                    
                    <Flex alignItems="start" className="relative z-10 p-1">
                      <div className="flex-1">
                        <Text className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">{t("dashboard.netProfit", "Lucro Líquido")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-10 w-36 mt-2" />
                        ) : (
                          <Metric className="text-emerald-600 dark:text-emerald-400 font-extrabold text-3xl mt-1 leading-tight">{formatCurrency(statistics?.netProfit || 0)}</Metric>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3.5 rounded-full shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300 transform group-hover:scale-110">
                        <TrendingUp className="h-7 w-7 text-white" />
                      </div>
                    </Flex>
                    {!isLoadingStats && statistics?.profitChange && (
                      <Flex className="mt-3 space-x-2 relative z-10 px-1 pb-1">
                        <div className={`flex text-xs items-center ${statistics.profitChange > 0 ? 'text-emerald-500' : 'text-rose-500'} rounded-full px-2.5 py-1.5 ${statistics.profitChange > 0 ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' : 'bg-rose-500/15 ring-1 ring-rose-500/30'} font-medium shadow-sm`}>
                          {statistics.profitChange > 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1.5 stroke-[2.5]" /> : 
                            <TrendingUp className="h-4 w-4 mr-1.5 transform rotate-180 stroke-[2.5]" />
                          }
                          <span className="font-bold">{Math.abs(statistics.profitChange)}%</span>
                        </div>
                        <Text className="text-xs text-muted-foreground font-medium">{t("dashboard.comparedToPrevious", "em relação ao período anterior")}</Text>
                      </Flex>
                    )}
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={4} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-800/70 backdrop-blur-lg border border-amber-500/30 overflow-hidden relative rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 animate-gradient-x"></div>
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-amber-500/20 filter blur-xl group-hover:bg-amber-500/30 transition-all duration-500"></div>
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-amber-400/10 filter blur-lg group-hover:bg-amber-400/20 transition-all duration-500"></div>
                    
                    <Flex alignItems="start" className="relative z-10 p-1">
                      <div className="flex-1">
                        <Text className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">{t("dashboard.occupancyRate", "Taxa de Ocupação")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-10 w-36 mt-2" />
                        ) : (
                          <Metric className="text-amber-600 dark:text-amber-400 font-extrabold text-3xl mt-1 leading-tight">
                            {statistics?.occupancyRate ? `${statistics.occupancyRate.toFixed(1)}%` : '0%'}
                          </Metric>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3.5 rounded-full shadow-lg group-hover:shadow-amber-500/30 transition-all duration-300 transform group-hover:scale-110">
                        <UserCheck className="h-7 w-7 text-white" />
                      </div>
                    </Flex>
                    <Flex justifyContent="between" alignItems="center" className="relative z-10 px-1 pb-1 pt-3">
                      <div className="space-y-1 w-full">
                        <div className="flex items-center justify-between">
                          <Text className="text-xs text-muted-foreground font-medium">{t("dashboard.target", "Meta")}: 85%</Text>
                          <Text className="text-xs font-semibold" style={{ 
                            color: statistics && statistics.occupancyRate >= 85 ? '#059669' : '#dc2626'
                          }}>
                            {statistics && statistics.occupancyRate ? `${((statistics.occupancyRate / 85) * 100).toFixed(0)}%` : '0%'}
                          </Text>
                        </div>
                        <ProgressBar
                          value={statistics?.occupancyRate ? statistics.occupancyRate : 0}
                          showAnimation={true}
                          className="h-1.5"
                          color={statistics && statistics.occupancyRate >= 85 ? 'emerald' : 'rose'}
                          style={{ color: calculateOccupancyColor(statistics?.occupancyRate || 0) }}
                        />
                      </div>
                    </Flex>
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={5} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-800/70 backdrop-blur-lg border border-indigo-500/30 overflow-hidden relative rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 animate-gradient-x"></div>
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-indigo-500/20 filter blur-xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-400/10 filter blur-lg group-hover:bg-indigo-400/20 transition-all duration-500"></div>
                    
                    <Flex alignItems="start" className="relative z-10 p-1">
                      <div className="flex-1">
                        <Text className="text-muted-foreground font-semibold text-sm uppercase tracking-wide">{t("dashboard.totalReservations", "Total de Reservas")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-10 w-36 mt-2" />
                        ) : (
                          <Metric className="text-indigo-600 dark:text-indigo-400 font-extrabold text-3xl mt-1 leading-tight">
                            {statistics?.reservationsCount || 0}
                          </Metric>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3.5 rounded-full shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 transform group-hover:scale-110">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                    </Flex>
                    {!isLoadingStats && statistics?.reservationsChange && (
                      <Flex className="mt-3 space-x-2 relative z-10 px-1 pb-1">
                        <div className={`flex text-xs items-center ${statistics.reservationsChange > 0 ? 'text-emerald-500' : 'text-rose-500'} rounded-full px-2.5 py-1.5 ${statistics.reservationsChange > 0 ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' : 'bg-rose-500/15 ring-1 ring-rose-500/30'} font-medium shadow-sm`}>
                          {statistics.reservationsChange > 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1.5 stroke-[2.5]" /> : 
                            <TrendingUp className="h-4 w-4 mr-1.5 transform rotate-180 stroke-[2.5]" />
                          }
                          <span className="font-bold">{Math.abs(statistics.reservationsChange)}%</span>
                        </div>
                        <Text className="text-xs text-muted-foreground font-medium">{t("dashboard.comparedToPrevious", "em relação ao período anterior")}</Text>
                      </Flex>
                    )}
                  </Card>
                </motion.div>
              </div>

              {/* Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <motion.div 
                  custom={6} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-lg border border-blue-500/20 overflow-hidden relative rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-400 to-emerald-500 animate-gradient-x"></div>
                    <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-blue-500/10 filter blur-xl group-hover:bg-blue-500/15 transition-all duration-500"></div>
                    <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-emerald-500/10 filter blur-xl group-hover:bg-emerald-500/15 transition-all duration-500"></div>
                    <div className="relative z-10 p-2">
                      <Flex alignItems="center" justifyContent="between" className="mb-2">
                        <div>
                          <Title className="text-foreground/90 font-bold">{t("dashboard.revenueVsProfit", "Receita vs Lucro")}</Title>
                          <Text className="text-xs text-muted-foreground">Tendência financeira ao longo do tempo</Text>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-2.5 py-1">
                          {getGranularityLabel()}
                        </Badge>
                      </Flex>
                      <div className="h-[300px] mt-6 mb-2">
                        <RevenueVsProfitChart 
                          data={revenueData} 
                          isLoading={isLoadingStats} 
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={7} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-lg border border-rose-500/20 overflow-hidden relative rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-rose-400 to-rose-600 animate-gradient-x"></div>
                    <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-rose-500/10 filter blur-xl group-hover:bg-rose-500/15 transition-all duration-500"></div>
                    <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-emerald-500/10 filter blur-xl group-hover:bg-emerald-500/15 transition-all duration-500"></div>
                    <div className="relative z-10 p-2">
                      <Flex alignItems="center" justifyContent="between" className="mb-2">
                        <div>
                          <Title className="text-foreground/90 font-bold">{t("dashboard.financialBreakdown", "Distribuição Financeira")}</Title>
                          <Text className="text-xs text-muted-foreground">Alocação de receitas e despesas</Text>
                        </div>
                        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 px-2.5 py-1">
                          Relatório Atual
                        </Badge>
                      </Flex>
                      <div className="h-[300px] mt-6 mb-2">
                        <FinancialDistributionChart 
                          data={financialData}
                          totalValue={statistics?.totalRevenue || 0}
                          isLoading={isLoadingStats}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            
              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <motion.div 
                  custom={8} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <Card className="hover:shadow-md transition-all bg-background/70 backdrop-blur-sm border border-border/30 h-[500px]">
                    <Title className="px-6 pt-5">{t("reservations.recentReservations", "Reservas Recentes")}</Title>
                    <Text className="px-6 text-muted-foreground mb-4">
                      {t("reservations.recentReservationsSubtitle", "As reservas mais recentes em todas as propriedades")}
                    </Text>
                    <Separator className="mb-2" />
                    <ScrollArea className="h-[380px] px-1">
                      <RecentReservations 
                        reservations={recentReservations} 
                        isLoading={isLoadingReservations} 
                      />
                    </ScrollArea>
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={9} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <Card className="hover:shadow-md transition-all bg-background/70 backdrop-blur-sm border border-border/30 h-[500px]">
                    <Title className="px-6 pt-5">{t("activities.recentActivity", "Atividade Recente")}</Title>
                    <Text className="px-6 text-muted-foreground mb-4">
                      {t("activities.recentActivitySubtitle", "Registro de ações e eventos no sistema")}
                    </Text>
                    <Separator className="mb-2" />
                    <ScrollArea className="h-[380px] px-1">
                      <RecentActivity 
                        activities={activities} 
                        isLoading={isLoadingActivities} 
                      />
                    </ScrollArea>
                  </Card>
                </motion.div>
              </div>
              
              {/* Demo data manager */}
              <div className="mt-8">
                <motion.div 
                  custom={11} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <DemoDataManager />
                </motion.div>
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="grid grid-cols-1 gap-6 mt-6">
                <Card className="bg-background/70 backdrop-blur-sm border border-border/30 p-6">
                  <div className="max-w-3xl mx-auto text-center">
                    <h3 className="text-2xl font-bold mt-6 mb-3">
                      {t("dashboard.detailedDescription", "Análise detalhada de receitas, despesas e lucratividade por propriedade.")}
                    </h3>
                    <p className="text-muted-foreground mb-8">
                      {t("dashboard.comingSoon", "Análise detalhada em desenvolvimento. Disponível em breve!")}
                    </p>
                    
                    <div className="flex justify-center mb-10">
                      <Button 
                        variant="default" 
                        onClick={() => setSelectedTab("overview")}
                        className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 transition-all px-8"
                      >
                        {t("dashboard.backToOverview", "Voltar para Visão Geral")}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                      <Card className="p-4 bg-background/50 border border-border/20">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                            <LineChart className="h-7 w-7" />
                          </div>
                          <h4 className="text-lg font-semibold mb-2">Análise Financeira</h4>
                          <p className="text-sm text-muted-foreground">Indicadores detalhados de performance financeira</p>
                        </div>
                      </Card>
                      
                      <Card className="p-4 bg-background/50 border border-border/20">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                            <BarChart3 className="h-7 w-7" />
                          </div>
                          <h4 className="text-lg font-semibold mb-2">Relatórios Proprietários</h4>
                          <p className="text-sm text-muted-foreground">Resumos por proprietário e propriedade</p>
                        </div>
                      </Card>
                      
                      <Card className="p-4 bg-background/50 border border-border/20">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 mb-4">
                            <Users className="h-7 w-7" />
                          </div>
                          <h4 className="text-lg font-semibold mb-2">Análise de Ocupação</h4>
                          <p className="text-sm text-muted-foreground">Estatísticas detalhadas de ocupação</p>
                        </div>
                      </Card>
                    </div>
                  </div>
                </Card>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </motion.div>
    </div>
  );
}