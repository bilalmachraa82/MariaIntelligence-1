import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CalendarIcon, Building2, TrendingUp, Users, Percent, Banknote, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateRangePicker, DateRange } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { BarChart, LineChart, DonutChart } from '@tremor/react';
import { format, subMonths, isValid } from 'date-fns';
import { useProperties } from '@/hooks/useProperties';
import { apiRequest } from '@/lib/queryClient';

// Interfaces para tipagem de dados
interface PropertyStatistics {
  propertyId: number;
  propertyName: string;
  totalRevenue: number;
  totalReservations: number;
  averageStay: number;
  occupancyRate: number;
}

interface MonthlyRevenueData {
  date: string;
  revenue: number;
  profit: number;
}

export default function PropertyStatisticsPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { data: properties } = useProperties();
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  
  const [statistics, setStatistics] = useState<PropertyStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>([]);
  
  // Fetch statistics when property or date range changes
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!selectedPropertyId) return;
      
      setIsLoading(true);
      try {
        // Fetch property-specific statistics
        const propertyStats = await apiRequest<PropertyStatistics>(
          `/api/statistics/property/${selectedPropertyId}`
        );
        
        setStatistics(propertyStats);
        
        // Fetch monthly revenue data for the selected property and date range
        if (dateRange.from && dateRange.to && isValid(dateRange.from) && isValid(dateRange.to)) {
          const startDate = format(dateRange.from, 'yyyy-MM-dd');
          const endDate = format(dateRange.to, 'yyyy-MM-dd');
          
          const monthlyRevenue = await apiRequest<{ data: MonthlyRevenueData[] }>(
            `/api/statistics/monthly-revenue?propertyId=${selectedPropertyId}&startDate=${startDate}&endDate=${endDate}`
          );
          
          if (monthlyRevenue && monthlyRevenue.data) {
            setMonthlyData(monthlyRevenue.data);
          }
        }
      } catch (error) {
        console.error('Error fetching property statistics:', error);
        setStatistics(null);
        setMonthlyData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatistics();
  }, [selectedPropertyId, dateRange]);
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };
  
  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/properties")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Voltar')}
        </Button>
        <h2 className="text-2xl font-bold text-secondary-900 ml-2">
          {t('properties.statistics.title', 'Estatísticas de Imóveis')}
        </h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('properties.statistics.filters', 'Filtros')}</CardTitle>
          <CardDescription>
            {t('properties.statistics.filtersDescription', 'Selecione um imóvel e um período para analisar')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="property">{t('properties.select', 'Selecionar Imóvel')}</Label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t('properties.selectProperty', 'Selecione um imóvel')} />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{t('common.period', 'Período')}</Label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center py-10">
              <div className="animate-spin w-6 h-6 border-2 border-primary rounded-full border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground">{t('common.loading', 'Carregando...')}</p>
            </div>
          </CardContent>
        </Card>
      ) : selectedPropertyId && statistics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI Cards */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('properties.statistics.totalRevenue', 'Receita Total')}
                    </p>
                    <p className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('properties.statistics.occupancyRate', 'Taxa de Ocupação')}
                    </p>
                    <p className="text-2xl font-bold">{formatPercentage(statistics.occupancyRate)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <Progress className="mt-3" value={statistics.occupancyRate} max={100} />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('properties.statistics.totalReservations', 'Total de Reservas')}
                    </p>
                    <p className="text-2xl font-bold">{statistics.totalReservations}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {t('properties.statistics.averageStay', 'Estadia Média')}
                    </p>
                    <p className="text-2xl font-bold">
                      {statistics.averageStay.toFixed(1)} {t('common.days', 'dias')}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('properties.statistics.revenueTrend', 'Tendência de Receita')}</CardTitle>
                <CardDescription>
                  {t('properties.statistics.revenueTrendDescription', 'Evolução da receita ao longo do período selecionado')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <div className="h-[300px]">
                    <LineChart
                      data={monthlyData}
                      index="date"
                      categories={["revenue", "profit"]}
                      colors={["blue", "emerald"]}
                      valueFormatter={formatCurrency}
                      showLegend={true}
                      showGridLines={false}
                      showAnimation={true}
                      className="h-full"
                      yAxisWidth={80}
                    />
                  </div>
                ) : (
                  <div className="py-10 text-center text-muted-foreground">
                    {t('properties.statistics.noDataAvailable', 'Sem dados disponíveis para o período selecionado')}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Booking Distribution and Occupancy Charts */}
            {monthlyData.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('properties.statistics.occupancyByMonth', 'Ocupação por Mês')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <BarChart
                        data={monthlyData.map(item => ({
                          date: item.date,
                          Ocupação: Math.random() * 100, // Dados simulados, substituir por dados reais
                        }))}
                        index="date"
                        categories={["Ocupação"]}
                        colors={["indigo"]}
                        valueFormatter={formatPercentage}
                        showLegend={false}
                        showGridLines={false}
                        className="h-full"
                        yAxisWidth={70}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>{t('properties.statistics.bookingDistribution', 'Distribuição de Reservas')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <DonutChart
                        data={[
                          { name: 'Booking.com', value: 40 },
                          { name: 'Airbnb', value: 30 },
                          { name: 'VRBO', value: 20 },
                          { name: 'Direto', value: 10 },
                        ]}
                        category="value"
                        index="name"
                        colors={["indigo", "emerald", "amber", "rose"]}
                        valueFormatter={(value) => `${value}%`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('properties.statistics.selectPropertyPrompt', 'Selecione um imóvel para visualizar estatísticas')}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t('properties.statistics.statsDescription', 'Visualize dados de desempenho, ocupação e receita para qualquer imóvel na sua carteira.')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}