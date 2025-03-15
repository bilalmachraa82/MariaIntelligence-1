import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, platformColors } from "@/lib/utils";
import { type ReservationSummary } from "@/hooks/use-owner-report";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Download, PieChart } from "lucide-react";

interface PropertyReservationsTableProps {
  propertyName: string;
  reservations: ReservationSummary[];
  currency?: string;
}

export function PropertyReservationsTable({ 
  propertyName, 
  reservations, 
  currency = "€"
}: PropertyReservationsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  
  // Ordenar reservas por data de check-in, mais recentes primeiro
  const sortedReservations = [...reservations].sort((a, b) => 
    new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
  );
  
  // Mostrar apenas as 3 primeiras reservas quando não expandido
  const displayedReservations = expanded 
    ? sortedReservations 
    : sortedReservations.slice(0, 3);
  
  // Calcular totais
  const totalNights = reservations.reduce((sum, res) => sum + res.nights, 0);
  const totalAmount = reservations.reduce((sum, res) => sum + res.totalAmount, 0);
  const totalNet = reservations.reduce((sum, res) => sum + res.netAmount, 0);
  
  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{propertyName}</CardTitle>
            <CardDescription>
              {t('reports.totalReservations', 'Total de Reservas')}: {reservations.length} | 
              {t('reports.totalNights', 'Total de Noites')}: {totalNights}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{formatCurrency(totalAmount)}</div>
            <div className="text-sm text-muted-foreground">
              {t('reports.netValue', 'Valor Líquido')}: {formatCurrency(totalNet)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports.period', 'Período')}</TableHead>
              <TableHead>{t('reports.nights', 'Noites')}</TableHead>
              <TableHead>{t('reports.guest', 'Hóspede')}</TableHead>
              <TableHead>{t('reports.platform', 'Plataforma')}</TableHead>
              <TableHead className="text-right">{t('reports.amount', 'Valor')}</TableHead>
              <TableHead className="text-right">{t('reports.netAmount', 'Valor Líquido')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedReservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell>
                  {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                </TableCell>
                <TableCell>{reservation.nights}</TableCell>
                <TableCell>{reservation.guestName}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className="capitalize" 
                    style={{
                      backgroundColor: `${platformColors[reservation.platform]?.bg || platformColors.other.bg}`,
                      color: `${platformColors[reservation.platform]?.text || platformColors.other.text}`
                    }}
                  >
                    {reservation.platform}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(reservation.totalAmount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(reservation.netAmount)}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Linha de Totais */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={3} className="font-medium">
                {t('reports.totalSummary', 'Total para')} {propertyName}
              </TableCell>
              <TableCell className="font-medium text-center">
                {reservations.length} {t('reports.reservations', 'reservas')}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(totalNet)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        {/* Botão de expandir/colapsar se houver mais de 3 reservas */}
        {reservations.length > 3 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  {t('common.collapse', 'Colapsar')}
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  {t('common.showAll', 'Mostrar Todas')} ({reservations.length})
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PropertyReservationsDetails({
  propertyName,
  reservations,
  currency = "€",
  showDetails = true,
}) {
  const { t } = useTranslation();
  
  // Calcular totais
  const totalNights = reservations.reduce((sum, res) => sum + res.nights, 0);
  const totalAmount = reservations.reduce((sum, res) => sum + res.totalAmount, 0);
  const totalNet = reservations.reduce((sum, res) => sum + res.netAmount, 0);
  const cleaningCosts = reservations.reduce((sum, res) => sum + res.cleaningFee, 0);
  const checkInFees = reservations.reduce((sum, res) => sum + res.checkInFee, 0);
  const commissions = reservations.reduce((sum, res) => sum + res.commission, 0);
  const teamPayments = reservations.reduce((sum, res) => sum + res.teamPayment, 0);
  
  // Dados para gráfico
  const expenseData = [
    { name: t('reports.costs.cleaning', 'Limpeza'), value: cleaningCosts },
    { name: t('reports.costs.checkIn', 'Check-in'), value: checkInFees },
    { name: t('reports.costs.commission', 'Comissão'), value: commissions },
    { name: t('reports.costs.teamPayments', 'Pagamentos Equipa'), value: teamPayments },
    { name: t('reports.costs.netProfit', 'Lucro Líquido'), value: totalNet },
  ];
  
  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>{propertyName}</CardTitle>
        <CardDescription>
          {t('reports.financialDetailedBreakdown', 'Distribuição financeira detalhada')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">
              {t('reports.summaryTitle', 'Resumo de Atividade')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b">
                <span>{t('reports.totalReservations', 'Total de Reservas')}</span>
                <span className="font-medium">{reservations.length}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span>{t('reports.totalNights', 'Total de Noites')}</span>
                <span className="font-medium">{totalNights}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span>{t('reports.grossRevenue', 'Receita Bruta')}</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span>{t('reports.costs.cleaning', 'Custos de Limpeza')}</span>
                <span className="font-medium text-red-500">-{formatCurrency(cleaningCosts)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span>{t('reports.costs.checkIn', 'Taxas de Check-in')}</span>
                <span className="font-medium text-red-500">-{formatCurrency(checkInFees)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span>{t('reports.costs.commission', 'Comissão do Serviço')}</span>
                <span className="font-medium text-red-500">-{formatCurrency(commissions)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span>{t('reports.costs.teamPayments', 'Pagamentos às Equipas')}</span>
                <span className="font-medium text-red-500">-{formatCurrency(teamPayments)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b font-semibold pt-2">
                <span>{t('reports.netProfit', 'Lucro Líquido')}</span>
                <span className="text-green-600">{formatCurrency(totalNet)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">
                {t('reports.revenueDistribution', 'Distribuição de Receita')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('reports.revenueDistributionDesc', 'Análise visual da distribuição de receita')}
              </p>
            </div>
            
            <div className="h-64 w-full flex items-center justify-center">
              {/* Placeholder para o gráfico - em uma implementação real, usaria Recharts */}
              <div className="flex flex-col items-center text-muted-foreground">
                <PieChart className="h-16 w-16 mb-2 opacity-40" />
                <p>{t('reports.chartComingSoon', 'Visualização gráfica em breve')}</p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="mt-4">
              <Download className="h-4 w-4 mr-1" />
              {t('reports.downloadPropertyData', 'Exportar Dados da Propriedade')}
            </Button>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-3">
              {t('reports.reservationDetails', 'Detalhes das Reservas')}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.period', 'Período')}</TableHead>
                  <TableHead>{t('reports.nights', 'Noites')}</TableHead>
                  <TableHead>{t('reports.guest', 'Hóspede')}</TableHead>
                  <TableHead>{t('reports.platform', 'Plataforma')}</TableHead>
                  <TableHead className="text-right">{t('reports.grossAmount', 'Valor Bruto')}</TableHead>
                  <TableHead className="text-right">{t('reports.totalCosts', 'Total Custos')}</TableHead>
                  <TableHead className="text-right">{t('reports.netAmount', 'Valor Líquido')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => {
                  const totalCosts = reservation.cleaningFee + reservation.checkInFee + 
                    reservation.commission + reservation.teamPayment;
                    
                  return (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                      </TableCell>
                      <TableCell>{reservation.nights}</TableCell>
                      <TableCell>{reservation.guestName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="capitalize" 
                          style={{
                            backgroundColor: `${platformColors[reservation.platform]?.bg || platformColors.other.bg}`,
                            color: `${platformColors[reservation.platform]?.text || platformColors.other.text}`
                          }}
                        >
                          {reservation.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reservation.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {formatCurrency(totalCosts)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(reservation.netAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Linha de Totais */}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="font-medium">
                    {t('reports.totalSummary', 'Total')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-500">
                    {formatCurrency(totalAmount - totalNet)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(totalNet)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}