import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
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
import { Download } from "lucide-react";

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
    { name: 'Receita', value: statistics?.totalRevenue || 0 },
    { name: 'Custos Operacionais', value: statistics?.totalRevenue ? statistics.totalRevenue - statistics.netProfit : 0 }
  ];

  // Prepare occupation data for selected property
  const occupancyData = [
    { name: 'Ocupado', value: propertyStats?.occupancyRate || 0 },
    { name: 'Disponível', value: 100 - (propertyStats?.occupancyRate || 0) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Relatórios</h2>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          <Select 
            value={selectedDateRange.label} 
            onValueChange={handleDateRangeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
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
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Propriedade" />
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
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

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
    </div>
  );
}
