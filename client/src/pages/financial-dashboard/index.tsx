import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Euro,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  PieChart,
  BarChart3,
  Download,
  Calculator,
  Building2,
  Percent
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

interface Property {
  id: number;
  name: string;
  cleaningCost: string;
  checkInFee: string;
  commission: string;
  teamPayment: string;
  active: boolean;
  ownerName: string;
}

interface Reservation {
  id: number;
  propertyId: number;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  cleaningFee: string;
  checkInFee: string;
  commission: string;
  teamPayment: string;
  netAmount: string;
  status: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalCleaningCosts: number;
  totalCheckInFees: number;
  totalCommissions: number;
  totalTeamPayments: number;
  netProfit: number;
  averageBookingValue: number;
  propertiesWithRevenue: number;
}

export default function FinancialDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propertiesRes, reservationsRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/reservations')
      ]);

      const propertiesData = await propertiesRes.json();
      const reservationsData = await reservationsRes.json();

      setProperties(propertiesData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados por período e propriedade
  const getFilteredData = () => {
    let filtered = reservations;

    // Filtro por propriedade
    if (selectedProperty !== 'all') {
      filtered = filtered.filter(r => r.propertyId.toString() === selectedProperty);
    }

    // Filtro por período
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    switch (selectedPeriod) {
      case 'current-month':
        filtered = filtered.filter(r => {
          const checkIn = new Date(r.checkInDate);
          return checkIn.getMonth() + 1 === currentMonth && checkIn.getFullYear() === currentYear;
        });
        break;
      case 'last-month':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        filtered = filtered.filter(r => {
          const checkIn = new Date(r.checkInDate);
          return checkIn.getMonth() + 1 === lastMonth && checkIn.getFullYear() === lastMonthYear;
        });
        break;
      case 'current-year':
        filtered = filtered.filter(r => {
          const checkIn = new Date(r.checkInDate);
          return checkIn.getFullYear() === currentYear;
        });
        break;
      case 'all':
      default:
        break;
    }

    return filtered;
  };

  const filteredReservations = getFilteredData();

  // Calcular resumo financeiro
  const calculateFinancialSummary = (): FinancialSummary => {
    const totalRevenue = filteredReservations.reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0);
    const totalCleaningCosts = filteredReservations.reduce((sum, r) => sum + parseFloat(r.cleaningFee || '0'), 0);
    const totalCheckInFees = filteredReservations.reduce((sum, r) => sum + parseFloat(r.checkInFee || '0'), 0);
    const totalCommissions = filteredReservations.reduce((sum, r) => sum + parseFloat(r.commission || '0'), 0);
    const totalTeamPayments = filteredReservations.reduce((sum, r) => sum + parseFloat(r.teamPayment || '0'), 0);

    const netProfit = totalRevenue - totalCleaningCosts - totalCommissions - totalTeamPayments;
    const averageBookingValue = filteredReservations.length > 0 ? totalRevenue / filteredReservations.length : 0;

    const propertiesWithRevenue = new Set(filteredReservations.map(r => r.propertyId)).size;

    return {
      totalRevenue,
      totalCleaningCosts,
      totalCheckInFees,
      totalCommissions,
      totalTeamPayments,
      netProfit,
      averageBookingValue,
      propertiesWithRevenue
    };
  };

  const financialSummary = calculateFinancialSummary();

  // Dados para gráficos
  const getChartData = () => {
    // Receitas por propriedade
    const revenueByProperty = properties
      .map(property => {
        const propertyReservations = filteredReservations.filter(r => r.propertyId === property.id);
        const revenue = propertyReservations.reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0);
        return {
          name: property.name,
          revenue: revenue,
          reservations: propertyReservations.length
        };
      })
      .filter(item => item.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10

    // Distribuição de custos
    const costDistribution = [
      { name: 'Receita Líquida', value: financialSummary.netProfit, color: '#22c55e' },
      { name: 'Limpezas', value: financialSummary.totalCleaningCosts, color: '#f59e0b' },
      { name: 'Comissões', value: financialSummary.totalCommissions, color: '#ef4444' },
      { name: 'Pagamentos Equipa', value: financialSummary.totalTeamPayments, color: '#8b5cf6' }
    ].filter(item => item.value > 0);

    return { revenueByProperty, costDistribution };
  };

  const chartData = getChartData();

  // Análise de rentabilidade por propriedade
  const getPropertyProfitability = () => {
    return properties
      .map(property => {
        const propertyReservations = filteredReservations.filter(r => r.propertyId === property.id);
        const revenue = propertyReservations.reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0);
        const costs = propertyReservations.reduce((sum, r) =>
          sum + parseFloat(r.cleaningFee || '0') + parseFloat(r.commission || '0') + parseFloat(r.teamPayment || '0'), 0
        );
        const profit = revenue - costs;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          property,
          revenue,
          costs,
          profit,
          profitMargin,
          reservations: propertyReservations.length
        };
      })
      .filter(item => item.revenue > 0)
      .sort((a, b) => b.profitMargin - a.profitMargin);
  };

  const propertyProfitability = getPropertyProfitability();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calculator className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Análise completa de receitas, custos e rentabilidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mês Atual</SelectItem>
                <SelectItem value="last-month">Mês Anterior</SelectItem>
                <SelectItem value="current-year">Ano Atual</SelectItem>
                <SelectItem value="all">Todos os Períodos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as propriedades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Propriedades</SelectItem>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">€{financialSummary.totalRevenue.toFixed(2)}</p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Badge>
                {filteredReservations.length} reservas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{financialSummary.netProfit.toFixed(2)}
                </p>
              </div>
              {financialSummary.netProfit >= 0 ?
                <TrendingUp className="h-8 w-8 text-green-600" /> :
                <TrendingDown className="h-8 w-8 text-red-600" />
              }
            </div>
            <div className="mt-2">
              <Badge variant={financialSummary.netProfit >= 0 ? "default" : "destructive"}>
                {((financialSummary.netProfit / financialSummary.totalRevenue) * 100).toFixed(1)}% margem
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custos Totais</p>
                <p className="text-2xl font-bold text-orange-600">
                  €{(financialSummary.totalCleaningCosts + financialSummary.totalCommissions + financialSummary.totalTeamPayments).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 flex gap-1">
              <Badge variant="outline" className="text-xs">
                Limpeza: €{financialSummary.totalCleaningCosts.toFixed(0)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Médio Reserva</p>
                <p className="text-2xl font-bold">€{financialSummary.averageBookingValue.toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline">
                {financialSummary.propertiesWithRevenue} propriedades
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Receitas por Propriedade */}
        <Card>
          <CardHeader>
            <CardTitle>Top Propriedades por Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.revenueByProperty}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`€${value}`, 'Receita']}
                  labelFormatter={(label) => `Propriedade: ${label}`}
                />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição de Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={chartData.costDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.costDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`€${value}`, '']} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {chartData.costDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Rentabilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Rentabilidade por Propriedade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {propertyProfitability.slice(0, 10).map((item, index) => (
              <div key={item.property.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.property.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.reservations} reservas</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Receita</p>
                    <p className="font-semibold text-green-600">€{item.revenue.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Custos</p>
                    <p className="font-semibold text-orange-600">€{item.costs.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Lucro</p>
                    <p className={`font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{item.profit.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right min-w-20">
                    <p className="text-sm text-muted-foreground">Margem</p>
                    <Badge variant={item.profitMargin >= 0 ? "default" : "destructive"}>
                      {item.profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}