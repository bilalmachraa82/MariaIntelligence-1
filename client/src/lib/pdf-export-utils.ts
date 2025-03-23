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
 * Exporta relatório do proprietário em formato PDF com design ultra moderno
 * @param report Dados do relatório
 * @param reportType Tipo de relatório (summary, properties, reservations ou full)
 * @param language Código do idioma
 */
export function downloadOwnerReportPDF(
  report: OwnerReport,
  reportType: 'summary' | 'properties' | 'reservations' | 'full' = 'full',
  language = 'pt-PT'
): void {
  // Traduções (mantidas as mesmas)
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
      
      // Novos elementos adicionados
      financialHighlights: 'Destaques Financeiros',
      profitMargin: 'Margem de Lucro',
      currency: '€',
      performanceInsights: 'Insights de Performance',
      comparedTo: 'comparado ao período anterior',
      propertySummary: 'Sumário de Propriedades',
      totalOccupiedDays: 'Total de Dias Ocupados',
      noReservations: 'Sem reservas no período selecionado',
      periodContext: 'Contexto do Período',
      totalDays: 'Total de dias',
      estimatedWeekends: 'Fins de semana estimados',
      highestOccupancy: 'Maior taxa de ocupação',
      mostBookedProperty: 'Propriedade mais reservada',
      reservationsExplanation: 'Listagem detalhada de todas as reservas no período selecionado',
      poweredBy: 'Powered by Maria Faz',
      confidential: 'Documento Confidencial',
      preparationTime: 'Tempo de preparação',
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
      
      // Novos elementos adicionados
      financialHighlights: 'Financial Highlights',
      profitMargin: 'Profit Margin',
      currency: '€',
      performanceInsights: 'Performance Insights',
      comparedTo: 'compared to previous period',
      propertySummary: 'Property Summary',
      totalOccupiedDays: 'Total Occupied Days',
      noReservations: 'No reservations in the selected period',
      periodContext: 'Period Context',
      totalDays: 'Total days',
      estimatedWeekends: 'Estimated weekends',
      highestOccupancy: 'Highest occupancy rate',
      mostBookedProperty: 'Most booked property',
      reservationsExplanation: 'Detailed listing of all reservations in the selected period',
      poweredBy: 'Powered by Maria Faz',
      confidential: 'Confidential Document',
      preparationTime: 'Preparation time',
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
      
      // Nuevos elementos añadidos
      financialHighlights: 'Destacados Financieros',
      profitMargin: 'Margen de Beneficio',
      currency: '€',
      performanceInsights: 'Insights de Rendimiento',
      comparedTo: 'comparado con el período anterior',
      propertySummary: 'Resumen de Propiedades',
      totalOccupiedDays: 'Total de Días Ocupados',
      noReservations: 'Sin reservas en el período seleccionado',
      periodContext: 'Contexto del Período',
      totalDays: 'Total de días',
      estimatedWeekends: 'Fines de semana estimados',
      highestOccupancy: 'Mayor tasa de ocupación',
      mostBookedProperty: 'Propiedad más reservada',
      reservationsExplanation: 'Listado detallado de todas las reservas en el período seleccionado',
      poweredBy: 'Desarrollado por Maria Faz',
      confidential: 'Documento Confidencial',
      preparationTime: 'Tiempo de preparación',
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
      
      // Nouveaux éléments ajoutés
      financialHighlights: 'Points Forts Financiers',
      profitMargin: 'Marge Bénéficiaire',
      currency: '€',
      performanceInsights: 'Analyses de Performance',
      comparedTo: 'par rapport à la période précédente',
      propertySummary: 'Résumé des Propriétés',
      totalOccupiedDays: 'Total des Jours Occupés',
      noReservations: 'Pas de réservations dans la période sélectionnée',
      periodContext: 'Contexte de la Période',
      totalDays: 'Jours totaux',
      estimatedWeekends: 'Weekends estimés',
      highestOccupancy: 'Taux d\'occupation le plus élevé',
      mostBookedProperty: 'Propriété la plus réservée',
      reservationsExplanation: 'Liste détaillée de toutes les réservations de la période sélectionnée',
      poweredBy: 'Propulsé par Maria Faz',
      confidential: 'Document Confidentiel',
      preparationTime: 'Temps de préparation',
    }
  };

  // Selecionar idioma
  const t = translations[language as keyof typeof translations] || translations['en'];
  
  // Configuração do PDF - Formato A4 em retrato
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Esquema de cores alinhado com a identidade do Maria Faz
  const brandColor = [41, 121, 255]; // Azul Maria Faz
  const accentColor = [255, 94, 0]; // Laranja Maria Faz
  const textColor = [33, 33, 33]; // Quase preto
  const secondaryTextColor = [117, 117, 117]; // Cinza médio
  const lightGray = [224, 224, 224]; // Cinza claro para bordas e fundos alternados
  const highlightColor = [76, 175, 80]; // Verde para valores positivos
  const warningColor = [255, 94, 0]; // Laranja para alertas (mesmo do accent)
  
  // Medidas e margens
  const margin = 14; // Margem padrão em mm
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - (margin * 2);
  const maxX = pageWidth - margin;
  
  // Definição de posição inicial
  let yPos = margin;
  
  // Adicionar cabeçalho com design moderno
  // ===============================================
  
  // Retângulo colorido superior - faixa de identidade visual
  doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Logo ou nome da empresa (watermark sutil)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('MARIA FAZ', pageWidth - 15, 10, { align: 'right' });
  
  // Título do documento
  yPos = 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(t.ownerReport.toUpperCase(), margin, yPos, { align: 'left' });
  
  // Linha horizontal decorativa
  yPos += 3;
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + 60, yPos);
  
  // Informações principais
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`${t.ownerName}:`, margin, yPos);
  
  // Nome do proprietário com destaque
  doc.setFont('helvetica', 'bold');
  doc.text(` ${report.ownerName}`, margin + 25, yPos);
  
  // Período do relatório
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.period}:`, margin, yPos);
  
  // Período formatado com estilo
  const periodStr = `${formatDate(report.startDate)} ${t.to} ${formatDate(report.endDate)}`;
  doc.setFont('helvetica', 'bold');
  doc.text(` ${periodStr}`, margin + 25, yPos);
  
  // Data de geração com estilo mais discreto
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text(`${t.generatedOn}: ${formatDate(new Date().toISOString())}`, margin, yPos);
  
  // Adicionar um tempo de preparação estimado (2 segundos por reserva)
  const prepTime = Math.max(1, Math.round(report.totals.totalReservations * 2 / 60));
  doc.text(`${t.preparationTime}: ${prepTime} min`, maxX - 30, yPos, { align: 'right' });
  
  // Linha divisória completa
  yPos += 8;
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, maxX, yPos);
  
  // Seção de destaques financeiros - Cards visuais
  // ===============================================
  yPos += 10;
  const renderFinancialHighlights = (doc: jsPDF, startY: number): number => {
    let currentY = startY;
    
    // Título da seção com ícone (simulado com caractere)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(`✦ ${t.financialHighlights}`, margin, currentY);
    currentY += 15;
    
    // Calcular a margem de lucro
    const profitMargin = report.totals.totalNetProfit / report.totals.totalRevenue * 100;
    
    // Layout com três cards destacados em linha
    const cardWidth = contentWidth / 3 - 5;
    const cardHeight = 35;
    
    // Função para criar card de métrica
    const renderMetricCard = (x: number, y: number, width: number, height: number, 
                              title: string, value: string, subtitle: string = '', 
                              color: number[] = brandColor) => {
      // Sombra sutil (simulada com retângulo cinza deslocado)
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(x + 1, y + 1, width, height, 2, 2, 'F');
      
      // Card com borda arredondada
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(x, y, width, height, 2, 2, 'FD');
      
      // Título do card
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
      doc.text(title, x + 5, y + 7);
      
      // Valor principal com destaque
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(value, x + 5, y + 20);
      
      // Subtítulo opcional
      if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
        doc.text(subtitle, x + 5, y + 28);
      }
    };
    
    // Card 1: Receita Total
    renderMetricCard(
      margin, 
      currentY, 
      cardWidth, 
      cardHeight, 
      t.totalRevenue, 
      formatCurrency(report.totals.totalRevenue),
      `${report.totals.totalReservations} ${t.totalReservations.toLowerCase()}`
    );
    
    // Card 2: Lucro Líquido (verde se positivo, laranja se negativo)
    const profitColor = report.totals.totalNetProfit >= 0 ? highlightColor : warningColor;
    renderMetricCard(
      margin + cardWidth + 5, 
      currentY, 
      cardWidth, 
      cardHeight, 
      t.totalNetProfit, 
      formatCurrency(report.totals.totalNetProfit),
      `${t.profitMargin}: ${profitMargin.toFixed(1)}%`,
      profitColor
    );
    
    // Card 3: Taxa de Ocupação
    renderMetricCard(
      margin + (cardWidth + 5) * 2, 
      currentY, 
      cardWidth, 
      cardHeight, 
      t.averageOccupancy, 
      `${report.totals.averageOccupancy.toFixed(1)}%`,
      `${report.totals.totalProperties} ${t.totalProperties.toLowerCase()}`
    );
    
    return currentY + cardHeight + 15;
  };
  
  // Renderizar seção de resumo financeiro em formato tabular moderno
  // ===============================================
  const renderSummary = (doc: jsPDF, startY: number): number => {
    let currentY = startY;
    
    // Título da seção
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(`${t.summaryTitle}`, margin, currentY);
    currentY += 10;
    
    // Tabela de resumo com design aprimorado
    // Removemos a entrada de totalTeamPayments porque é igual aos custos de limpeza
    const summaryData = [
      [t.totalRevenue, formatCurrency(report.totals.totalRevenue)],
      [t.totalCleaningCosts, formatCurrency(report.totals.totalCleaningCosts)],
      [t.totalCheckInFees, formatCurrency(report.totals.totalCheckInFees)],
      [t.totalCommission, formatCurrency(report.totals.totalCommission)],
      [t.totalNetProfit, formatCurrency(report.totals.totalNetProfit)],
      [t.averageOccupancy, `${report.totals.averageOccupancy.toFixed(1)}%`],
      [t.totalProperties, report.totals.totalProperties.toString()],
      [t.totalReservations, report.totals.totalReservations.toString()],
    ];
    
    autoTable(doc, {
      head: [],
      body: summaryData,
      startY: currentY,
      theme: 'grid',
      styles: {
        cellPadding: 5,
        fontSize: 10,
        lineColor: [200, 200, 200],
        cellWidth: 'auto',
        valign: 'middle',
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          cellWidth: 80,
          fillColor: [250, 250, 250]
        },
        1: { 
          halign: 'right', 
          cellWidth: 50,
          fontStyle: 'bold'
        }
      },
      didDrawCell: (data) => {
        // Destacar a célula de lucro líquido
        if (data.row.index === 4 && data.column.index === 1) {
          // Índice 4 corresponde ao lucro líquido
          doc.setTextColor(
            report.totals.totalNetProfit >= 0 ? highlightColor[0] : warningColor[0],
            report.totals.totalNetProfit >= 0 ? highlightColor[1] : warningColor[1],
            report.totals.totalNetProfit >= 0 ? highlightColor[2] : warningColor[2]
          );
        } else {
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        }
      },
      margin: { left: margin, right: margin }
    });
    
    // Atualizar posição Y após a tabela
    const tableEnd = (doc as any).lastAutoTable || { finalY: currentY + 50 };
    currentY = tableEnd.finalY + 5;
    
    // Informações de contexto do período em um box estilizado
    doc.setFillColor(245, 245, 250); // Fundo azulado muito claro
    doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, 'F');
    
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(t.periodContext, margin + 5, currentY);
    
    // Dados do período em 2 colunas
    const startDate = new Date(report.startDate);
    const endDate = new Date(report.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekends = Math.floor(days / 7) * 2;
    
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    
    const col1Width = contentWidth / 2;
    
    // Coluna 1
    doc.text(`• ${t.totalDays}: ${days}`, margin + 5, currentY);
    doc.text(`• ${t.estimatedWeekends}: ${weekends}`, margin + 5, currentY + 5);
    
    // Coluna 2
    doc.text(`• ${t.highestOccupancy}: ${Math.max(...report.propertyReports.map(p => p.occupancyRate)).toFixed(1)}%`, 
             margin + col1Width, currentY);
    
    const mostBookedProperty = report.propertyReports.reduce((prev, current) => 
      (prev.reservations.length > current.reservations.length) ? prev : current);
      
    doc.text(`• ${t.mostBookedProperty}: ${mostBookedProperty.propertyName}`, 
             margin + col1Width, currentY + 5);
    
    return currentY + 25;
  };
  
  // Renderizar seção de propriedades com gráfico visual de ocupação
  // ===============================================
  const renderProperties = (doc: jsPDF, startY: number): number => {
    let currentY = startY;
    
    // Título da seção
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(t.propertiesTitle, margin, currentY);
    currentY += 10;
    
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
      startY: currentY,
      theme: 'grid',
      styles: {
        cellPadding: 5,
        fontSize: 9,
        lineColor: [220, 220, 230],
        textColor: [50, 50, 50],
        valign: 'middle'
      },
      headStyles: {
        fillColor: brandColor,
        textColor: [255, 255, 255],
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
        fillColor: [245, 245, 250]
      },
      didDrawCell: (data) => {
        // Destacar células de lucro líquido
        if (data.column.index === 2 && data.row.index >= 0 && data.section === 'body') {
          const property = report.propertyReports[data.row.index];
          if (property) {
            doc.setTextColor(
              property.netProfit >= 0 ? highlightColor[0] : warningColor[0],
              property.netProfit >= 0 ? highlightColor[1] : warningColor[1],
              property.netProfit >= 0 ? highlightColor[2] : warningColor[2]
            );
          }
        } 
        // Adicionar barras visuais de ocupação
        else if (data.column.index === 3 && data.section === 'body' && data.row.index >= 0) {
          const property = report.propertyReports[data.row.index];
          if (property) {
            const occupancyRate = property.occupancyRate;
            const barWidth = Math.min(30, occupancyRate / 100 * 30);
            const barHeight = 3;
            const barY = data.cell.y + data.cell.height - 6;
            
            // Fundo cinza (total)
            doc.setFillColor(220, 220, 220);
            doc.rect(data.cell.x + 20, barY, 30, barHeight, 'F');
            
            // Barra colorida (ocupação) - cor baseada na taxa
            let barColor = [255, 152, 0]; // Laranja para médio
            if (occupancyRate > 70) barColor = [76, 175, 80]; // Verde para bom
            if (occupancyRate < 40) barColor = [244, 67, 54]; // Vermelho para ruim
            
            doc.setFillColor(barColor[0], barColor[1], barColor[2]);
            doc.rect(data.cell.x + 20, barY, barWidth, barHeight, 'F');
          }
        }
      },
      margin: { left: margin, right: margin }
    });
    
    // Atualizar posição Y
    const tableEnd = (doc as any).lastAutoTable || { finalY: currentY + 50 };
    return tableEnd.finalY + 10;
  };
  
  // Renderizar seção de reservas com design de tabela moderna
  // ===============================================
  const renderReservations = (doc: jsPDF, startY: number): number => {
    let currentY = startY;
    
    // Título da seção
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(t.reservationsTitle, margin, currentY);
    currentY += 6;
    
    // Texto explicativo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text(t.reservationsExplanation, margin, currentY);
    currentY += 10;
    
    // Agrupar reservas dependendo da quantidade de propriedades
    if (reportType === 'full' || report.propertyReports.length > 1) {
      // Mostrar todas as reservas consolidadas para relatórios completos ou com múltiplas propriedades
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
      
      // Cabeçalhos da tabela
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
      
      // Tabela de reservas com design moderno
      autoTable(doc, {
        head: reservationsHeaders,
        body: allReservations,
        startY: currentY,
        theme: 'grid',
        styles: {
          cellPadding: 4,
          fontSize: 8,
          lineColor: [220, 220, 230],
          textColor: [50, 50, 50]
        },
        headStyles: {
          fillColor: brandColor,
          textColor: [255, 255, 255],
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
          8: { halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250]
        },
        didDrawCell: (data) => {
          // Destacar células de valor líquido
          if (data.column.index === 8 && data.section === 'body') {
            const value = parseFloat(allReservations[data.row.index][8].replace(/[^\d.-]/g, ''));
            doc.setTextColor(
              value >= 0 ? highlightColor[0] : warningColor[0],
              value >= 0 ? highlightColor[1] : warningColor[1],
              value >= 0 ? highlightColor[2] : warningColor[2]
            );
          }
        },
        margin: { left: margin, right: margin }
      });
      
      // Atualizar posição Y
      const tableEnd = (doc as any).lastAutoTable || { finalY: currentY + 50 };
      return tableEnd.finalY + 10;
    } else {
      // Para relatórios de propriedade única, mostrar as propriedades separadamente com mais detalhes
      let finalY = currentY;
      
      report.propertyReports.forEach((property, index) => {
        if (index > 0) currentY += 10;
        
        // Título da propriedade com fundo colorido sutil
        doc.setFillColor(245, 245, 250);
        doc.roundedRect(margin, currentY - 5, contentWidth, 12, 2, 2, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.text(property.propertyName, margin + 5, currentY + 2);
        currentY += 10;
        
        // Verificar se há reservas
        if (property.reservations.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
          doc.text(t.noReservations, margin, currentY);
          currentY += 10;
        } else {
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
          
          // Cabeçalhos
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
          
          // Tabela de reservas por propriedade
          autoTable(doc, {
            head: propertyReservationsHeaders,
            body: propertyReservations,
            startY: currentY,
            theme: 'grid',
            styles: {
              cellPadding: 4,
              fontSize: 8,
              lineColor: [220, 220, 230],
              textColor: [50, 50, 50]
            },
            headStyles: {
              fillColor: brandColor,
              textColor: [255, 255, 255],
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
              7: { halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: {
              fillColor: [245, 245, 250]
            },
            didDrawCell: (data) => {
              // Destacar células de valor líquido
              if (data.column.index === 7 && data.section === 'body') {
                const value = parseFloat(propertyReservations[data.row.index][7].replace(/[^\d.-]/g, ''));
                doc.setTextColor(
                  value >= 0 ? highlightColor[0] : warningColor[0],
                  value >= 0 ? highlightColor[1] : warningColor[1],
                  value >= 0 ? highlightColor[2] : warningColor[2]
                );
              }
            },
            margin: { left: margin, right: margin }
          });
          
          // Atualizar posição Y
          const tableEnd = (doc as any).lastAutoTable || { finalY: currentY + 50 };
          currentY = tableEnd.finalY + 15;
        }
        
        finalY = currentY;
      });
      
      return finalY;
    }
  };
  
  // Lista de frases inspiradoras para o rodapé (serão escolhidas aleatoriamente)
  const inspirationalQuotes = [
    "O sucesso nos negócios requer treinamento, disciplina e trabalho duro.",
    "Fazer o que amas é o caminho para o sucesso.",
    "Cada detalhe importa. É com os detalhes que se constrói a excelência.",
    "A verdadeira hospitalidade é receber com o coração aberto.",
    "Transformando casas em experiências inesquecíveis.",
    "O verdadeiro luxo está no cuidado com os detalhes.",
    "Qualidade não é um ato, é um hábito.",
    "Grandes resultados vêm de pequenas ações consistentes.",
    "O que fazemos com paixão, fazemos com excelência.",
    "O sucesso é a soma de pequenos esforços repetidos dia após dia."
  ];
  
  // Selecionar uma frase aleatória 
  const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
  
  // Função para adicionar rodapé moderno em cada página
  // ===============================================
  const addFooter = (doc: jsPDF) => {
    // Acessar propriedades internas
    const internal = doc.internal as unknown as JsPDFInternal;
    const pageCount = internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = internal.pageSize.height;
      const pageWidth = internal.pageSize.width;
      
      // Adicionar frase inspiradora na última página
      if (i === pageCount) {
        // Linha divisória para a frase inspiradora
        doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
        
        // Frase inspiradora
        doc.setFontSize(9);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.setFont('helvetica', 'italic');
        doc.text(`"${randomQuote}"`, pageWidth / 2, pageHeight - 27, { align: 'center' });
        
        // Logo simplificado (círculo com MF)
        const logoSize = 8;
        const logoX = pageWidth / 2 - logoSize / 2;
        const logoY = pageHeight - 22;
        
        // Círculo exterior
        doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.setFillColor(255, 255, 255);
        doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'FD');
        
        // Texto do logo "MF"
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.text('MF', logoX + logoSize / 2, logoY + logoSize / 2 + 2, { align: 'center' });
      }
      
      // Linha divisória sutil para todas as páginas
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
      
      // Informações do rodapé com marca d'água
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      
      // Informações à esquerda
      doc.text(`${t.confidential} | ${t.poweredBy}`, margin, pageHeight - 8);
      
      // Números de página à direita
      doc.text(`${t.page} ${i} ${t.to} ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  };
  
  // Renderizar cada seção de acordo com o tipo de relatório
  // ===============================================
  
  // Destaques financeiros (sempre mostrar)
  yPos = renderFinancialHighlights(doc, yPos);
  
  // Adicionar seções conforme o tipo de relatório solicitado
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
  
  // Adicionar rodapé em todas as páginas
  addFooter(doc);
  
  // Salvar o PDF com nome formatado
  const fileName = `maria_faz_report_${report.ownerName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
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
  // Selecionar idioma usando as mesmas traduções da função de download
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
      
      // Novos elementos adicionados
      financialHighlights: 'Destaques Financeiros',
      profitMargin: 'Margem de Lucro',
      currency: '€',
      performanceInsights: 'Insights de Performance',
      comparedTo: 'comparado ao período anterior',
      propertySummary: 'Sumário de Propriedades',
      totalOccupiedDays: 'Total de Dias Ocupados',
      noReservations: 'Sem reservas no período selecionado',
      periodContext: 'Contexto do Período',
      totalDays: 'Total de dias',
      estimatedWeekends: 'Fins de semana estimados',
      highestOccupancy: 'Maior taxa de ocupação',
      mostBookedProperty: 'Propriedade mais reservada',
      reservationsExplanation: 'Listagem detalhada de todas as reservas no período selecionado',
      poweredBy: 'Powered by Maria Faz',
      confidential: 'Documento Confidencial',
      preparationTime: 'Tempo de preparação',
      emailVersion: 'Versão para E-mail',
    }
  };

  // Usar a tradução adequada
  const t = translations[language as keyof typeof translations] || translations['pt-PT'];
  
  // Configuração do PDF - Formato A4 em retrato (mesma configuração do download)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Esquema de cores moderno (mesmo do download)
  const brandColor = [64, 81, 181]; // Azul indigo
  const accentColor = [233, 30, 99]; // Rosa
  const textColor = [33, 33, 33]; // Quase preto
  const secondaryTextColor = [117, 117, 117]; // Cinza médio
  const lightGray = [224, 224, 224]; // Cinza claro para bordas e fundos alternados
  const highlightColor = [139, 195, 74]; // Verde para valores positivos
  const warningColor = [255, 152, 0]; // Laranja para alertas
  
  // Medidas e margens
  const margin = 14; // Margem padrão em mm
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - (margin * 2);
  const maxX = pageWidth - margin;
  
  // Definição de posição inicial
  let yPos = margin;
  
  // Adicionar cabeçalho com design moderno
  // ===============================================
  
  // Retângulo colorido superior - faixa de identidade visual
  doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.rect(0, 0, pageWidth, 15, 'F');
  
  // Logo ou nome da empresa (watermark sutil)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('MARIA FAZ', pageWidth - 15, 10, { align: 'right' });
  
  // Título do documento
  yPos = 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(t.ownerReport.toUpperCase(), margin, yPos, { align: 'left' });
  
  // Linha horizontal decorativa
  yPos += 3;
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + 60, yPos);
  
  // Informações principais
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`${t.ownerName}:`, margin, yPos);
  
  // Nome do proprietário com destaque
  doc.setFont('helvetica', 'bold');
  doc.text(` ${report.ownerName}`, margin + 25, yPos);
  
  // Período do relatório
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`${t.period}:`, margin, yPos);
  
  // Período formatado com estilo
  const periodStr = `${formatDate(report.startDate)} ${t.to} ${formatDate(report.endDate)}`;
  doc.setFont('helvetica', 'bold');
  doc.text(` ${periodStr}`, margin + 25, yPos);
  
  // Data de geração com estilo mais discreto
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
  doc.text(`${t.generatedOn}: ${formatDate(new Date().toISOString())}`, margin, yPos);
  doc.text(`${t.emailVersion}`, maxX - 30, yPos, { align: 'right' });
  
  // Linha divisória completa
  yPos += 8;
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, maxX, yPos);
  
  // Seção de destaques financeiros - Cards visuais
  // ===============================================
  yPos += 10;
  
  // Título da seção com ícone (simulado com caractere)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`✦ ${t.financialHighlights}`, margin, yPos);
  yPos += 15;
  
  // Calcular a margem de lucro
  const profitMargin = report.totals.totalNetProfit / report.totals.totalRevenue * 100;
  
  // Layout com três cards destacados em linha
  const cardWidth = contentWidth / 3 - 5;
  const cardHeight = 35;
  
  // Função para criar card de métrica
  const renderMetricCard = (x: number, y: number, width: number, height: number, 
                            title: string, value: string, subtitle: string = '', 
                            color: number[] = brandColor) => {
    // Sombra sutil (simulada com retângulo cinza deslocado)
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x + 1, y + 1, width, height, 2, 2, 'F');
    
    // Card com borda arredondada
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');
    
    // Título do card
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text(title, x + 5, y + 7);
    
    // Valor principal com destaque
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, x + 5, y + 20);
    
    // Subtítulo opcional
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
      doc.text(subtitle, x + 5, y + 28);
    }
  };
  
  // Card 1: Receita Total
  renderMetricCard(
    margin, 
    yPos, 
    cardWidth, 
    cardHeight, 
    t.totalRevenue, 
    formatCurrency(report.totals.totalRevenue),
    `${report.totals.totalReservations} ${t.totalReservations.toLowerCase()}`
  );
  
  // Card 2: Lucro Líquido (verde se positivo, laranja se negativo)
  const profitColor = report.totals.totalNetProfit >= 0 ? highlightColor : warningColor;
  renderMetricCard(
    margin + cardWidth + 5, 
    yPos, 
    cardWidth, 
    cardHeight, 
    t.totalNetProfit, 
    formatCurrency(report.totals.totalNetProfit),
    `${t.profitMargin}: ${profitMargin.toFixed(1)}%`,
    profitColor
  );
  
  // Card 3: Taxa de Ocupação
  renderMetricCard(
    margin + (cardWidth + 5) * 2, 
    yPos, 
    cardWidth, 
    cardHeight, 
    t.averageOccupancy, 
    `${report.totals.averageOccupancy.toFixed(1)}%`,
    `${report.totals.totalProperties} ${t.totalProperties.toLowerCase()}`
  );
  
  yPos += cardHeight + 15;
  
  // Resumo Financeiro em Tabela Moderna
  // ===============================================
  
  // Título da seção
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`${t.summaryTitle}`, margin, yPos);
  yPos += 10;
  
  // Tabela de resumo com design moderno
  // Removemos a entrada de totalTeamPayments porque é igual aos custos de limpeza
  const summaryData = [
    [t.totalRevenue, formatCurrency(report.totals.totalRevenue)],
    [t.totalCleaningCosts, formatCurrency(report.totals.totalCleaningCosts)],
    [t.totalCheckInFees, formatCurrency(report.totals.totalCheckInFees)],
    [t.totalCommission, formatCurrency(report.totals.totalCommission)],
    [t.totalNetProfit, formatCurrency(report.totals.totalNetProfit)],
    [t.averageOccupancy, `${report.totals.averageOccupancy.toFixed(1)}%`],
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
      cellWidth: 'auto',
      valign: 'middle',
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 80,
        fillColor: [250, 250, 250]
      },
      1: { 
        halign: 'right', 
        cellWidth: 50,
        fontStyle: 'bold'
      }
    },
    didDrawCell: (data) => {
      // Destacar a célula de lucro líquido
      if (data.row.index === 4 && data.column.index === 1) {
        // Índice 4 corresponde ao lucro líquido
        doc.setTextColor(
          report.totals.totalNetProfit >= 0 ? highlightColor[0] : warningColor[0],
          report.totals.totalNetProfit >= 0 ? highlightColor[1] : warningColor[1],
          report.totals.totalNetProfit >= 0 ? highlightColor[2] : warningColor[2]
        );
      } else {
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      }
    },
    margin: { left: margin, right: margin }
  });
  
  // Atualizar posição Y após a tabela
  const tableEnd = (doc as any).lastAutoTable || { finalY: yPos + 50 };
  yPos = tableEnd.finalY + 15;
  
  // Detalhes das Propriedades (versão simplificada para email)
  // ===============================================
  
  // Título da seção
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(t.propertiesTitle, margin, yPos);
  yPos += 10;
  
  // Preparar dados para tabela
  const propertiesData = report.propertyReports.map((property: PropertyReportItem) => [
    property.propertyName,
    formatCurrency(property.revenue),
    formatCurrency(property.netProfit),
    `${property.occupancyRate.toFixed(1)}%`
  ]);
  
  // Cabeçalhos simplificados
  const propertiesHeaders = [
    [
      t.propertyName,
      t.revenue,
      t.netProfit,
      t.occupancyRate
    ]
  ];
  
  // Tabela de propriedades simplificada para email
  autoTable(doc, {
    head: propertiesHeaders,
    body: propertiesData,
    startY: yPos,
    theme: 'grid',
    styles: {
      cellPadding: 5,
      fontSize: 9,
      lineColor: [220, 220, 230],
      textColor: [50, 50, 50],
      valign: 'middle'
    },
    headStyles: {
      fillColor: brandColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250]
    },
    didDrawCell: (data) => {
      // Destacar células de lucro líquido
      if (data.column.index === 2 && data.row.index >= 0 && data.section === 'body') {
        const property = report.propertyReports[data.row.index];
        if (property) {
          doc.setTextColor(
            property.netProfit >= 0 ? highlightColor[0] : warningColor[0],
            property.netProfit >= 0 ? highlightColor[1] : warningColor[1],
            property.netProfit >= 0 ? highlightColor[2] : warningColor[2]
          );
        }
      }
    },
    margin: { left: margin, right: margin }
  });
  
  // Rodapé moderno
  // ===============================================
  
  // Função para adicionar rodapé
  const addFooter = (doc: jsPDF) => {
    // Acessar propriedades internas
    const internal = doc.internal as unknown as JsPDFInternal;
    const pageCount = internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = internal.pageSize.height;
      const pageWidth = internal.pageSize.width;
      
      // Linha divisória sutil
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
      
      // Informações do rodapé com marca d'água
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      
      // Informações à esquerda
      doc.text(`${t.confidential} | ${t.poweredBy}`, margin, pageHeight - 8);
      
      // Números de página à direita
      doc.text(`${t.page} ${i} ${t.to} ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  };
  
  // Adicionar rodapé
  addFooter(doc);
  
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
  
  // Removemos "Pagamentos às Equipas" porque é o mesmo que "Custos de Limpeza"
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