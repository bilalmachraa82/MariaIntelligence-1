import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  FileUp, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Percent, 
  AlertCircle,
  Download,
  TrendingUp,
  ArrowRight,
  PieChart,
  Users,
  BarChart3,
  Home,
  Calendar,
  LineChart
} from "lucide-react";

// Tremor components
import { Card, Text, Metric, Flex, ProgressBar } from "@tremor/react";
import { 
  AreaChart, 
  Tab, 
  TabGroup, 
  TabList, 
  TabPanel, 
  TabPanels,
  BarChart,
  DonutChart,
  Title,
  Legend
} from "@tremor/react";

// UI components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Custom components
import { RecentReservations } from "./recent-reservations";
import { RecentActivity } from "./recent-activity";

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

export default function ModernDashboard() {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(dateRanges[0]);
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics", selectedDateRange.startDate, selectedDateRange.endDate],
  });

  // Fetch recent reservations
  const { data: reservations, isLoading: isLoadingReservations } = useQuery({
    queryKey: ["/api/reservations"],
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities?limit=4"],
  });

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    const selectedRange = dateRanges.find(range => range.label === value);
    if (selectedRange) {
      setSelectedDateRange(selectedRange);
    }
  };

  // Prepare data for charts
  const revenueData = statistics?.revenueByMonth?.map((item: any) => ({
    month: item.month,
    Receita: item.revenue,
    Lucro: item.profit
  })) || [];

  // Recent reservations data (latest 4)
  const recentReservations = reservations?.slice(0, 4) || [];

  // Preparing financial data for pie chart
  const financialData = [
    { name: 'Receita', value: statistics?.totalRevenue || 0 },
    { name: 'Despesas', value: statistics?.totalRevenue ? (statistics.totalRevenue - statistics.netProfit) : 0 }
  ];

  // Prepare property occupancy data
  const propertyOccupancyData = statistics?.topProperties?.map((property: any) => ({
    name: property.name,
    Ocupação: property.occupancyRate
  })) || [];

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
                        <DollarSign className="h-7 w-7 text-white" />
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
                          <Metric className="text-amber-600 dark:text-amber-400 font-extrabold text-3xl mt-1 leading-tight">{Math.round(statistics?.occupancyRate || 0)}%</Metric>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3.5 rounded-full shadow-lg group-hover:shadow-amber-500/30 transition-all duration-300 transform group-hover:scale-110">
                        <Percent className="h-7 w-7 text-white" />
                      </div>
                    </Flex>
                    {!isLoadingStats && (
                      <div className="mt-3 relative z-10 px-1 pb-1">
                        <Flex className="items-center justify-between mb-1.5">
                          <Text className="text-xs text-muted-foreground font-medium">{t("dashboard.target", "Meta")}: <span className="font-bold">75%</span></Text>
                          <Text className="text-xs font-bold">{Math.round(statistics?.occupancyRate || 0)}%</Text>
                        </Flex>
                        <div className="relative w-full h-2.5 bg-gray-200/30 dark:bg-gray-700/30 rounded-full overflow-hidden">
                          <div 
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 
                            ${statistics?.occupancyRate && statistics.occupancyRate >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-300' : 
                              statistics?.occupancyRate && statistics.occupancyRate >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 
                              'bg-gradient-to-r from-rose-500 to-rose-300'
                            }`}
                            style={{ width: `${Math.min(Math.max(statistics?.occupancyRate || 0, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
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
                          <Metric className="text-indigo-600 dark:text-indigo-400 font-extrabold text-3xl mt-1 leading-tight">{statistics?.reservationsCount || 0}</Metric>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3.5 rounded-full shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300 transform group-hover:scale-110">
                        <Calendar className="h-7 w-7 text-white" />
                      </div>
                    </Flex>
                    {!isLoadingStats && statistics?.reservationsChange && (
                      <Flex className="mt-3 space-x-2 relative z-10 px-1 pb-1">
                        <div className={`flex text-xs items-center ${statistics?.reservationsChange > 0 ? 'text-emerald-500' : 'text-rose-500'} rounded-full px-2.5 py-1.5 ${statistics?.reservationsChange > 0 ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' : 'bg-rose-500/15 ring-1 ring-rose-500/30'} font-medium shadow-sm`}>
                          {statistics?.reservationsChange > 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1.5 stroke-[2.5]" /> : 
                            <TrendingUp className="h-4 w-4 mr-1.5 transform rotate-180 stroke-[2.5]" />
                          }
                          <span className="font-bold">{Math.abs(statistics?.reservationsChange)}%</span>
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
                          Análise Mensal
                        </Badge>
                      </Flex>
                      <div className="h-[300px] mt-6 mb-2">
                        {isLoadingStats ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Skeleton className="h-full w-full" />
                          </div>
                        ) : revenueData.length > 0 ? (
                          <AreaChart
                            className="h-full"
                            data={revenueData}
                            index="month"
                            categories={["Receita", "Lucro"]}
                            colors={["blue", "emerald"]}
                            valueFormatter={(number) => `${formatCurrency(number)}`}
                            showLegend
                            showAnimation
                            showGradient={true}
                            showYAxis={true}
                            showXAxis={true}
                            animationDuration={1500}
                          />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            <LineChart className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-muted-foreground font-medium">{t("dashboard.noDataAvailable", "Não há dados disponíveis.")}</p>
                            <Text className="text-xs text-muted-foreground mt-1">Aguardando registros de receita e lucro</Text>
                          </div>
                        )}
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
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-600 via-purple-400 to-blue-500 animate-gradient-x"></div>
                    <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-blue-500/10 filter blur-xl group-hover:bg-blue-500/15 transition-all duration-500"></div>
                    <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-rose-500/10 filter blur-xl group-hover:bg-rose-500/15 transition-all duration-500"></div>
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
                        {isLoadingStats ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Skeleton className="h-full w-full" />
                          </div>
                        ) : statistics?.totalRevenue ? (
                          <DonutChart
                            className="h-full"
                            data={financialData}
                            category="value"
                            index="name"
                            valueFormatter={(number) => `${formatCurrency(number)}`}
                            colors={["blue", "rose"]}
                            showAnimation
                            showLabel
                            animationDuration={1500}
                          />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            <PieChart className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-muted-foreground font-medium">{t("dashboard.noDataAvailable", "Não há dados disponíveis.")}</p>
                            <Text className="text-xs text-muted-foreground mt-1">Aguardando registros financeiros</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Property Occupancy Chart */}
              <motion.div 
                custom={8} 
                variants={fadeIn} 
                initial="hidden" 
                animate="visible"
                className="mt-6"
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-lg border border-amber-500/20 overflow-hidden relative rounded-xl">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-amber-400 to-blue-600 animate-gradient-x"></div>
                  <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-blue-500/10 filter blur-xl group-hover:bg-blue-500/15 transition-all duration-500"></div>
                  <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-amber-500/10 filter blur-xl group-hover:bg-amber-500/15 transition-all duration-500"></div>
                  <div className="relative z-10 p-2">
                    <Flex alignItems="center" justifyContent="between" className="mb-2">
                      <div>
                        <Title className="text-foreground/90 font-bold">{t("dashboard.propertyOccupancy", "Taxa de Ocupação por Propriedade")}</Title>
                        <Text className="text-xs text-muted-foreground">Análise de rendimento por imóvel</Text>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 px-2.5 py-1">
                        Comparativo
                      </Badge>
                    </Flex>
                    <div className="h-[300px] mt-6 mb-2">
                      {isLoadingStats ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : propertyOccupancyData.length > 0 ? (
                        <BarChart
                          className="h-full"
                          data={propertyOccupancyData}
                          index="name"
                          categories={["Ocupação"]}
                          colors={["blue"]}
                          valueFormatter={(number) => `${number.toFixed(1)}%`}
                          layout="vertical"
                          showLegend
                          showAnimation
                          animationDuration={1500}
                          showGridLines={false}
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center">
                          <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-muted-foreground font-medium">{t("dashboard.noDataAvailable", "Não há dados disponíveis.")}</p>
                          <Text className="text-xs text-muted-foreground mt-1">Aguardando dados de ocupação por propriedade</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Recent Activity & Reservations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <motion.div 
                  custom={9} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-lg border border-blue-500/20 overflow-hidden relative rounded-xl h-full">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600 animate-gradient-x"></div>
                    <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-blue-500/10 filter blur-xl group-hover:bg-blue-500/15 transition-all duration-500"></div>
                    <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-indigo-500/10 filter blur-xl group-hover:bg-indigo-500/15 transition-all duration-500"></div>
                    <div className="relative z-10 p-2">
                      <Flex alignItems="center" justifyContent="between" className="mb-2">
                        <div>
                          <Title className="text-foreground/90 font-bold">{t("dashboard.recentActivity", "Atividade Recente")}</Title>
                          <Text className="text-xs text-muted-foreground">Ações realizadas no sistema</Text>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all duration-200" onClick={() => alert(t("dashboard.notImplemented", "Funcionalidade não implementada"))}>
                          {t("dashboard.viewAll", "Ver Tudo")}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Flex>
                      <div className="space-y-4 mt-4">
                        {isLoadingActivities ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-start space-x-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                            </div>
                          ))
                        ) : activities && activities.length > 0 ? (
                          activities.map((activity: any, index: number) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded-lg transition-all duration-200 group/item">
                              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-full shadow-md group-hover/item:shadow-blue-500/30 transition-all duration-300">
                                {activity.type === 'reservation_created' && <Calendar className="h-5 w-5 text-white" />}
                                {activity.type === 'property_added' && <Home className="h-5 w-5 text-white" />}
                                {activity.type === 'owner_added' && <Users className="h-5 w-5 text-white" />}
                                {activity.type === 'assistant_chat' && <AlertCircle className="h-5 w-5 text-white" />}
                                {!['reservation_created', 'property_added', 'owner_added', 'assistant_chat'].includes(activity.type) && 
                                  <AlertCircle className="h-5 w-5 text-white" />
                                }
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{activity.description}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(activity.createdAt).toLocaleString(undefined, { 
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center">
                            <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-muted-foreground font-medium">{t("dashboard.noActivities", "Não há atividades recentes.")}</p>
                            <Text className="text-xs text-muted-foreground mt-1">Todas as suas ações aparecerão aqui</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={10} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-lg border border-indigo-500/20 overflow-hidden relative rounded-xl h-full">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 via-violet-400 to-indigo-600 animate-gradient-x"></div>
                    <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-indigo-500/10 filter blur-xl group-hover:bg-indigo-500/15 transition-all duration-500"></div>
                    <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-violet-500/10 filter blur-xl group-hover:bg-violet-500/15 transition-all duration-500"></div>
                    <div className="relative z-10 p-2">
                      <Flex alignItems="center" justifyContent="between" className="mb-2">
                        <div>
                          <Title className="text-foreground/90 font-bold">{t("dashboard.recentReservations", "Reservas Recentes")}</Title>
                          <Text className="text-xs text-muted-foreground">Últimas reservas registradas</Text>
                        </div>
                        <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all duration-200" onClick={() => setLocation("/reservations")}>
                          {t("dashboard.viewAll", "Ver Tudo")}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Flex>
                      <div className="space-y-4 mt-4">
                        {isLoadingReservations ? (
                          Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-start space-x-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                            </div>
                          ))
                        ) : recentReservations && recentReservations.length > 0 ? (
                          recentReservations.map((reservation: any) => (
                            <div key={reservation.id} className="flex items-start space-x-3 p-2 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 rounded-lg transition-all duration-200 group/item">
                              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-full shadow-md group-hover/item:shadow-indigo-500/30 transition-all duration-300">
                                <CalendarIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <Flex alignItems="center" justifyContent="between">
                                  <p className="text-sm font-medium">{reservation.guestName}</p>
                                  <Badge variant="outline" className={`text-xs font-medium ${
                                    reservation.status === 'confirmed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                                    reservation.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                                    reservation.status === 'cancelled' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                                    ''
                                  }`}>
                                    {reservation.status}
                                  </Badge>
                                </Flex>
                                <Flex className="mt-1.5 justify-between">
                                  <div className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                                    <Text className="text-xs text-muted-foreground">
                                      {format(new Date(reservation.checkInDate), "dd/MM")} - {format(new Date(reservation.checkOutDate), "dd/MM/yyyy")}
                                    </Text>
                                  </div>
                                  <Text className="text-xs font-medium">
                                    {formatCurrency(reservation.totalAmount)}
                                  </Text>
                                </Flex>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center">
                            <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-muted-foreground font-medium">{t("dashboard.noReservations", "Não há reservas recentes.")}</p>
                            <Text className="text-xs text-muted-foreground mt-1">As próximas reservas aparecerão aqui</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </TabPanel>
            
            <TabPanel>
              {/* Detailed financial view */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                custom={2}
                className="mt-6 grid grid-cols-1 gap-6"
              >
                <Card className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-lg border border-primary/20 overflow-hidden relative rounded-xl">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-400 to-violet-500 animate-gradient-x"></div>
                  <div className="absolute -right-40 -top-40 w-80 h-80 rounded-full bg-primary/5 filter blur-3xl group-hover:bg-primary/10 transition-all duration-500"></div>
                  <div className="absolute -left-40 -bottom-40 w-80 h-80 rounded-full bg-indigo-500/5 filter blur-3xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
                  
                  <div className="relative z-10 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Title className="text-foreground/90 font-bold text-2xl">Análise Financeira Detalhada</Title>
                        <Text className="text-muted-foreground mt-1">
                          {t("dashboard.detailedDescription", "Análise detalhada de receitas, despesas e lucratividade por propriedade.")}
                        </Text>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-3 py-1.5">
                        Premium
                      </Badge>
                    </div>
                    
                    {/* Placeholder for more detailed data */}
                    <div className="mt-8 mb-4 text-center">
                      <LineChart className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold mb-2">Análise detalhada em breve</h3>
                      <p className="text-muted-foreground max-w-xl mx-auto">
                        {t("dashboard.comingSoon", "Análise detalhada em desenvolvimento. Disponível em breve!")}
                      </p>
                      
                      <Button 
                        variant="outline" 
                        className="mt-6 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => alert(t("dashboard.notImplemented", "Funcionalidade não implementada"))}
                      >
                        Solicitar acesso antecipado
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </motion.div>
    </div>
  );
}