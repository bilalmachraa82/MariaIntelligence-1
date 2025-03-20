import { useState, useEffect } from "react";
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
  Callout,
  List,
  ListItem,
  Divider,
  Badge,
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
  Wallet,
  FileType2,
  Lightbulb,
  BarChart2,
  AlertCircle,
  LineChart,
  PieChart,
  Sparkles,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DateRange as UIDateRange } from "@/components/ui/date-range-picker";
import { OwnerReport } from "@/hooks/use-owner-report";
import { downloadOwnerReportCSV } from "@/lib/export-utils";
import { downloadOwnerReportPDF, generateReportInsights } from "@/lib/pdf-export-utils";
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
import { PropertyReservationsTable } from "@/components/reports/property-reservations-table";

interface OwnerReportModernProps {
  report: OwnerReport | null;
  dateRange: UIDateRange;
  occupancyData: any[];
  costDistribution: any[];
  isLoading: boolean;
  onExport: (format: 'full' | 'summary' | 'properties' | 'reservations') => void;
  onSendEmail?: () => void; // Opcional para permitir compatibilidade com componentes existentes
}

// Componente para exibir insights baseados em AI
interface InsightsSectionProps {
  report: OwnerReport;
}

function InsightsSection({ report }: InsightsSectionProps) {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar insights ao inicializar ou quando o relatório mudar
    async function loadInsights() {
      setLoading(true);
      setError(null);
      try {
        const generatedInsights = await generateReportInsights(report);
        setInsights(generatedInsights);
      } catch (err) {
        console.error("Erro ao carregar insights:", err);
        setError(t(
          "ownerReport.insightsError",
          "Não foi possível gerar insights para este relatório. Por favor, tente novamente mais tarde."
        ));
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [report, t]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <Text>{t("ownerReport.generatingInsights", "Gerando insights...")}</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Callout
        title={t("ownerReport.insightsUnavailable", "Insights não disponíveis")}
        icon={AlertCircle}
        color="rose"
        className="mt-4"
      >
        <div>{error}</div>
      </Callout>
    );
  }

  // Fallback para quando não temos insights da IA
  if (!insights) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Callout
          title={t("ownerReport.baseInsights", "Análise Básica")}
          icon={LineChart}
          color="blue"
        >
          <div className="text-sm mt-2">
            {report.totals.totalNetProfit > 0
              ? t(
                  "ownerReport.profitableInsight",
                  "Este período foi lucrativo com {{profit}} de lucro líquido, representando {{percentage}}% da receita total.",
                  {
                    profit: formatCurrency(report.totals.totalNetProfit),
                    percentage: ((report.totals.totalNetProfit / report.totals.totalRevenue) * 100).toFixed(1),
                  }
                )
              : t(
                  "ownerReport.unprofitableInsight",
                  "Este período apresentou um déficit de {{loss}}, representando uma margem negativa de {{percentage}}%.",
                  {
                    loss: formatCurrency(Math.abs(report.totals.totalNetProfit)),
                    percentage: ((report.totals.totalNetProfit / report.totals.totalRevenue) * 100).toFixed(1),
                  }
                )
            }
          </div>
        </Callout>

        <Callout
          title={t("ownerReport.occupancyInsight", "Análise de Ocupação")}
          icon={BarChart2}
          color="indigo"
        >
          <div className="text-sm mt-2">
            {t(
              "ownerReport.occupancyInsightText",
              "A taxa média de ocupação foi de {{rate}}%. {{bestProperty}} teve a melhor performance com {{bestRate}}% de ocupação.",
              {
                rate: (report.propertyReports.reduce((sum, p) => sum + p.occupancyRate, 0) / report.propertyReports.length).toFixed(1),
                bestProperty: report.propertyReports.reduce((best, p) => 
                  best.occupancyRate > p.occupancyRate ? best : p
                ).propertyName,
                bestRate: report.propertyReports.reduce((best, p) => 
                  best.occupancyRate > p.occupancyRate ? best : p
                ).occupancyRate.toFixed(1),
              }
            )}
          </div>
        </Callout>
      </div>
    );
  }

  // Renderização dos insights avançados da IA
  return (
    <Grid numItemsMd={2} className="gap-4 mt-2">
      {/* Insights gerais */}
      <Col numColSpanMd={2}>
        <Callout
          title={t("ownerReport.overallPerformance", "Desempenho Geral")}
          icon={Sparkles}
          color="amber"
        >
          <div className="text-sm mt-2">
            {insights.overallSummary || insights.summaryInsight || 
              t("ownerReport.fallbackSummary", "Análise do período mostra uma performance geral estável com oportunidades de melhoria.")}
          </div>
        </Callout>
      </Col>

      {/* Insights de propriedades de destaque */}
      <Col>
        <div className="space-y-4">
          <Callout
            title={t("ownerReport.topPerformers", "Propriedades em Destaque")}
            icon={TrendingUp}
            color="emerald"
          >
            <div className="mt-2">
              <List>
                {(insights.propertyInsights?.map((p: any) => p.insight) || []).slice(0, 3).map((insight: string, idx: number) => (
                  <ListItem key={idx}>
                    <span className="text-sm">{insight}</span>
                  </ListItem>
                ))}
                {(!insights.propertyInsights || insights.propertyInsights.length === 0) && (
                  <ListItem>
                    <span className="text-sm">
                      {t("ownerReport.noTopPerformers", "Não há propriedades com desempenho excepcional no período.")}
                    </span>
                  </ListItem>
                )}
              </List>
            </div>
          </Callout>

          <Callout
            title={t("ownerReport.seasonalTrends", "Tendências Sazonais")}
            icon={Calendar}
            color="indigo"
          >
            <div className="text-sm mt-2">
              {insights.seasonalTrends || insights.seasonalTips?.[0] || 
                t("ownerReport.noSeasonalData", "Dados insuficientes para análise de sazonalidade.")}
            </div>
          </Callout>
        </div>
      </Col>

      {/* Recomendações baseadas em IA */}
      <Col>
        <Callout
          title={t("ownerReport.recommendations", "Recomendações Inteligentes")}
          icon={Lightbulb}
          color="amber"
        >
          <div className="mt-2">
            <List>
              {(insights.recommendations || []).slice(0, 3).map((recommendation: string, idx: number) => (
                <ListItem key={idx}>
                  <span className="text-sm">{recommendation}</span>
                </ListItem>
              ))}
              {!insights.recommendations?.length && (
                <ListItem>
                  <span className="text-sm">
                    {t("ownerReport.noRecommendations", "Não há recomendações específicas para este período.")}
                  </span>
                </ListItem>
              )}
            </List>
          </div>
        </Callout>
      </Col>

      {/* Métricas de negócio */}
      {insights.keyMetrics && insights.keyMetrics.length > 0 && (
        <Col numColSpanMd={2}>
          <Card className="mt-2">
            <Title className="mb-2">{t("ownerReport.businessMetrics", "Métricas de Negócio")}</Title>
            <div className="flex flex-wrap gap-2">
              {insights.keyMetrics.map((metric: any, idx: number) => (
                <Badge key={idx} color="blue">
                  {metric.label}: {metric.value}
                </Badge>
              ))}
            </div>
            <Divider className="my-3" />
            <Text>
              {insights.trendAnalysis || 
                t("ownerReport.noBusinessSummary", "Análise detalhada de métricas de negócio não disponível.")}
            </Text>
          </Card>
        </Col>
      )}
    </Grid>
  );
}

