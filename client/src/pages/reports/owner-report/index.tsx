import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { format, addDays, parseISO } from "date-fns";
import { Download, Calendar, Euro, Home, Users, Percent, CreditCard, FileText } from "lucide-react";
import { useOwners } from "@/hooks/use-owners";
import { useOwnerReport } from "@/hooks/use-owner-report";
import { formatCurrency, formatDate } from "@/lib/utils";
import { downloadOwnerReportCSV } from "@/lib/export-utils";

interface OwnerReport {
  ownerId: number;
  startDate: string;
  endDate: string;
  propertyReports: PropertyReportItem[];
  totals: ReportTotals;
}

interface PropertyReportItem {
  propertyId: number;
  propertyName: string;
  reservations: ReservationSummary[];
  revenue: number;
  cleaningCosts: number;
  checkInFees: number;
  commission: number;
  teamPayments: number;
  netProfit: number;
  occupancyRate: number;
  availableDays: number;
  occupiedDays: number;
}

interface ReservationSummary {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  totalAmount: number;
  cleaningFee: number;
  checkInFee: number;
  commission: number;
  teamPayment: number;
  netAmount: number;
  platform: string;
}

interface ReportTotals {
  totalRevenue: number;
  totalCleaningCosts: number;
  totalCheckInFees: number;
  totalCommission: number;
  totalTeamPayments: number;
  totalNetProfit: number;
  averageOccupancy: number;
}

