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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Calendar, Activity } from "lucide-react";
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

interface Statistics {
  totalRevenue: number;
  netProfit: number;
  occupancyRate: number;
  reservationsCount: number;
  topProperties: PropertyStatistics[];
}

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
  
  // All hooks called unconditionally at component top level
  const { data: statistics, isLoading: isLoadingStats } = useQuery<Statistics>({
    queryKey: ["/api/statistics", selectedDateRange.startDate, selectedDateRange.endDate],
  });
  
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  
  const { data: ownersData, isLoading: isLoadingOwners } = useQuery({
    queryKey: ['/api/owners'],
    retry: 1,
  });
  
  const { data: reservationsData, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['/api/reservations'],
    retry: 1,
  });
  
  const { data: propertiesData, isLoading: isLoadingPropertiesData } = useQuery({
    queryKey: ['/api/properties'],
    retry: 1,
  });
  
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/reservations/dashboard'],
    retry: 1,
  });
  
  const { data: propertyStats, isLoading: isLoadingPropertyStats } = useQuery<PropertyStatistics>({
    queryKey: ["/api/statistics/property", selectedPropertyId !== "all" ? parseInt(selectedPropertyId) : undefined],
    enabled: selectedPropertyId !== "all",
  });

  // Calculate owner revenues with proper error handling
  const ownerRevenues = (() => {
    if (!ownersData || !reservationsData || !propertiesData) return [];
    
    return ownersData.map((owner: any) => {
      const ownerProperties = propertiesData.filter((prop: any) => prop.ownerId === owner.id);
      const ownerReservations = reservationsData.filter((res: any) => 
        ownerProperties.some((prop: any) => prop.id === res.propertyId)
      );
      const totalRevenue = ownerReservations.reduce((sum: number, res: any) => 
        sum + (parseFloat(res.totalAmount) || 0), 0
      );
      return { ...owner, totalRevenue };
    }).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue).slice(0, 3);
  })();

  // Calculate today's activities with proper error handling
  const todayActivities = (() => {
    if (!dashboardData) return { checkIns: [], checkOuts: [], cleanings: [] };
    
    const today = new Date();
    const { checkIns = [], checkOuts = [], cleanings = [] } = dashboardData;
    
    return {
      checkIns: checkIns.filter((item: any) => 
        new Date(item.checkInDate).toDateString() === today.toDateString()
      ),
      checkOuts: checkOuts.filter((item: any) => 
        new Date(item.checkOutDate).toDateString() === today.toDateString()
      ),
      cleanings: cleanings.filter((item: any) => 
        new Date(item.scheduledDate).toDateString() === today.toDateString()
      )
    };
  })();

  // Calculate occupancy rates with improved formula
  const ownerOccupancy = (() => {
    if (!ownersData || !propertiesData || !reservationsData) return [];
    
    return ownersData.map((owner: any) => {
      const ownerProperties = propertiesData.filter((prop: any) => prop.ownerId === owner.id);
      const ownerReservations = reservationsData.filter((res: any) => 
        ownerProperties.some((prop: any) => prop.id === res.propertyId)
      );
      
      // Improved occupancy calculation - based on actual date ranges
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const totalDaysInPeriod = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const totalDaysAvailable = ownerProperties.length * totalDaysInPeriod;
      
      const totalDaysBooked = ownerReservations.reduce((sum: number, res: any) => {
        if (res.checkInDate && res.checkOutDate) {
          const checkIn = new Date(res.checkInDate);
          const checkOut = new Date(res.checkOutDate);
          const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          return sum + (days > 0 ? days : 0);
        }
        return sum;
      }, 0);
      
      const occupancyRate = totalDaysAvailable > 0 ? 
        Math.min(100, Math.round((totalDaysBooked / totalDaysAvailable) * 100)) : 0;
      
      return { ...owner, occupancyRate, reservationCount: ownerReservations.length };
    }).filter((owner: any) => owner.reservationCount > 0 || owner.occupancyRate > 0)
      .sort((a: any, b: any) => b.occupancyRate - a.occupancyRate)
      .slice(0, 5);
  })();

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

  // Calculate total revenue from reservations
  const totalRevenueFromReservations = reservationsData ? 
    reservationsData.reduce((sum: number, res: any) => sum + (parseFloat(res.totalAmount) || 0), 0) : 0;

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
                <SelectValue placeholder={t("reports.allProperties", "Todas as propriedades")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as propriedades</SelectItem>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {t("reports.export", "Exportar")}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">{t("reports.overview", "Visão Geral")}</TabsTrigger>
          <TabsTrigger value="operational">{t("reports.operational", "Operacional")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Main KPI Cards */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatsCardWithQuote
              title={t("dashboard.totalRevenue", "Receita Total")}
              value={formatCurrency(statistics?.totalRevenue || 0)}
              description={t("dashboard.comparedToPrevious", "Comparado ao período anterior")}
              quote="Revenue is the lifeblood of business growth."
              loading={isLoadingStats}
            />
            
            <StatsCardWithQuote
              title={t("dashboard.netProfit", "Lucro Líquido")}
              value={formatCurrency(statistics?.netProfit || 0)}
              description={t("dashboard.comparedToPrevious", "Comparado ao período anterior")}
              quote="Profit is the measure of true value creation."
              loading={isLoadingStats}
            />
            
            <StatsCardWithQuote
              title={t("dashboard.occupancyRate", "Taxa de Ocupação")}
              value={`${statistics?.occupancyRate || 0}%`}
              description={t("dashboard.comparedToPrevious", "Comparado ao período anterior")}
              quote="High occupancy reflects excellent service quality."
              loading={isLoadingStats}
            />
            
            <StatsCardWithQuote
              title={t("dashboard.totalReservations", "Total de Reservas")}
              value={statistics?.reservationsCount || 0}
              description={t("dashboard.comparedToPrevious", "Comparado ao período anterior")}
              quote="Every reservation is a new opportunity to excel."
              loading={isLoadingStats}
            />
          </div>

          {/* Revenue and Performance Charts */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Proprietários por Receita</CardTitle>
                <CardDescription>Maiores geradores de receita</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats || isLoadingOwners || isLoadingPropertiesData || isLoadingReservations ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : ownerRevenues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum dado de receita disponível</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Proprietário</span>
                      <span className="font-medium">Receita Total</span>
                    </div>
                    {ownerRevenues.map((owner: any) => (
                      <div key={owner.id} className="flex justify-between items-center">
                        <span>{owner.name}</span>
                        <span className="font-medium">{formatCurrency(owner.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Receita Total</CardTitle>
                <CardDescription>Valor total das reservas</CardDescription>
              </CardHeader>
              <CardContent className="h-48">
                {isLoadingReservations ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {formatCurrency(totalRevenueFromReservations)}
                      </div>
                      <p className="text-sm text-muted-foreground">Receita Total das Reservas</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reservationsData?.length || 0} reserva{(reservationsData?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Desempenho por Proprietário</CardTitle>
                <CardDescription>Taxa de ocupação por proprietário</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats || isLoadingOwners || isLoadingPropertiesData || isLoadingReservations ? (
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
                ) : ownerOccupancy.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum dado de ocupação disponível</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ownerOccupancy.map((owner: any) => (
                      <div key={owner.id} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{owner.name}</span>
                          <span>{owner.occupancyRate}%</span>
                        </div>
                        <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ width: `${owner.occupancyRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Relatórios Operacionais</h3>
              <p className="text-muted-foreground">Acompanhe as atividades diárias do seu negócio</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
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
                {isLoadingDashboard ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-2xl">{todayActivities.checkIns.length}</span>
                      <span className="text-muted-foreground">Previstos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ width: `${todayActivities.checkIns.length > 0 ? 70 : 0}%` }}
                      />
                      <div 
                        className="h-2 bg-secondary-200 rounded-full" 
                        style={{ width: `${todayActivities.checkIns.length > 0 ? 30 : 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{todayActivities.checkIns.filter((ci: any) => ci.status === 'checked-in').length} Concluídos</span>
                      <span>{todayActivities.checkIns.filter((ci: any) => ci.status === 'confirmed').length} Pendentes</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Check-outs de Hoje</CardTitle>
                <CardDescription>Saídas programadas</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-2xl">{todayActivities.checkOuts.length}</span>
                      <span className="text-muted-foreground">Previstos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ width: `${todayActivities.checkOuts.length > 0 ? 75 : 0}%` }}
                      />
                      <div 
                        className="h-2 bg-secondary-200 rounded-full" 
                        style={{ width: `${todayActivities.checkOuts.length > 0 ? 25 : 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{todayActivities.checkOuts.filter((co: any) => co.status === 'completed').length} Concluídos</span>
                      <span>{todayActivities.checkOuts.filter((co: any) => co.status !== 'completed').length} Pendentes</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Limpezas de Hoje</CardTitle>
                <CardDescription>Limpezas agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-2xl">{todayActivities.cleanings.length}</span>
                      <span className="text-muted-foreground">Agendadas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-2 bg-purple-500 rounded-full" 
                        style={{ width: `${todayActivities.cleanings.length > 0 ? 60 : 0}%` }}
                      />
                      <div 
                        className="h-2 bg-secondary-200 rounded-full" 
                        style={{ width: `${todayActivities.cleanings.length > 0 ? 40 : 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{todayActivities.cleanings.filter((cl: any) => cl.status === 'completed').length} Concluídas</span>
                      <span>{todayActivities.cleanings.filter((cl: any) => cl.status !== 'completed').length} Pendentes</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageWithInspiration>
  );
}