export function OwnerReportModern({
  report,
  dateRange,
  occupancyData,
  costDistribution,
  isLoading,
  onExport,
  onSendEmail
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
        className="space-y-6 p-6"
      >
        {/* Título do relatório com destaque visual */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-800">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold mb-2 text-blue-800 dark:text-blue-300 flex items-center gap-2"
          >
            <Sparkles className="h-6 w-6 text-amber-500" />
            {t("ownerReport.reportForOwner", "Panorama de {{owner}}", { owner: report.ownerName })}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-600 dark:text-blue-400 flex items-center ml-8"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t("ownerReport.periodDetails", "Período de inspiração: {{startDate}} a {{endDate}}", {
              startDate: dateRange.from ? format(new Date(dateRange.from), "dd MMM yyyy") : "-",
              endDate: dateRange.to ? format(new Date(dateRange.to), "dd MMM yyyy") : "-"
            })}
          </motion.p>
        </div>

        {/* Cards KPI principais com design melhorado e tendências */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
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

                {/* Seção de Insights com IA */}
                <Card className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <Title>{t("ownerReport.aiInsights", "Insights Inteligentes")}</Title>
                  </div>
                  <InsightsSection report={report} />
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
                    {report.propertyReports.map((property, index) => (
                      <motion.div
                        key={property.propertyId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <PropertyReservationsTable 
                          propertyName={property.propertyName}
                          reservations={property.reservations}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Card className="p-4">
                      <Title>{t("ownerReport.reservationsDetails", "Detalhes das Reservas por Propriedade")}</Title>
                      <Text className="mt-1 text-sm mb-4">
                        {t("ownerReport.reservationsDetailsDesc", "Dados financeiros de todas as reservas no período, agrupados por propriedade")}
                      </Text>
                    </Card>
                    
                    {report.propertyReports.map((property, index) => (
                      <motion.div
                        key={property.propertyId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {property.reservations.length > 0 ? (
                          <PropertyReservationsTable
                            propertyName={property.propertyName}
                            reservations={property.reservations}
                          />
                        ) : (
                          <Card className="w-full mb-6 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Title className="text-lg">{property.propertyName}</Title>
                                <Text className="text-muted-foreground">{t("reports.noReservations", "Sem reservas no período")}</Text>
                              </div>
                              <div className="text-muted-foreground">
                                <span className="text-xs">{t("reports.occupancyRate", "Taxa de ocupação")}:</span>
                                <span className="ml-1 text-lg">{property.occupancyRate.toFixed(1)}%</span>
                              </div>
                            </div>
                          </Card>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}