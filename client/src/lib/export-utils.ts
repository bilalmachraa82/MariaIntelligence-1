import { formatCurrency, formatDate } from "./utils";
import { OwnerReport, PropertyReportItem, ReservationSummary } from "@/hooks/use-owner-report";

/**
 * Converter dados para formato CSV
 * @param data Array de objetos a serem convertidos para CSV
 * @param headers Cabeçalhos das colunas
 * @param fieldExtractors Funções para extrair valores de cada campo
 * @returns String em formato CSV
 */
export function convertToCSV(
  data: any[],
  headers: string[],
  fieldExtractors: ((item: any) => string)[]
): string {
  // Linha de cabeçalho
  const headerRow = headers.join(',');
  
  // Linhas de dados
  const dataRows = data.map(item => {
    return fieldExtractors.map(extractor => {
      const value = extractor(item);
      // Escapa valores com aspas se contiverem vírgulas ou quebras de linha
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Juntar tudo
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Converter relatório do proprietário para CSV
 * @param report Dados do relatório do proprietário
 * @param language Código do idioma (pt-PT, en, etc.)
 * @returns Objeto com diferentes CSVs: resumo, propriedades e reservas
 */
export function convertOwnerReportToCSV(report: OwnerReport, language = 'pt-PT'): {
  summary: string;
  properties: string;
  reservations: string;
} {
  // Traduções
  const translations = {
    'pt-PT': {
      // Resumo
      summaryTitle: 'Resumo Financeiro',
      ownerName: 'Proprietário',
      period: 'Período',
      totalRevenue: 'Receita Total',
      totalCleaningCosts: 'Custos de Limpeza',
      totalCheckInFees: 'Taxas de Check-in',
      totalCommission: 'Comissão',
      totalTeamPayments: 'Pagamentos às Equipas',
      totalNetProfit: 'Lucro Líquido',
      averageOccupancy: 'Ocupação Média',
      totalProperties: 'Total de Propriedades',
      totalReservations: 'Total de Reservas',
      
      // Propriedades
      propertiesTitle: 'Detalhes por Propriedade',
      propertyName: 'Nome da Propriedade',
      revenue: 'Receita',
      cleaningCosts: 'Custos de Limpeza',
      checkInFees: 'Taxas de Check-in',
      commission: 'Comissão',
      teamPayments: 'Pagamentos',
      netProfit: 'Lucro Líquido',
      occupancyRate: 'Taxa de Ocupação',
      availableDays: 'Dias Disponíveis',
      occupiedDays: 'Dias Ocupados',
      
      // Reservas
      reservationsTitle: 'Detalhes das Reservas',
      checkInDate: 'Check-in',
      checkOutDate: 'Check-out',
      guestName: 'Hóspede',
      platform: 'Plataforma',
      totalAmount: 'Valor Total',
      cleaningFee: 'Limpeza',
      checkInFee: 'Check-in',
      teamPayment: 'Equipa',
      netAmount: 'Valor Líquido',
      to: 'a',
    },
    'en': {
      // Summary
      summaryTitle: 'Financial Summary',
      ownerName: 'Owner',
      period: 'Period',
      totalRevenue: 'Total Revenue',
      totalCleaningCosts: 'Cleaning Costs',
      totalCheckInFees: 'Check-in Fees',
      totalCommission: 'Commission',
      totalTeamPayments: 'Team Payments',
      totalNetProfit: 'Net Profit',
      averageOccupancy: 'Average Occupancy',
      totalProperties: 'Total Properties',
      totalReservations: 'Total Reservations',
      
      // Properties
      propertiesTitle: 'Property Details',
      propertyName: 'Property Name',
      revenue: 'Revenue',
      cleaningCosts: 'Cleaning Costs',
      checkInFees: 'Check-in Fees',
      commission: 'Commission',
      teamPayments: 'Team Payments',
      netProfit: 'Net Profit',
      occupancyRate: 'Occupancy Rate',
      availableDays: 'Available Days',
      occupiedDays: 'Occupied Days',
      
      // Reservations
      reservationsTitle: 'Reservation Details',
      checkInDate: 'Check-in',
      checkOutDate: 'Check-out',
      guestName: 'Guest',
      platform: 'Platform',
      totalAmount: 'Total Amount',
      cleaningFee: 'Cleaning',
      checkInFee: 'Check-in',
      teamPayment: 'Team',
      netAmount: 'Net Amount',
      to: 'to',
    }
  };
  
  // Selecionar idioma
  const t = translations[language as keyof typeof translations] || translations['en'];
  
  // Período formatado
  const periodStr = `${formatDate(report.startDate)} ${t.to} ${formatDate(report.endDate)}`;
  
  // CSV de Resumo
  const summaryData = [
    { key: t.ownerName, value: report.ownerName },
    { key: t.period, value: periodStr },
    { key: t.totalRevenue, value: formatCurrency(report.totals.totalRevenue) },
    { key: t.totalCleaningCosts, value: formatCurrency(report.totals.totalCleaningCosts) },
    { key: t.totalCheckInFees, value: formatCurrency(report.totals.totalCheckInFees) },
    { key: t.totalCommission, value: formatCurrency(report.totals.totalCommission) },
    { key: t.totalTeamPayments, value: formatCurrency(report.totals.totalTeamPayments) },
    { key: t.totalNetProfit, value: formatCurrency(report.totals.totalNetProfit) },
    { key: t.averageOccupancy, value: `${report.totals.averageOccupancy.toFixed(1)}%` },
    { key: t.totalProperties, value: report.totals.totalProperties.toString() },
    { key: t.totalReservations, value: report.totals.totalReservations.toString() },
  ];
  
  const summary = convertToCSV(
    summaryData,
    [t.summaryTitle, ''],
    [
      item => item.key,
      item => item.value
    ]
  );
  
  // CSV de Propriedades
  const properties = convertToCSV(
    report.propertyReports,
    [
      t.propertyName,
      t.revenue,
      t.cleaningCosts,
      t.checkInFees,
      t.commission,
      t.teamPayments,
      t.netProfit,
      t.occupancyRate,
      t.availableDays,
      t.occupiedDays
    ],
    [
      (item: PropertyReportItem) => item.propertyName,
      (item: PropertyReportItem) => formatCurrency(item.revenue),
      (item: PropertyReportItem) => formatCurrency(item.cleaningCosts),
      (item: PropertyReportItem) => formatCurrency(item.checkInFees),
      (item: PropertyReportItem) => formatCurrency(item.commission),
      (item: PropertyReportItem) => formatCurrency(item.teamPayments),
      (item: PropertyReportItem) => formatCurrency(item.netProfit),
      (item: PropertyReportItem) => `${item.occupancyRate.toFixed(1)}%`,
      (item: PropertyReportItem) => item.availableDays.toString(),
      (item: PropertyReportItem) => item.occupiedDays.toString(),
    ]
  );
  
  // CSV de Reservas
  const allReservations = report.propertyReports.flatMap(p => 
    p.reservations.map(r => ({ ...r, propertyName: p.propertyName }))
  );
  
  const reservations = convertToCSV(
    allReservations,
    [
      t.propertyName,
      t.checkInDate,
      t.checkOutDate,
      t.guestName,
      t.platform,
      t.totalAmount,
      t.cleaningFee,
      t.checkInFee,
      t.commission,
      t.teamPayment,
      t.netAmount
    ],
    [
      (item: ReservationSummary & { propertyName: string }) => item.propertyName,
      (item: ReservationSummary) => formatDate(item.checkInDate),
      (item: ReservationSummary) => formatDate(item.checkOutDate),
      (item: ReservationSummary) => item.guestName,
      (item: ReservationSummary) => item.platform,
      (item: ReservationSummary) => formatCurrency(item.totalAmount),
      (item: ReservationSummary) => formatCurrency(item.cleaningFee),
      (item: ReservationSummary) => formatCurrency(item.checkInFee),
      (item: ReservationSummary) => formatCurrency(item.commission),
      (item: ReservationSummary) => formatCurrency(item.teamPayment),
      (item: ReservationSummary) => formatCurrency(item.netAmount),
    ]
  );
  
  return { summary, properties, reservations };
}

/**
 * Exportar o relatório como um arquivo CSV
 * @param report Relatório do proprietário
 * @param reportType Tipo de relatório (summary, properties, reservations ou full)
 * @param language Código do idioma
 */
export function downloadOwnerReportCSV(
  report: OwnerReport,
  reportType: 'summary' | 'properties' | 'reservations' | 'full' = 'full',
  language = 'pt-PT'
): void {
  const { summary, properties, reservations } = convertOwnerReportToCSV(report, language);
  
  let csvContent: string;
  let fileName: string;
  
  const ownerSlug = report.ownerName.toLowerCase().replace(/\s+/g, '-');
  const dateSlug = report.startDate.split('T')[0];
  
  switch (reportType) {
    case 'summary':
      csvContent = summary;
      fileName = `maria-faz-resumo-${ownerSlug}-${dateSlug}.csv`;
      break;
    case 'properties':
      csvContent = properties;
      fileName = `maria-faz-propriedades-${ownerSlug}-${dateSlug}.csv`;
      break;
    case 'reservations':
      csvContent = reservations;
      fileName = `maria-faz-reservas-${ownerSlug}-${dateSlug}.csv`;
      break;
    case 'full':
    default:
      csvContent = `${summary}\n\n${properties}\n\n${reservations}`;
      fileName = `maria-faz-relatorio-completo-${ownerSlug}-${dateSlug}.csv`;
  }
  
  // Converter para UTF-8 com BOM para suporte a caracteres especiais no Excel
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Criar URL para download
  const url = URL.createObjectURL(blob);
  
  // Criar link e simular clique
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Limpar
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}