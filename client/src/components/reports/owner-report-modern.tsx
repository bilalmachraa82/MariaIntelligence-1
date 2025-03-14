import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { 
  Card,
  Metric,
  Text,
  Subtitle,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  BarChart,
  DonutChart,
  Title,
  Legend,
  CategoryBar,
  Grid,
  Col,
} from "@tremor/react";
import { 
  Download, 
  Calendar, 
  Euro, 
  Home, 
  Users, 
  Percent, 
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronsUpDown,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DateRange } from "@/components/ui/date-range-picker";
import { OwnerReport } from "@/hooks/use-owner-report";
import { downloadOwnerReportCSV } from "@/lib/export-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface OwnerReportModernProps {
  report: OwnerReport | null;
  dateRange: DateRange;
  occupancyData: any[];
  costDistribution: any[];
  isLoading: boolean;
  onExport: (format: 'full' | 'summary' | 'properties' | 'reservations') => void;
}

export function OwnerReportModern({
  report,
  dateRange,
  occupancyData,
  costDistribution,
  isLoading,
  onExport
}: OwnerReportModernProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const isMobile = useIsMobile();

  if (!report) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground"
      >
        <Users className="h-12 w-12 mb-4 opacity-30" />
        <h2 className="text-lg font-medium mb-2">{t("ownerReport.noOwnerSelected", "Nenhum proprietário selecionado")}</h2>
        <p>{t("ownerReport.selectOwnerToGenerate", "Selecione um proprietário para gerar o relatório financeiro.")}</p>
      </motion.div>
    );
  }

  // Verificar se há lucro ou prejuízo
  const isProfitable = report.totals.totalNetProfit > 0;
  
  // Calcular comparação com período anterior (simulado)
  const previousPeriodComparison = {
    revenue: 5.2, // Aumento de 5.2%
    profit: isProfitable ? 3.8 : -2.1, // Aumento de 3.8% ou queda de 2.1%
    occupancy: 1.5 // Aumento de 1.5%
  };

  // Preparar dados para o gráfico de barras categorizadas
  const revenueDistribution = [
    { name: t("ownerReport.revenue", "Receita"), value: report.totals.totalRevenue },
    { name: t("ownerReport.costs", "Custos"), value: report.totals.totalRevenue - report.totals.totalNetProfit },
    { name: t("ownerReport.profit", "Lucro"), value: report.totals.totalNetProfit }
  ];

  // Preparar dados para visualização mobile
  const propertyCards = report.propertyReports.map(property => ({
    id: property.propertyId,
    name: property.propertyName,
    revenue: property.revenue,
    profit: property.netProfit,
    occupancy: property.occupancyRate
  }));

  // Função para renderizar indicador de tendência
  const renderTrend = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-500 text-xs font-medium">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          +{value}%
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-500 text-xs font-medium">
          <ArrowDownRight className="h-3 w-3 mr-1" />
          {value}%
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-500 text-xs font-medium">
        <ChevronsUpDown className="h-3 w-3 mr-1" />
        0%
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={report.ownerId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Cabeçalho do relatório */}
        <div className="mb-6">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold mb-2"
          >
            {t("ownerReport.reportForOwner", "Relatório para {{owner}}", { owner: report.ownerName })}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground flex items-center"
          >
            <Calendar className="h-4 w-4 mr-1" />
            {t("ownerReport.periodDetails", "Período: {{startDate}} a {{endDate}}", {
              startDate: format(parseISO(dateRange.startDate), "dd/MM/yyyy"),
              endDate: format(parseISO(dateRange.endDate), "dd/MM/yyyy")
            })}
          </motion.p>
        </div>

        {/* Botões de ação */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-6"
        >
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
              <DropdownMenuItem onClick={() => onExport('full')}>
                {t("reports.exportFull", "Relatório Completo")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('summary')}>
                {t("reports.exportSummary", "Apenas Resumo")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('properties')}>
                {t("reports.exportProperties", "Apenas Propriedades")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('reservations')}>
                {t("reports.exportReservations", "Apenas Reservas")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t("reports.print", "Imprimir")}
          </Button>
        </motion.div>

        {/* Cards KPI principais */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card 
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              "from-primary-50 to-white dark:from-primary-950 dark:to-gray-900 bg-gradient-to-br shadow-md",
              "hover:shadow-lg hover:translate-y-[-2px]"
            )}
            decoration="left"
            decorationColor="indigo"
          >
            <div className="flex items-center justify-between">
              <Text>Receita Total</Text>
              {renderTrend(previousPeriodComparison.revenue)}
            </div>
            <Metric className="mt-2 flex items-center">
              <Euro className="h-5 w-5 mr-2 text-primary" />
              {formatCurrency(report.totals.totalRevenue)}
            </Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              {t("ownerReport.fromReservations", "de todas as reservas no período")}
            </Text>
          </Card>
          
          <Card 
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              "from-red-50 to-white dark:from-red-950 dark:to-gray-900 bg-gradient-to-br shadow-md",
              "hover:shadow-lg hover:translate-y-[-2px]"
            )}
            decoration="left"
            decorationColor="red"
          >
            <div className="flex items-center justify-between">
              <Text>Custos Totais</Text>
            </div>
            <Metric className="mt-2 flex items-center">
              <Euro className="h-5 w-5 mr-2 text-destructive" />
              {formatCurrency(
                report.totals.totalCleaningCosts + 
                report.totals.totalCheckInFees + 
                report.totals.totalCommission + 
                report.totals.totalTeamPayments
              )}
            </Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              {t("ownerReport.costsInclude", "inclui limpeza, check-in, comissão e equipas")}
            </Text>
          </Card>
          
          <Card 
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              isProfitable 
                ? "from-green-50 to-white dark:from-green-950 dark:to-gray-900 bg-gradient-to-br"
                : "from-amber-50 to-white dark:from-amber-950 dark:to-gray-900 bg-gradient-to-br",
              "shadow-md hover:shadow-lg hover:translate-y-[-2px]"
            )}
            decoration="left"
            decorationColor={isProfitable ? "green" : "amber"}
          >
            <div className="flex items-center justify-between">
              <Text>Lucro Líquido</Text>
              {renderTrend(previousPeriodComparison.profit)}
            </div>
            <Metric className={cn(
              "mt-2 flex items-center",
              isProfitable ? "text-green-600" : "text-amber-600"
            )}>
              <Wallet className="h-5 w-5 mr-2" />
              {formatCurrency(report.totals.totalNetProfit)}
            </Metric>
            <Text className="text-xs text-muted-foreground mt-1">
              {t("ownerReport.netProfitCalc", "receita total menos todos os custos")}
            </Text>
          </Card>
        </motion.div>

        {/* Gráficos e Visão Geral */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TabGroup
            index={activeTab === "overview" ? 0 : activeTab === "properties" ? 1 : 2}
            onIndexChange={(index) => 
              setActiveTab(index === 0 ? "overview" : index === 1 ? "properties" : "reservations")
            }
          >
            <TabList className="mb-6" variant="solid">
              <Tab icon={TrendingUp}>{t("ownerReport.overview", "Visão Geral")}</Tab>
              <Tab icon={Home}>{t("ownerReport.properties", "Propriedades")}</Tab>
              <Tab icon={Calendar}>{t("ownerReport.reservations", "Reservas")}</Tab>
            </TabList>
            <TabPanels>
              {/* Painel de Visão Geral */}
              <TabPanel>
                <Grid numItemsLg={2} className="gap-6 mt-6">
                  {/* Gráfico de ocupação por propriedade */}
                  <Col>
                    <Card className="h-full">
                      <Title>{t("ownerReport.occupancyRateByProperty", "Taxa de Ocupação por Propriedade")}</Title>
                      <Text className="mt-1 text-sm">
                        {t("ownerReport.occupancyRateDesc", "Percentual de dias ocupados em relação aos dias disponíveis")}
                      </Text>
                      <div className="h-[300px] mt-4">
                        <BarChart
                          data={occupancyData}
                          index="name"
                          categories={["occupancy"]}
                          colors={["indigo"]}
                          valueFormatter={(value) => `${value}%`}
                          yAxisWidth={40}
                          showLegend={false}
                          showGridLines={false}
                          showAnimation={true}
                          className="h-full"
                        />
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Gráfico de distribuição de custos */}
                  <Col>
                    <Card className="h-full">
                      <Title>{t("ownerReport.costAndRevenueDistribution", "Distribuição de Custos e Receita")}</Title>
                      <Text className="mt-1 text-sm">
                        {t("ownerReport.distributionDesc", "Proporção de cada componente financeiro")}
                      </Text>
                      <div className="h-[300px] mt-4">
                        <DonutChart
                          data={costDistribution}
                          category="value"
                          index="name"
                          valueFormatter={formatCurrency}
                          showAnimation={true}
                          colors={["blue", "cyan", "indigo", "violet", "emerald"]}
                          className="h-full"
                        />
                      </div>
                    </Card>
                  </Col>
                </Grid>
                
                {/* Distribuição de receita e lucro */}
                <Card className="mt-6">
                  <Title>{t("ownerReport.revenueDistribution", "Distribuição de Receita")}</Title>
                  <Text className="mt-1 text-sm">
                    {t("ownerReport.revenueDistributionDesc", "Proporção entre receita, custos e lucro líquido")}
                  </Text>
                  <Grid numItemsMd={2} className="mt-4 gap-4">
                    <Col>
                      <Text className="mb-2">{t("ownerReport.distribution", "Distribuição")}</Text>
                      <CategoryBar
                        values={[
                          report.totals.totalNetProfit,
                          report.totals.totalRevenue - report.totals.totalNetProfit
                        ]}
                        colors={["emerald", "red"]}
                        markerValue={report.totals.totalRevenue > 0 ? 
                          (report.totals.totalNetProfit / report.totals.totalRevenue) * 100 : 0}
                        showAnimation={true}
                        className="h-7"
                      />
                      <Legend
                        className="mt-3"
                        categories={[
                          t("ownerReport.profit", "Lucro"), 
                          t("ownerReport.costs", "Custos")
                        ]}
                        colors={["emerald", "red"]}
                      />
                    </Col>
                    <Col className="space-y-4">
                      <div>
                        <Text>{t("ownerReport.totalRevenue", "Receita Total")}</Text>
                        <p className="text-tremor-content-strong font-semibold text-xl">
                          {formatCurrency(report.totals.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <Text>{t("ownerReport.profitMargin", "Margem de Lucro")}</Text>
                        <p className={cn(
                          "text-tremor-content-strong font-semibold text-xl",
                          isProfitable ? "text-emerald-600" : "text-red-600"
                        )}>
                          {report.totals.totalRevenue > 0 ? 
                            ((report.totals.totalNetProfit / report.totals.totalRevenue) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </Col>
                  </Grid>
                </Card>
              </TabPanel>
              
              {/* Painel de Propriedades */}
              <TabPanel>
                {isMobile ? (
                  <div className="space-y-4">
                    {report.propertyReports.map((property, idx) => (
                      <motion.div
                        key={property.propertyId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                      >
                        <Card className="overflow-hidden">
                          <div className="flex items-center mb-3">
                            <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                            <Title>{property.propertyName}</Title>
                          </div>
                          
                          <Grid numItemsSm={2} className="gap-4">
                            <Col>
                              <Text className="text-muted-foreground text-sm">{t("ownerReport.revenue", "Receita")}</Text>
                              <p className="text-lg font-semibold">{formatCurrency(property.revenue)}</p>
                            </Col>
                            <Col>
                              <Text className="text-muted-foreground text-sm">{t("ownerReport.netProfit", "Lucro Líquido")}</Text>
                              <p className={cn(
                                "text-lg font-semibold",
                                property.netProfit >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatCurrency(property.netProfit)}
                              </p>
                            </Col>
                          </Grid>
                          
                          <div className="mt-4">
                            <Text className="text-muted-foreground text-sm">{t("ownerReport.occupancyRate", "Taxa de Ocupação")}</Text>
                            <div className="mt-1">
                              <CategoryBar
                                values={[property.occupiedDays, property.availableDays - property.occupiedDays]}
                                colors={["blue", "slate"]}
                                markerValue={property.occupancyRate}
                                showAnimation={true}
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs mt-1">
                                <span>{property.occupancyRate.toFixed(1)}%</span>
                                <span className="text-muted-foreground">{property.occupiedDays} / {property.availableDays} dias</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                            <div>
                              <span>Limpeza:</span>
                              <span className="ml-1 font-semibold">{formatCurrency(property.cleaningCosts)}</span>
                            </div>
                            <div>
                              <span>Check-in:</span>
                              <span className="ml-1 font-semibold">{formatCurrency(property.checkInFees)}</span>
                            </div>
                            <div>
                              <span>Comissão:</span>
                              <span className="ml-1 font-semibold">{formatCurrency(property.commission)}</span>
                            </div>
                            <div>
                              <span>Equipas:</span>
                              <span className="ml-1 font-semibold">{formatCurrency(property.teamPayments)}</span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <Title>{t("ownerReport.detailedPropertyPerformance", "Desempenho Detalhado por Propriedade")}</Title>
                    <Text className="mt-1 text-sm mb-4">
                      {t("ownerReport.propertyPerformanceDesc", "Dados financeiros e de ocupação para cada propriedade")}
                    </Text>
                    
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
                        <AnimatePresence>
                          {report.propertyReports.map((property, idx) => (
                            <motion.tr 
                              key={property.propertyId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group hover:bg-muted/50"
                            >
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
                              <TableCell className={cn(
                                "text-right font-medium",
                                property.netProfit >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatCurrency(property.netProfit)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end">
                                  {property.occupancyRate.toFixed(1)}%
                                  <div className="w-16 ml-2">
                                    <CategoryBar
                                      values={[property.occupiedDays, property.availableDays - property.occupiedDays]}
                                      colors={["blue", "slate"]}
                                      showAnimation={true}
                                      className="h-1"
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabPanel>
              
              {/* Painel de Reservas */}
              <TabPanel>
                {isMobile ? (
                  <div className="space-y-4">
                    {report.propertyReports.flatMap(property => (
                      property.reservations.map((reservation, idx) => (
                        <motion.div
                          key={reservation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * idx }}
                        >
                          <Card className="overflow-hidden">
                            <div className="flex justify-between mb-3">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Text>{reservation.guestName}</Text>
                              </div>
                              <Text className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {reservation.platform}
                              </Text>
                            </div>
                            
                            <div className="mb-3 text-xs text-muted-foreground">
                              <div>{property.propertyName}</div>
                              <div className="mt-1">
                                {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                              </div>
                            </div>
                            
                            <Grid numItemsSm={2} className="gap-4">
                              <Col>
                                <Text className="text-muted-foreground text-sm">{t("ownerReport.revenue", "Valor")}</Text>
                                <p className="text-lg font-semibold">{formatCurrency(reservation.totalAmount)}</p>
                              </Col>
                              <Col>
                                <Text className="text-muted-foreground text-sm">{t("ownerReport.netAmount", "Valor Líquido")}</Text>
                                <p className={cn(
                                  "text-lg font-semibold",
                                  reservation.netAmount >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {formatCurrency(reservation.netAmount)}
                                </p>
                              </Col>
                            </Grid>
                            
                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                              <div>
                                <span>Limpeza:</span>
                                <span className="ml-1 font-semibold">{formatCurrency(reservation.cleaningFee)}</span>
                              </div>
                              <div>
                                <span>Check-in:</span>
                                <span className="ml-1 font-semibold">{formatCurrency(reservation.checkInFee)}</span>
                              </div>
                              <div>
                                <span>Comissão:</span>
                                <span className="ml-1 font-semibold">{formatCurrency(reservation.commission)}</span>
                              </div>
                              <div>
                                <span>Equipa:</span>
                                <span className="ml-1 font-semibold">{formatCurrency(reservation.teamPayment)}</span>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))
                    ))}
                  </div>
                ) : (
                  <Card>
                    <Title>{t("ownerReport.reservationsDetails", "Detalhes das Reservas")}</Title>
                    <Text className="mt-1 text-sm mb-4">
                      {t("ownerReport.reservationsDetailsDesc", "Dados financeiros de todas as reservas no período")}
                    </Text>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("ownerReport.property", "Propriedade")}</TableHead>
                          <TableHead>{t("ownerReport.guest", "Hóspede")}</TableHead>
                          <TableHead>{t("ownerReport.platform", "Plataforma")}</TableHead>
                          <TableHead>{t("ownerReport.period", "Período")}</TableHead>
                          <TableHead className="text-right">{t("ownerReport.total", "Total")}</TableHead>
                          <TableHead className="text-right">{t("ownerReport.costs", "Custos")}</TableHead>
                          <TableHead className="text-right">{t("ownerReport.netAmount", "Valor Líquido")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {report.propertyReports.flatMap(property => (
                            property.reservations.map((reservation, idx) => (
                              <motion.tr 
                                key={reservation.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group hover:bg-muted/50"
                              >
                                <TableCell>
                                  <div className="flex items-center">
                                    <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {property.propertyName}
                                  </div>
                                </TableCell>
                                <TableCell>{reservation.guestName}</TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-primary/10 text-primary">
                                    {reservation.platform}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(reservation.totalAmount)}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {formatCurrency(
                                    reservation.cleaningFee + 
                                    reservation.checkInFee + 
                                    reservation.commission + 
                                    reservation.teamPayment
                                  )}
                                </TableCell>
                                <TableCell className={cn(
                                  "text-right font-medium",
                                  reservation.netAmount >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {formatCurrency(reservation.netAmount)}
                                </TableCell>
                              </motion.tr>
                            ))
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}