import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from "./utils";
import { OwnerReport, PropertyReportItem, ReservationSummary } from "@/hooks/use-owner-report";

// Necessário para TypeScript reconhecer os tipos estendidos do jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Interface para traduções
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

/**
 * Exporta relatório do proprietário em formato PDF
 * @param report Dados do relatório
 * @param reportType Tipo de relatório (summary, properties, reservations ou full)
 * @param language Código do idioma
 */
export function downloadOwnerReportPDF(
  report: OwnerReport,
  reportType: 'summary' | 'properties' | 'reservations' | 'full' = 'full',
  language = 'pt-PT'
): void {
  // Traduções
  const translations: Translations = {
    'pt-PT': {
      // Títulos do documento
      reportTitle: 'Relatório Financeiro',
      generatedOn: 'Gerado em',
      page: 'Página',
      ownerReport: 'Relatório do Proprietário',
      
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
      // Document titles
      reportTitle: 'Financial Report',
      generatedOn: 'Generated on',
      page: 'Page',
      ownerReport: 'Owner Report',
      
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
    },
    'es': {
      // Títulos del documento
      reportTitle: 'Informe Financiero',
      generatedOn: 'Generado el',
      page: 'Página',
      ownerReport: 'Informe del Propietario',
      
      // Resumen
      summaryTitle: 'Resumen Financiero',
      ownerName: 'Propietario',
      period: 'Período',
      totalRevenue: 'Ingresos Totales',
      totalCleaningCosts: 'Costos de Limpieza',
      totalCheckInFees: 'Tarifas de Check-in',
      totalCommission: 'Comisión',
      totalTeamPayments: 'Pagos a Equipos',
      totalNetProfit: 'Beneficio Neto',
      averageOccupancy: 'Ocupación Media',
      totalProperties: 'Total de Propiedades',
      totalReservations: 'Total de Reservas',
      
      // Propiedades
      propertiesTitle: 'Detalles por Propiedad',
      propertyName: 'Nombre de la Propiedad',
      revenue: 'Ingresos',
      cleaningCosts: 'Costos de Limpieza',
      checkInFees: 'Tarifas de Check-in',
      commission: 'Comisión',
      teamPayments: 'Pagos',
      netProfit: 'Beneficio Neto',
      occupancyRate: 'Tasa de Ocupación',
      availableDays: 'Días Disponibles',
      occupiedDays: 'Días Ocupados',
      
      // Reservas
      reservationsTitle: 'Detalles de las Reservas',
      checkInDate: 'Check-in',
      checkOutDate: 'Check-out',
      guestName: 'Huésped',
      platform: 'Plataforma',
      totalAmount: 'Importe Total',
      cleaningFee: 'Limpieza',
      checkInFee: 'Check-in',
      teamPayment: 'Equipo',
      netAmount: 'Importe Neto',
      to: 'a',
    },
    'fr': {
      // Titres du document
      reportTitle: 'Rapport Financier',
      generatedOn: 'Généré le',
      page: 'Page',
      ownerReport: 'Rapport du Propriétaire',
      
      // Résumé
      summaryTitle: 'Résumé Financier',
      ownerName: 'Propriétaire',
      period: 'Période',
      totalRevenue: 'Revenu Total',
      totalCleaningCosts: 'Coûts de Nettoyage',
      totalCheckInFees: 'Frais d\'Enregistrement',
      totalCommission: 'Commission',
      totalTeamPayments: 'Paiements aux Équipes',
      totalNetProfit: 'Bénéfice Net',
      averageOccupancy: 'Taux d\'Occupation Moyen',
      totalProperties: 'Total des Propriétés',
      totalReservations: 'Total des Réservations',
      
      // Propriétés
      propertiesTitle: 'Détails par Propriété',
      propertyName: 'Nom de la Propriété',
      revenue: 'Revenu',
      cleaningCosts: 'Coûts de Nettoyage',
      checkInFees: 'Frais d\'Enregistrement',
      commission: 'Commission',
      teamPayments: 'Paiements',
      netProfit: 'Bénéfice Net',
      occupancyRate: 'Taux d\'Occupation',
      availableDays: 'Jours Disponibles',
      occupiedDays: 'Jours Occupés',
      
      // Réservations
      reservationsTitle: 'Détails des Réservations',
      checkInDate: 'Arrivée',
      checkOutDate: 'Départ',
      guestName: 'Client',
      platform: 'Plateforme',
      totalAmount: 'Montant Total',
      cleaningFee: 'Nettoyage',
      checkInFee: 'Enregistrement',
      teamPayment: 'Équipe',
      netAmount: 'Montant Net',
      to: 'à',
    }
  };

  // Selecionar idioma
  const t = translations[language as keyof typeof translations] || translations['en'];
  
  // Configuração do PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Configurações de estilo
  const primaryColor = [41, 98, 255]; // RGB para azul primário
  const textColor = [60, 60, 60]; // RGB para texto
  const secondaryColor = [100, 100, 100]; // RGB para texto secundário
  
  // Cabeçalho do documento
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(t.ownerReport, 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`${t.ownerName}: ${report.ownerName}`, 14, 30);
  
  // Período do relatório
  const periodStr = `${formatDate(report.startDate)} ${t.to} ${formatDate(report.endDate)}`;
  doc.text(`${t.period}: ${periodStr}`, 14, 37);
  
  // Data de geração
  const today = new Date();
  doc.text(`${t.generatedOn}: ${formatDate(today.toISOString())}`, 14, 44);
  
  // Definir posição atual
  let yPos = 55;
  
  // Função auxiliar para adicionar rodapé em cada página
  const addFooter = (doc: jsPDF) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Maria Faz | ${t.page} ${i} / ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`www.mariafaz.pt`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
  };
  
  // Renderizar seção de resumo
  const renderSummary = (doc: jsPDF, yPos: number): number => {
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t.summaryTitle, 14, yPos);
    yPos += 10;
    
    // Tabela de resumo
    const summaryData = [
      [t.totalRevenue, formatCurrency(report.totals.totalRevenue)],
      [t.totalCleaningCosts, formatCurrency(report.totals.totalCleaningCosts)],
      [t.totalCheckInFees, formatCurrency(report.totals.totalCheckInFees)],
      [t.totalCommission, formatCurrency(report.totals.totalCommission)],
      [t.totalTeamPayments, formatCurrency(report.totals.totalTeamPayments)],
      [t.totalNetProfit, formatCurrency(report.totals.totalNetProfit)],
      [t.averageOccupancy, `${report.totals.averageOccupancy.toFixed(1)}%`],
      [t.totalProperties, report.totals.totalProperties.toString()],
      [t.totalReservations, report.totals.totalReservations.toString()],
    ];
    
    doc.autoTable({
      head: [],
      body: summaryData,
      startY: yPos,
      theme: 'grid',
      styles: {
        cellPadding: 5,
        fontSize: 10,
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 50 }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 14 }
    });
    
    return doc.lastAutoTable.finalY + 10;
  };
  
  // Renderizar seção de propriedades
  const renderProperties = (doc: jsPDF, yPos: number): number => {
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t.propertiesTitle, 14, yPos);
    yPos += 10;
    
    // Preparar dados para tabela
    const propertiesData = report.propertyReports.map((property: PropertyReportItem) => [
      property.propertyName,
      formatCurrency(property.revenue),
      formatCurrency(property.netProfit),
      `${property.occupancyRate.toFixed(1)}%`,
      property.occupiedDays.toString(),
      property.availableDays.toString()
    ]);
    
    // Cabeçalhos da tabela
    const propertiesHeaders = [
      [
        t.propertyName,
        t.revenue,
        t.netProfit,
        t.occupancyRate,
        t.occupiedDays,
        t.availableDays
      ]
    ];
    
    doc.autoTable({
      head: propertiesHeaders,
      body: propertiesData,
      startY: yPos,
      theme: 'grid',
      styles: {
        cellPadding: 5,
        fontSize: 9,
        lineColor: [200, 200, 200],
        textColor: [50, 50, 50]
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [50, 50, 50],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 14 }
    });
    
    return doc.lastAutoTable.finalY + 10;
  };
  
  // Renderizar seção de reservas
  const renderReservations = (doc: jsPDF, yPos: number): number => {
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t.reservationsTitle, 14, yPos);
    yPos += 10;
    
    // Preparar dados para tabela
    const allReservations = report.propertyReports.flatMap(p => 
      p.reservations.map(r => [
        p.propertyName,
        formatDate(r.checkInDate),
        formatDate(r.checkOutDate),
        r.guestName,
        r.platform,
        formatCurrency(r.totalAmount),
        formatCurrency(r.netAmount)
      ])
    );
    
    // Cabeçalhos da tabela
    const reservationsHeaders = [
      [
        t.propertyName,
        t.checkInDate,
        t.checkOutDate,
        t.guestName,
        t.platform,
        t.totalAmount,
        t.netAmount
      ]
    ];
    
    doc.autoTable({
      head: reservationsHeaders,
      body: allReservations,
      startY: yPos,
      theme: 'grid',
      styles: {
        cellPadding: 4,
        fontSize: 8,
        lineColor: [200, 200, 200],
        textColor: [50, 50, 50]
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [50, 50, 50],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 25 }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 14 }
    });
    
    return doc.lastAutoTable.finalY + 10;
  };
  
  // Renderizar relatório conforme tipo selecionado
  switch (reportType) {
    case 'summary':
      yPos = renderSummary(doc, yPos);
      break;
    case 'properties':
      yPos = renderProperties(doc, yPos);
      break;
    case 'reservations':
      yPos = renderReservations(doc, yPos);
      break;
    case 'full':
    default:
      yPos = renderSummary(doc, yPos);
      doc.addPage();
      yPos = 20;
      yPos = renderProperties(doc, yPos);
      doc.addPage();
      yPos = 20;
      yPos = renderReservations(doc, yPos);
      break;
  }
  
  // Adicionar rodapé em todas as páginas
  addFooter(doc);
  
  // Nome do arquivo
  const ownerSlug = report.ownerName.toLowerCase().replace(/\s+/g, '-');
  const dateSlug = report.startDate.split('T')[0];
  
  // Tipo de relatório no nome do arquivo
  let fileType;
  switch (reportType) {
    case 'summary':
      fileType = language === 'pt-PT' ? 'resumo' : 'summary';
      break;
    case 'properties':
      fileType = language === 'pt-PT' ? 'propriedades' : 'properties';
      break;
    case 'reservations':
      fileType = language === 'pt-PT' ? 'reservas' : 'reservations';
      break;
    case 'full':
    default:
      fileType = language === 'pt-PT' ? 'relatorio-completo' : 'full-report';
      break;
  }
  
  const fileName = `maria-faz-${fileType}-${ownerSlug}-${dateSlug}.pdf`;
  
  // Salvar o PDF
  doc.save(fileName);
}

/**
 * Exportar relatório financeiro em formato Excel
 * Implementação futura - placeholder
 */
export function downloadOwnerReportExcel(
  report: OwnerReport,
  reportType: 'summary' | 'properties' | 'reservations' | 'full' = 'full',
  language = 'pt-PT'
): void {
  // A implementar com biblioteca ExcelJS ou similar
  console.warn("Exportação para Excel ainda não implementada");
  
  // Fallback para CSV enquanto Excel não está implementado
  import('./export-utils').then(module => {
    module.downloadOwnerReportCSV(report, reportType, language);
  });
}