// Componente principal
export default function OwnerReportPage() {
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");
  const { data: owners, isLoading: isOwnersLoading } = useOwners();
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(addDays(new Date(), -30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    label: t("reports.last30Days", "Últimos 30 dias"),
  });
  
  // Usar o hook personalizado para obter o relatório com dados reais
  const { 
    report: ownerReport, 
    propertyOccupancyData: occupancyData, 
    costDistributionData: costDistribution,
    isLoading: isReportLoading 
  } = useOwnerReport(
    selectedOwner ? parseInt(selectedOwner) : null, 
    dateRange
  );
  
  // Função para lidar com a mudança no range de datas
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };
  
  // Cores para os gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  
  // Verificar se está carregando os dados
  const isLoading = isOwnersLoading || isReportLoading;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t("ownerReport.title", "Relatório Financeiro por Proprietário")}</h1>
        {ownerReport && (
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {t("reports.export", "Exportar")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t("reports.exportOptions", "Opções de exportação")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => downloadOwnerReportCSV(ownerReport, 'full', i18n.language)}>
                    {t("reports.exportFull", "Relatório Completo")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadOwnerReportCSV(ownerReport, 'summary', i18n.language)}>
                    {t("reports.exportSummary", "Apenas Resumo")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadOwnerReportCSV(ownerReport, 'properties', i18n.language)}>
                    {t("reports.exportProperties", "Apenas Propriedades")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadOwnerReportCSV(ownerReport, 'reservations', i18n.language)}>
                    {t("reports.exportReservations", "Apenas Reservas")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => {
                  window.print();
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                {t("reports.print", "Imprimir")}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>{t("ownerReport.generateReport", "Gerar Relatório")}</CardTitle>
          <CardDescription>
            {t("ownerReport.selectOwnerAndPeriod", "Selecione o proprietário e o período para gerar o relatório")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="text-sm font-medium mb-1 block">
                {t("ownerReport.owner", "Proprietário")}
              </label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("ownerReport.selectOwner", "Selecione um proprietário")} />
                </SelectTrigger>
                <SelectContent>
                  {isOwnersLoading ? (
                    <SelectItem value="loading" disabled>
                      {t("common.loading", "Carregando...")}
                    </SelectItem>
                  ) : (
                    owners?.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id.toString()}>
                        {owner.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full">
              <label className="text-sm font-medium mb-1 block">
                {t("ownerReport.period", "Período")}
              </label>
              <DateRangePicker 
                value={dateRange} 
                onChange={handleDateRangeChange} 
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!selectedOwner && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-30" />
          <h2 className="text-lg font-medium mb-2">{t("ownerReport.noOwnerSelected", "Nenhum proprietário selecionado")}</h2>
          <p>{t("ownerReport.selectOwnerToGenerate", "Selecione um proprietário para gerar o relatório financeiro.")}</p>
        </div>
      )}
      
      {selectedOwner && ownerReport && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {t("ownerReport.reportForOwner", "Relatório para {{owner}}", { owner: ownerReport.ownerName })}
            </h2>
            <p className="text-muted-foreground">
              {t("ownerReport.periodDetails", "Período: {{startDate}} a {{endDate}}", {
                startDate: format(parseISO(dateRange.startDate), "dd/MM/yyyy"),
                endDate: format(parseISO(dateRange.endDate), "dd/MM/yyyy")
              })}
            </p>
          </div>
          
          <div className="grid gap-6 mb-8 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("ownerReport.totalRevenue", "Receita Total")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Euro className="h-5 w-5 mr-2 text-primary" />
                  <div className="text-3xl font-bold">{formatCurrency(ownerReport.totals.totalRevenue)}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("ownerReport.fromReservations", "de todas as reservas no período")}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("ownerReport.totalCosts", "Custos Totais")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Euro className="h-5 w-5 mr-2 text-destructive" />
                  <div className="text-3xl font-bold">{formatCurrency(
                    ownerReport.totals.totalCleaningCosts + 
                    ownerReport.totals.totalCheckInFees + 
                    ownerReport.totals.totalCommission + 
                    ownerReport.totals.totalTeamPayments
                  )}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("ownerReport.costsInclude", "inclui limpeza, check-in, comissão e equipas")}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t("ownerReport.netProfit", "Lucro Líquido")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Euro className="h-5 w-5 mr-2 text-green-600" />
                  <div className="text-3xl font-bold">{formatCurrency(ownerReport.totals.totalNetProfit)}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("ownerReport.netProfitCalc", "receita total menos todos os custos")}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 mb-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("ownerReport.occupancyRateByProperty", "Taxa de Ocupação por Propriedade")}</CardTitle>
                <CardDescription>
                  {t("ownerReport.occupancyRateDesc", "Percentual de dias ocupados em relação aos dias disponíveis")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={occupancyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="occupancy" name={t("ownerReport.occupancyRate", "Taxa de Ocupação (%)")} fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="revenue" name={t("ownerReport.revenue", "Receita (€)")} fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t("ownerReport.costAndRevenueDistribution", "Distribuição de Custos e Receita")}</CardTitle>
                <CardDescription>
                  {t("ownerReport.distributionDesc", "Proporção de cada componente financeiro")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {costDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t("ownerReport.detailedPropertyPerformance", "Desempenho Detalhado por Propriedade")}</CardTitle>
              <CardDescription>
                {t("ownerReport.propertyPerformanceDesc", "Dados financeiros e de ocupação para cada propriedade")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ownerReport.property", "Propriedade")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.revenue", "Receita")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.cleaningCosts", "Custos de Limpeza")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.checkInFees", "Taxas de Check-in")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.commission", "Comissão")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.teamPayments", "Pagamentos às Equipas")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.netProfit", "Lucro Líquido")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.occupancyRate", "Taxa de Ocupação")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownerReport.propertyReports.map((property) => (
                    <TableRow key={property.propertyId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                          {property.propertyName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(property.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(property.cleaningCosts)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(property.checkInFees)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(property.commission)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(property.teamPayments)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(property.netProfit)}</TableCell>
                      <TableCell className="text-right">
                        {property.occupancyRate.toFixed(1)}%
                        <div className="text-xs text-muted-foreground">
                          {property.occupiedDays} / {property.availableDays} {t("ownerReport.days", "dias")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell className="font-bold">{t("common.total", "Total")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ownerReport.totals.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ownerReport.totals.totalCleaningCosts)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ownerReport.totals.totalCheckInFees)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ownerReport.totals.totalCommission)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ownerReport.totals.totalTeamPayments)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(ownerReport.totals.totalNetProfit)}</TableCell>
                    <TableCell className="text-right">{ownerReport.totals.averageOccupancy.toFixed(1)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t("ownerReport.reservationDetails", "Detalhes das Reservas")}</CardTitle>
              <CardDescription>
                {t("ownerReport.reservationDetailsDesc", "Lista de todas as reservas no período selecionado")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ownerReport.propertyReports.flatMap(p => p.reservations).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("ownerReport.noReservations", "Não há reservas para o período selecionado")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("ownerReport.dates", "Datas")}</TableHead>
                      <TableHead>{t("ownerReport.property", "Propriedade")}</TableHead>
                      <TableHead>{t("ownerReport.guest", "Hóspede")}</TableHead>
                      <TableHead>{t("ownerReport.platform", "Plataforma")}</TableHead>
                      <TableHead className="text-right">{t("ownerReport.revenue", "Receita")}</TableHead>
                      <TableHead className="text-right">{t("ownerReport.costs", "Custos")}</TableHead>
                      <TableHead className="text-right">{t("ownerReport.netAmount", "Valor Líquido")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerReport.propertyReports.flatMap(property => 
                      property.reservations.map(reservation => (
                        <TableRow key={reservation.id}>
                          <TableCell>
                            <div>{format(parseISO(reservation.checkInDate), "dd/MM/yyyy")}</div>
                            <div className="text-xs text-muted-foreground">
                              {t("ownerReport.to", "até")} {format(parseISO(reservation.checkOutDate), "dd/MM/yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {property.propertyName}
                          </TableCell>
                          <TableCell>{reservation.guestName}</TableCell>
                          <TableCell className="capitalize">{reservation.platform}</TableCell>
                          <TableCell className="text-right">{formatCurrency(reservation.totalAmount)}</TableCell>
                          <TableCell className="text-right">
                            <div className="text-xs">
                              {t("ownerReport.cleaning", "Limpeza")}: {formatCurrency(reservation.cleaningFee)}
                            </div>
                            <div className="text-xs">
                              {t("ownerReport.checkIn", "Check-in")}: {formatCurrency(reservation.checkInFee)}
                            </div>
                            <div className="text-xs">
                              {t("ownerReport.commission", "Comissão")}: {formatCurrency(reservation.commission)}
                            </div>
                            <div className="text-xs">
                              {t("ownerReport.team", "Equipa")}: {formatCurrency(reservation.teamPayment)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(reservation.netAmount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}