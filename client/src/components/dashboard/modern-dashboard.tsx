import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  FileUp, 
  Calendar, 
  DollarSign, 
  Percent, 
  AlertCircle,
  Download,
  TrendingUp,
  ArrowRight,
  PieChart,
  Users,
  BarChart3,
  Home
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
      {/* Header with modern style */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        custom={0}
        className="relative"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              {t("dashboard.title", "Dashboard")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.description", "Visão geral do seu negócio de aluguel de imóveis")}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select 
              value={selectedDateRange.label} 
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder={t("dashboard.period", "Período")} />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation("/upload-pdf")}
              className="whitespace-nowrap"
            >
              <FileUp className="mr-2 h-4 w-4" />
              {t("pdfUpload.uploadButton", "Importar PDF")}
            </Button>
            
            <Button 
              variant="default"
              className="whitespace-nowrap"
              onClick={() => {
                alert(t("dashboard.exportNotImplemented", 'Exportação de dados implementada na versão completa'));
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              {t("dashboard.export", "Exportar")}
            </Button>
          </div>
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
          <TabList variant="pills" className="mt-6">
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
                >
                  <Card decoration="top" decorationColor="blue" className="hover:shadow-md transition-all">
                    <Flex alignItems="start">
                      <div>
                        <Text>{t("dashboard.totalRevenue", "Receita Total")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-9 w-32 mt-2" />
                        ) : (
                          <Metric>{formatCurrency(statistics?.totalRevenue || 0)}</Metric>
                        )}
                      </div>
                      <div className="bg-blue-100 p-2 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-500" />
                      </div>
                    </Flex>
                    {!isLoadingStats && statistics?.revenueChange && (
                      <Flex className="mt-4 space-x-2">
                        <div className={`flex text-xs items-center ${statistics.revenueChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {statistics.revenueChange > 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1" /> : 
                            <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                          }
                          <span className="font-medium">{Math.abs(statistics.revenueChange)}%</span>
                        </div>
                        <Text>{t("dashboard.comparedToPrevious", "em relação ao período anterior")}</Text>
                      </Flex>
                    )}
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={3} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <Card decoration="top" decorationColor="emerald" className="hover:shadow-md transition-all">
                    <Flex alignItems="start">
                      <div>
                        <Text>{t("dashboard.netProfit", "Lucro Líquido")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-9 w-32 mt-2" />
                        ) : (
                          <Metric>{formatCurrency(statistics?.netProfit || 0)}</Metric>
                        )}
                      </div>
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                      </div>
                    </Flex>
                    {!isLoadingStats && statistics?.profitChange && (
                      <Flex className="mt-4 space-x-2">
                        <div className={`flex text-xs items-center ${statistics.profitChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {statistics.profitChange > 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1" /> : 
                            <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                          }
                          <span className="font-medium">{Math.abs(statistics.profitChange)}%</span>
                        </div>
                        <Text>{t("dashboard.comparedToPrevious", "em relação ao período anterior")}</Text>
                      </Flex>
                    )}
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={4} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <Card decoration="top" decorationColor="amber" className="hover:shadow-md transition-all">
                    <Flex alignItems="start">
                      <div>
                        <Text>{t("dashboard.occupancyRate", "Taxa de Ocupação")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-9 w-32 mt-2" />
                        ) : (
                          <Metric>{Math.round(statistics?.occupancyRate || 0)}%</Metric>
                        )}
                      </div>
                      <div className="bg-amber-100 p-2 rounded-full">
                        <Percent className="h-6 w-6 text-amber-500" />
                      </div>
                    </Flex>
                    {!isLoadingStats && (
                      <div className="mt-4">
                        <Flex className="mt-2">
                          <Text>{t("dashboard.target", "Meta")}: 75%</Text>
                          <Text>{Math.round(statistics?.occupancyRate || 0)}%</Text>
                        </Flex>
                        <ProgressBar value={statistics?.occupancyRate || 0} color="amber" className="mt-2" />
                      </div>
                    )}
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={5} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <Card decoration="top" decorationColor="indigo" className="hover:shadow-md transition-all">
                    <Flex alignItems="start">
                      <div>
                        <Text>{t("dashboard.totalReservations", "Total de Reservas")}</Text>
                        {isLoadingStats ? (
                          <Skeleton className="h-9 w-32 mt-2" />
                        ) : (
                          <Metric>{statistics?.reservationsCount || 0}</Metric>
                        )}
                      </div>
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Calendar className="h-6 w-6 text-indigo-500" />
                      </div>
                    </Flex>
                    {!isLoadingStats && statistics?.reservationsChange && (
                      <Flex className="mt-4 space-x-2">
                        <div className={`flex text-xs items-center ${statistics?.reservationsChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {statistics?.reservationsChange > 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1" /> : 
                            <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                          }
                          <span className="font-medium">{Math.abs(statistics?.reservationsChange)}%</span>
                        </div>
                        <Text>{t("dashboard.comparedToPrevious", "em relação ao período anterior")}</Text>
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
                >
                  <Card className="hover:shadow-md transition-all">
                    <Title>{t("dashboard.revenueVsProfit", "Receita vs Lucro")}</Title>
                    <div className="h-[300px] mt-4">
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
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-muted-foreground">{t("dashboard.noDataAvailable", "Não há dados disponíveis.")}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={7} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <Card className="hover:shadow-md transition-all">
                    <Title>{t("dashboard.financialBreakdown", "Distribuição Financeira")}</Title>
                    <div className="h-[300px] mt-4">
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
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-muted-foreground">{t("dashboard.noDataAvailable", "Não há dados disponíveis.")}</p>
                        </div>
                      )}
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
              >
                <Card className="hover:shadow-md transition-all">
                  <Title>{t("dashboard.propertyOccupancy", "Taxa de Ocupação por Propriedade")}</Title>
                  <div className="h-[300px] mt-4">
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
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">{t("dashboard.noDataAvailable", "Não há dados disponíveis.")}</p>
                      </div>
                    )}
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
                >
                  <Card className="hover:shadow-md transition-all">
                    <Flex alignItems="center" justifyContent="between" className="mb-4">
                      <Title>{t("dashboard.recentActivity", "Atividade Recente")}</Title>
                      <Button variant="link" size="sm" onClick={() => alert(t("dashboard.notImplemented", "Funcionalidade não implementada"))}>
                        {t("dashboard.viewAll", "Ver Tudo")}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Flex>
                    <div className="space-y-5">
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
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              {activity.type === 'reservation_created' && <Calendar className="h-5 w-5 text-blue-500" />}
                              {activity.type === 'property_added' && <Home className="h-5 w-5 text-blue-500" />}
                              {activity.type === 'owner_added' && <Users className="h-5 w-5 text-blue-500" />}
                              {activity.type === 'assistant_chat' && <AlertCircle className="h-5 w-5 text-blue-500" />}
                              {!['reservation_created', 'property_added', 'owner_added', 'assistant_chat'].includes(activity.type) && 
                                <AlertCircle className="h-5 w-5 text-blue-500" />
                              }
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground">{t("dashboard.noActivities", "Não há atividades recentes.")}</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div 
                  custom={10} 
                  variants={fadeIn} 
                  initial="hidden" 
                  animate="visible"
                >
                  <Card className="hover:shadow-md transition-all">
                    <Flex alignItems="center" justifyContent="between" className="mb-4">
                      <Title>{t("dashboard.recentReservations", "Reservas Recentes")}</Title>
                      <Button variant="link" size="sm" onClick={() => setLocation("/reservations")}>
                        {t("dashboard.viewAll", "Ver Tudo")}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Flex>
                    <div className="space-y-5">
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
                          <div key={reservation.id} className="flex items-start space-x-3">
                            <div className="bg-indigo-100 p-2 rounded-full">
                              <Calendar className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="flex-1">
                              <Flex alignItems="center" justifyContent="between">
                                <p className="text-sm font-medium">{reservation.guestName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {reservation.status}
                                </Badge>
                              </Flex>
                              <Flex className="mt-1">
                                <Text className="text-xs text-muted-foreground">
                                  {format(new Date(reservation.checkInDate), "dd/MM/yyyy")} - {format(new Date(reservation.checkOutDate), "dd/MM/yyyy")}
                                </Text>
                                <Text className="text-xs font-medium">
                                  {formatCurrency(reservation.totalAmount)}
                                </Text>
                              </Flex>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground">{t("dashboard.noReservations", "Não há reservas recentes.")}</p>
                      )}
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
                <Card>
                  <Title>Análise Financeira Detalhada</Title>
                  <p className="text-muted-foreground mt-2">
                    {t("dashboard.detailedDescription", "Análise detalhada de receitas, despesas e lucratividade por propriedade.")}
                  </p>
                  
                  {/* Placeholder for more detailed data */}
                  <div className="mt-6">
                    <p className="text-muted-foreground text-center py-10">
                      {t("dashboard.comingSoon", "Análise detalhada em desenvolvimento. Disponível em breve!")}
                    </p>
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