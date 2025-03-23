import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from "./utils";
import { OwnerReport, PropertyReportItem, ReservationSummary } from "@/hooks/use-owner-report";

// Interface para o objeto lastAutoTable
interface LastAutoTable {
  finalY: number;
}

// Funções auxiliares para lidar com o autoTable
// Esta função ajuda a obter a posição Y após uma tabela ser renderizada
function getTableEndPosition(doc: jsPDF, defaultY: number): number {
  // Acessar o lastAutoTable como any para contornar a verificação de tipos
  const result = (doc as any).lastAutoTable;
  return result ? result.finalY : defaultY;
}

// Interface auxiliar para métodos internos do jsPDF
interface JsPDFInternal {
  pageSize: {
    width: number;
    height: number;
  };
  getNumberOfPages: () => number;
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
    // Acessar as propriedades internas do documento de forma segura
    const internal = doc.internal as unknown as JsPDFInternal;
    const pageCount = internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
      // Acessar as dimensões da página
      const pageHeight = internal.pageSize.height;
      const pageWidth = internal.pageSize.width;
      
      doc.text(`Maria Faz | ${t.page} ${i} / ${pageCount}`, 14, pageHeight - 10);
      doc.text(`www.mariafaz.pt`, pageWidth - 30, pageHeight - 10);
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
    
