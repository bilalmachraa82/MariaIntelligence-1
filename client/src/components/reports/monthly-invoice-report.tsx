import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import {
  FileText,
  Download,
  Printer,
  CopyCheck,
  BarChart4,
  Share2,
  Calendar,
  Home,
  User,
  Euro
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OwnerReport, PropertyReportItem, ReservationSummary } from "@/hooks/use-owner-report";
import { PropertyReservationsTable } from "@/components/reports/property-reservations-table";
import { downloadOwnerReportPDF, downloadOwnerReportCSV } from "@/lib/pdf-export-utils";

interface MonthlyInvoiceReportProps {
  report: OwnerReport;
  selectedMonth?: string; // ISO string (YYYY-MM)
  onExport: (format: 'pdf' | 'csv') => void;
}

export function MonthlyInvoiceReport({ report, selectedMonth, onExport }: MonthlyInvoiceReportProps) {
  const { t, i18n } = useTranslation();
  const reportDate = new Date();
  
  // Get month name from selectedMonth or current month
  const monthName = selectedMonth 
    ? format(new Date(selectedMonth + '-01'), 'LLLL yyyy', { locale: ptBR }) 
    : format(reportDate, 'LLLL yyyy', { locale: ptBR });
  
  return (
    <div className="space-y-6 print:space-y-2">
      {/* Report Header - Will appear on all pages when printed */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:mb-2">
        <div>
          <h1 className="text-2xl font-bold capitalize print:text-xl">
            {t("ownerReport.monthlyInvoiceTitle", "Resumo Mensal para Faturação")} - {monthName}
          </h1>
          <p className="text-muted-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {t("ownerReport.periodDetails", "Período: {{startDate}} a {{endDate}}", {
              startDate: formatDate(report.startDate),
              endDate: formatDate(report.endDate)
            })}
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0 print:hidden">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => onExport('csv')}
          >
            <Download className="h-4 w-4" />
            {t("export.csv", "Exportar CSV")}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => onExport('pdf')}
          >
            <FileText className="h-4 w-4" />
            {t("export.pdf", "Exportar PDF")}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            {t("export.print", "Imprimir")}
          </Button>
        </div>
      </div>
      
      {/* Owner Info */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                {report.ownerName}
              </CardTitle>
              <CardDescription>
                {t("ownerReport.invoicePeriod", "Resumo de faturação para o período de {{period}}", {
                  period: monthName
                })}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{t("ownerReport.referenceNumber", "Nº Referência")}</div>
              <div className="font-medium">{`INV-${reportDate.getFullYear()}${String(reportDate.getMonth() + 1).padStart(2, '0')}-${report.ownerId}`}</div>
              <div className="text-sm text-muted-foreground mt-1">{t("ownerReport.issueDate", "Data de Emissão")}</div>
              <div className="font-medium">{format(reportDate, 'dd/MM/yyyy')}</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card className="bg-primary/5 border-0">
                <CardContent className="pt-6">
                  <div className="text-muted-foreground text-sm">{t("ownerReport.totalProperties", "Total de Propriedades")}</div>
                  <div className="text-3xl font-bold mt-1">{report.propertyReports.length}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-0">
                <CardContent className="pt-6">
                  <div className="text-muted-foreground text-sm">{t("ownerReport.totalReservations", "Total de Reservas")}</div>
                  <div className="text-3xl font-bold mt-1">{report.totals.totalReservations}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-0">
                <CardContent className="pt-6">
                  <div className="text-muted-foreground text-sm">{t("ownerReport.grossRevenue", "Receita Bruta")}</div>
                  <div className="text-3xl font-bold mt-1">{formatCurrency(report.totals.totalRevenue)}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-950/30 border-0">
                <CardContent className="pt-6">
                  <div className="text-muted-foreground text-sm">{t("ownerReport.netAmount", "Valor Líquido a Pagar")}</div>
                  <div className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{formatCurrency(report.totals.totalNetProfit)}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Properties Summary Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">{t("ownerReport.propertiesSummary", "Resumo por Propriedade")}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ownerReport.property", "Propriedade")}</TableHead>
                    <TableHead className="text-center">{t("ownerReport.reservationsCount", "Reservas")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.revenue", "Receita Bruta")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.totalCosts", "Total Custos")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.netProfit", "Valor Líquido")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.propertyReports.map((property: PropertyReportItem) => {
                    const totalCosts = property.cleaningCosts + property.checkInFees + 
                      property.commission + property.teamPayments;
                    
                    return (
                      <TableRow key={property.propertyId}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          {property.propertyName}
                        </TableCell>
                        <TableCell className="text-center">{property.reservations.length}</TableCell>
                        <TableCell className="text-right">{formatCurrency(property.revenue)}</TableCell>
                        <TableCell className="text-right text-red-500">
                          {formatCurrency(totalCosts)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(property.netProfit)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>{t("ownerReport.totalAll", "Total Geral")}</TableCell>
                    <TableCell className="text-center">{report.totals.totalReservations}</TableCell>
                    <TableCell className="text-right">{formatCurrency(report.totals.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-red-500">
                      {formatCurrency(report.totals.totalRevenue - report.totals.totalNetProfit)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(report.totals.totalNetProfit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* Costs Breakdown */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">{t("ownerReport.costsBreakdown", "Detalhamento de Custos")}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ownerReport.costType", "Tipo de Custo")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.amount", "Valor")}</TableHead>
                    <TableHead className="text-right">{t("ownerReport.percentage", "Percentual")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{t("ownerReport.costs.cleaning", "Serviços de Limpeza")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(report.totals.totalCleaningCosts)}</TableCell>
                    <TableCell className="text-right">
                      {((report.totals.totalCleaningCosts / report.totals.totalRevenue) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t("ownerReport.costs.checkIn", "Serviços de Check-in")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(report.totals.totalCheckInFees)}</TableCell>
                    <TableCell className="text-right">
                      {((report.totals.totalCheckInFees / report.totals.totalRevenue) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t("ownerReport.costs.commission", "Comissão de Gestão")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(report.totals.totalCommission)}</TableCell>
                    <TableCell className="text-right">
                      {((report.totals.totalCommission / report.totals.totalRevenue) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t("ownerReport.costs.teamPayments", "Pagamentos às Equipas")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(report.totals.totalTeamPayments)}</TableCell>
                    <TableCell className="text-right">
                      {((report.totals.totalTeamPayments / report.totals.totalRevenue) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>{t("ownerReport.totalCosts", "Total de Custos")}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.totals.totalRevenue - report.totals.totalNetProfit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(((report.totals.totalRevenue - report.totals.totalNetProfit) / report.totals.totalRevenue) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* Reservations Detail Section */}
            <div className="page-break-before">
              <h2 className="text-xl font-bold mt-8 mb-4">
                {t("ownerReport.reservationsDetails", "Detalhamento das Reservas por Propriedade")}
              </h2>
              
              <div className="space-y-6">
                {report.propertyReports.map((property: PropertyReportItem) => (
                  <div key={property.propertyId} className="page-break-inside-avoid">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Home className="h-5 w-5 mr-2" />
                      {property.propertyName}
                    </h3>
                    
                    {property.reservations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("reports.guest", "Hóspede")}</TableHead>
                            <TableHead>{t("reports.period", "Período")}</TableHead>
                            <TableHead className="text-center">{t("reports.nights", "Noites")}</TableHead>
                            <TableHead>{t("reports.platform", "Plataforma")}</TableHead>
                            <TableHead className="text-right">{t("reports.amount", "Valor")}</TableHead>
                            <TableHead className="text-right">{t("reports.netAmount", "Valor Líquido")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {property.reservations.map((reservation: ReservationSummary) => (
                            <TableRow key={reservation.id}>
                              <TableCell>{reservation.guestName}</TableCell>
                              <TableCell>
                                {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                              </TableCell>
                              <TableCell className="text-center">{reservation.nights}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {reservation.platform}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(reservation.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(reservation.netAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Property Total Row */}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={4} className="font-semibold">
                              {t("reports.totalProperty", "Total para esta propriedade")}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(property.revenue)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(property.netProfit)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                        {t("reports.noReservations", "Sem reservas no período selecionado")}
                      </div>
                    )}
                    
                    <Separator className="my-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 pt-4 print:pt-2">
          <div className="w-full flex flex-col md:flex-row justify-between border-t pt-4 print:text-sm">
            <div>
              <div className="font-semibold">{t("ownerReport.paymentDetails", "Detalhes de Pagamento")}</div>
              <div className="text-muted-foreground mt-1">
                <div>{t("ownerReport.paymentMethod", "Método de Pagamento")}: Transferência Bancária</div>
                <div>{t("ownerReport.accountName", "Titular")}: Maria Faz, Lda</div>
                <div>IBAN: PT50 0000 0000 0000 0000 0000 0</div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 md:text-right">
              <div className="font-semibold">{t("ownerReport.paymentTerms", "Condições de Pagamento")}</div>
              <div className="text-muted-foreground mt-1">
                <div>{t("ownerReport.dueDate", "Data de Vencimento")}: {format(new Date(reportDate.setDate(reportDate.getDate() + 15)), 'dd/MM/yyyy')}</div>
                <div>{t("ownerReport.paymentReference", "Referência de Pagamento")}: {`REF-${report.ownerId}-${format(new Date(), 'yyyyMM')}`}</div>
              </div>
            </div>
          </div>
          
          <div className="text-muted-foreground text-sm text-center mt-4 print:text-xs">
            {t("ownerReport.reportFooter", "Este relatório serve como recibo para fins contabilísticos. Para mais informações, entre em contato com Maria Faz.")}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}