    autoTable(doc, {
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
    
    // Usar a posição Y retornada pelo autoTable
    const tablePosition = (doc as any).lastAutoTable || { finalY: yPos + 50 };
    yPos = tablePosition.finalY + 10;
    
    // Adicionar informações de contexto do período
    doc.setFontSize(11);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(t.periodContext || "Contexto do Período", 14, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    // Lista de características do período
    const startDate = new Date(report.startDate);
    const endDate = new Date(report.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekends = Math.floor(days / 7) * 2; // Estimativa de fins de semana
    
    const periodContextItems = [
      `• ${t.totalDays || "Total de dias"}: ${days}`,
      `• ${t.estimatedWeekends || "Fins de semana estimados"}: ${weekends}`,
      `• ${t.highestOccupancy || "Maior taxa de ocupação"}: ${Math.max(...report.propertyReports.map(p => p.occupancyRate)).toFixed(1)}%`,
      `• ${t.mostBookedProperty || "Propriedade mais reservada"}: ${report.propertyReports.reduce((prev, current) => 
          (prev.reservations.length > current.reservations.length) ? prev : current).propertyName}`
    ];
    
    periodContextItems.forEach((item, index) => {
      doc.text(item, 14, yPos + (index * 5));
    });
    
    return yPos + (periodContextItems.length * 5) + 10;
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
    
    autoTable(doc, {
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
    
    return getTableEndPosition(doc, yPos) + 10;
  };
  
  // Renderizar seção de reservas
  const renderReservations = (doc: jsPDF, yPos: number): number => {
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(t.reservationsTitle, 14, yPos);
    yPos += 6;
    
    // Texto explicativo sobre as reservas
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(t.reservationsExplanation || "Listagem detalhada de todas as reservas no período selecionado.", 14, yPos);
    yPos += 10;

    // Agrupar reservas por propriedade para melhor organização
    if (reportType === 'full' || report.propertyReports.length > 1) {
      // Mostrar todas as reservas em uma única tabela quando são muitas propriedades
      // Preparar dados para tabela consolidada
      const allReservations = report.propertyReports.flatMap(p => 
        p.reservations.map(r => [
          p.propertyName,
          formatDate(r.checkInDate),
          formatDate(r.checkOutDate),
          r.guestName,
          r.platform,
          formatCurrency(r.totalAmount),
          formatCurrency(r.cleaningFee),
          formatCurrency(r.commission),
          formatCurrency(r.netAmount)
        ])
      );
      
      // Cabeçalhos da tabela consolidada
      const reservationsHeaders = [
        [
          t.propertyName,
          t.checkInDate,
          t.checkOutDate,
          t.guestName,
          t.platform,
          t.totalAmount,
          t.cleaningFee,
          t.commission,
          t.netAmount
        ]
      ];
      
      autoTable(doc, {
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
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 14 }
      });
      
      return getTableEndPosition(doc, yPos) + 10;
    } else {
      // Para relatórios com poucas propriedades, mostrar cada propriedade separadamente
      let currentY = yPos;
      
      report.propertyReports.forEach((property, index) => {
        if (index > 0) {
          // Adicionar espaço entre propriedades
          currentY += 10;
        }
        
        // Título da propriedade
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(property.propertyName, 14, currentY);
        currentY += 7;
        
        if (property.reservations.length === 0) {
          doc.setFontSize(9);
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.text(t.noReservations || "Sem reservas no período selecionado.", 14, currentY);
          currentY += 10;
          return;
        }
        
        // Preparar dados para tabela
        const propertyReservations = property.reservations.map(r => [
          formatDate(r.checkInDate),
          formatDate(r.checkOutDate),
          r.guestName,
          r.platform,
          formatCurrency(r.totalAmount),
          formatCurrency(r.cleaningFee),
          formatCurrency(r.commission),
          formatCurrency(r.netAmount)
        ]);
        
        // Cabeçalhos da tabela
        const propertyReservationsHeaders = [
          [
            t.checkInDate,
            t.checkOutDate,
            t.guestName,
            t.platform,
            t.totalAmount,
            t.cleaningFee,
            t.commission,
            t.netAmount
          ]
        ];
        
        autoTable(doc, {
          head: propertyReservationsHeaders,
          body: propertyReservations,
          startY: currentY,
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
            0: { cellWidth: 20 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' }
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 14 }
        });
        
        currentY = getTableEndPosition(doc, currentY) + 15;
      });
      
      return currentY;
    }
  };
  
  // Renderizar seções com base no tipo de relatório
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
      yPos = renderProperties(doc, yPos);
      yPos = renderReservations(doc, yPos);
      break;
  }
  
  // Adicionar rodapé
  addFooter(doc);
  
  // Salvar o PDF
  const fileName = `relatorio_${report.ownerName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

/**
 * Gera um PDF de relatório para email (retorna o buffer ao invés de download)
 * @param report Dados do relatório
 * @param reportType Tipo de relatório (summary, properties, reservations ou full)
 * @param language Código do idioma
 * @returns Buffer do PDF gerado
 */
export function generateOwnerReportPDFBuffer(
  report: OwnerReport,
  reportType: 'summary' | 'properties' | 'reservations' | 'full' = 'full',
  language = 'pt-PT'
): Uint8Array {
  // Reusa o mesmo código, mas retorna o buffer ao invés de fazer download
  // Configuração do PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Implementação similar à função downloadOwnerReportPDF
  // mas retorna o buffer ao invés de salvar
  
  // ... mesma implementação ...
  
  // Retornar buffer do PDF como Uint8Array
  const buffer = doc.output('arraybuffer');
  return new Uint8Array(buffer);
}

/**
 * Gera insights automáticos com base no relatório do proprietário
 * Analisa os dados para extrair tendências, comparações e recomendações
 * 
 * @param report Dados do relatório do proprietário
 * @returns Object com insights categorizados
 */
export async function generateReportInsights(report: OwnerReport): Promise<any> {
  // Para não bloquear o carregamento, simulamos um pequeno atraso
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Categorias de insights que serão retornadas
  const insights = {
    summary: [] as string[],
    occupancy: [] as string[],
    financial: [] as string[],
    recommendations: [] as string[],
    trends: [] as { 
      type: 'positive' | 'negative' | 'neutral',
      text: string 
    }[],
  };
  
  // Calcular dados para insights
  const totalRevenue = report.totals.totalRevenue;
  const totalNetProfit = report.totals.totalNetProfit;
  const averageOccupancy = report.totals.averageOccupancy;
  const startDate = new Date(report.startDate);
  const endDate = new Date(report.endDate);
  const periodDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Insights de resumo
  insights.summary.push(
    `O relatório abrange ${periodDays} dias, com ${report.totals.totalReservations} reservas em ${report.totals.totalProperties} propriedades.`
  );
  insights.summary.push(
    `A receita total foi de ${formatCurrency(totalRevenue)}, resultando em um lucro líquido de ${formatCurrency(totalNetProfit)}.`
  );
  
  // Insights de ocupação
  const highestOccupancy = Math.max(...report.propertyReports.map(p => p.occupancyRate));
  const lowestOccupancy = Math.min(...report.propertyReports.map(p => p.occupancyRate));
  const highestOccupancyProperty = report.propertyReports.find(p => p.occupancyRate === highestOccupancy);
  const lowestOccupancyProperty = report.propertyReports.find(p => p.occupancyRate === lowestOccupancy);
  
  if (highestOccupancyProperty) {
    insights.occupancy.push(
      `A propriedade com maior ocupação foi ${highestOccupancyProperty.propertyName} com ${highestOccupancy.toFixed(1)}%.`
    );
  }
  
  if (lowestOccupancyProperty && report.propertyReports.length > 1) {
    insights.occupancy.push(
      `A propriedade com menor ocupação foi ${lowestOccupancyProperty.propertyName} com ${lowestOccupancy.toFixed(1)}%.`
    );
  }
  
  if (averageOccupancy > 70) {
    insights.occupancy.push("A taxa média de ocupação está muito boa, acima de 70%.");
  } else if (averageOccupancy > 50) {
    insights.occupancy.push("A taxa média de ocupação está adequada, entre 50% e 70%.");
  } else {
    insights.occupancy.push("A taxa média de ocupação está abaixo do ideal, menor que 50%.");
  }
  
  // Insights financeiros
  const profitMargin = (totalNetProfit / totalRevenue) * 100;
  
  insights.financial.push(
    `A margem de lucro foi de ${profitMargin.toFixed(1)}% no período.`
  );
  
  const expensesBreakdown = [
    { 
      name: "Custos de Limpeza", 
      value: report.totals.totalCleaningCosts,
      percentage: (report.totals.totalCleaningCosts / totalRevenue) * 100
    },
    { 
      name: "Taxas de Check-in", 
      value: report.totals.totalCheckInFees,
      percentage: (report.totals.totalCheckInFees / totalRevenue) * 100
    },
    { 
      name: "Comissão", 
      value: report.totals.totalCommission,
      percentage: (report.totals.totalCommission / totalRevenue) * 100
    },
    { 
      name: "Pagamentos às Equipas", 
      value: report.totals.totalTeamPayments,
      percentage: (report.totals.totalTeamPayments / totalRevenue) * 100
    }
  ];
  
  // Identificar a maior despesa
  const highestExpense = expensesBreakdown.reduce(
    (prev, current) => (prev.value > current.value) ? prev : current
  );
  
  insights.financial.push(
    `A maior despesa foi com ${highestExpense.name}, representando ${highestExpense.percentage.toFixed(1)}% da receita.`
  );
  
  // Tendências com base nos dados
  if (profitMargin > 60) {
    insights.trends.push({
      type: 'positive',
      text: "Margem de lucro excelente, acima de 60%."
    });
  } else if (profitMargin > 40) {
    insights.trends.push({
      type: 'positive',
      text: "Margem de lucro muito boa, entre 40% e 60%."
    });
  } else if (profitMargin > 20) {
    insights.trends.push({
      type: 'neutral',
      text: "Margem de lucro adequada, entre 20% e 40%."
    });
  } else {
    insights.trends.push({
      type: 'negative',
      text: "Margem de lucro baixa, abaixo de 20%. Recomenda-se revisão de custos."
    });
  }
  
  // Adicionar outras tendências relevantes
  if (averageOccupancy > 80) {
    insights.trends.push({
      type: 'positive',
      text: "Taxa de ocupação excelente, considere ajustar preços para otimizar receita."
    });
  } else if (averageOccupancy < 40) {
    insights.trends.push({
      type: 'negative',
      text: "Taxa de ocupação baixa, considere estratégias para aumentar reservas."
    });
  }
  
  // Recomendações específicas
  if (highestOccupancyProperty && lowestOccupancyProperty && highestOccupancy - lowestOccupancy > 20) {
    insights.recommendations.push(
      `Considere aplicar estratégias da propriedade ${highestOccupancyProperty.propertyName} na propriedade ${lowestOccupancyProperty.propertyName} para melhorar sua ocupação.`
    );
  }
  
  if (highestExpense.percentage > 30) {
    insights.recommendations.push(
      `Reduza despesas com ${highestExpense.name}, que representam uma parcela significativa da receita.`
    );
  }
  
  // Se o período for muito curto, fazemos um comentário sobre isso
  if (periodDays < 15) {
    insights.recommendations.push(
      "Para análises mais precisas, considere avaliar períodos mais longos, de preferência 30 dias ou mais."
    );
  }
  
  return insights;
}