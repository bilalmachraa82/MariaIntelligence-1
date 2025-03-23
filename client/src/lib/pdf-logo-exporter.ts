import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from "./utils";
import { OwnerReport, PropertyReportItem, ReservationSummary } from "@/hooks/use-owner-report";
import { renderLogoHeader, renderLogoFooter } from './pdf-logo-utils';
import { addMariaFazHeader, addMariaFazFooter } from '@/pages/reports/owner-report/generate-pdf-header';

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
 * Exporta relatório do proprietário em formato PDF com design ultra moderno e logo oficial
 * @param report Dados do relatório
 * @param reportType Tipo de relatório (summary, properties, reservations ou full)
 * @param language Código do idioma
 */
export function exportOwnerReportPDFWithLogo(
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
      // Documento simplificado para inglês (outras traduções mantidas)
      reportTitle: 'Financial Report',
      generatedOn: 'Generated on',
      page: 'Page',
      ownerReport: 'Owner Report',
      // etc...
      poweredBy: 'Powered by Maria Faz',
      confidential: 'Confidential Document',
      preparationTime: 'Preparation time',
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
  
  // Adicionar cabeçalho com design moderno e logo oficial
  // ===============================================
  
  // Usar o utilitário de cabeçalho padronizado com o logo oficial da Maria Faz
  addMariaFazHeader(doc, pageWidth, brandColor);
  
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
    
    // Título da métrica
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
    doc.text(title, x + 5, y + 7);
    
    // Valor principal com destaque e colorido de acordo com o tipo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, x + 5, y + 18);
    
    // Subtítulo opcional (percentual de crescimento ou contexto)
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(secondaryTextColor[0], secondaryTextColor[1], secondaryTextColor[2]);
      doc.text(subtitle, x + 5, y + 26);
    }
  };
  
  // Renderizar cards de métricas na linha
  renderMetricCard(
    margin, 
    yPos, 
    cardWidth, 
    cardHeight, 
    t.totalRevenue, 
    formatCurrency(report.totals.totalRevenue)
  );
  
  renderMetricCard(
    margin + cardWidth + 5, 
    yPos, 
    cardWidth, 
    cardHeight, 
    t.totalNetProfit, 
    formatCurrency(report.totals.totalNetProfit),
    '',
    highlightColor
  );
  
  renderMetricCard(
    margin + (cardWidth + 5) * 2, 
    yPos, 
    cardWidth, 
    cardHeight, 
    t.profitMargin, 
    `${profitMargin.toFixed(1)}%`,
    '',
    profitMargin > 40 ? highlightColor : (profitMargin > 20 ? brandColor : warningColor)
  );
  
  yPos += cardHeight + 10;
  
  // Resumo financeiro - Tabela principal
  // ===============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`✦ ${t.summaryTitle}`, margin, yPos);
  yPos += 10;
  
  // Tabela de resumo financeiro
  autoTable(doc, {
    startY: yPos,
    head: [[t.summaryTitle, '']],
    body: [
      [t.totalRevenue, formatCurrency(report.totals.totalRevenue)],
      [t.totalCleaningCosts, formatCurrency(report.totals.totalCleaningCosts)],
      [t.totalCheckInFees, formatCurrency(report.totals.totalCheckInFees)],
      [t.totalCommission, formatCurrency(report.totals.totalCommission)],
      [t.totalNetProfit, formatCurrency(report.totals.totalNetProfit)],
      [t.averageOccupancy, `${report.totals.averageOccupancy.toFixed(1)}%`],
      [t.totalProperties, report.totals.totalProperties.toString()],
      [t.totalReservations, report.totals.totalReservations.toString()],
    ],
    headStyles: {
      fillColor: [brandColor[0], brandColor[1], brandColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { fontStyle: 'normal', fillColor: [255, 255, 255], cellWidth: 120 },
      1: { fontStyle: 'bold', fillColor: [255, 255, 255], halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    tableLineColor: [224, 224, 224],
    tableLineWidth: 0.5,
    margin: { left: margin, right: margin },
  });
  
  yPos = getTableEndPosition(doc, yPos) + 15;
  
  // Adicionar rodapé para cada página
  // ===============================================
  const internal = doc.internal as unknown as JsPDFInternal;
  const pageCount = internal.getNumberOfPages();
  
  // Adicionar rodapé a cada página
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Adicionar rodapé padronizado com logo
    addMariaFazFooter(doc, pageWidth, (doc.internal as any).pageSize.height, 
                      t.confidential, i, pageCount, t.poweredBy);
  }
  
  // Nome do arquivo
  const fileName = `relatorio_${report.ownerName.replace(/[^a-zA-Z0-9]/g, '_')}_${
    formatDate(report.startDate).replace(/\//g, '-')}_${
    formatDate(report.endDate).replace(/\//g, '-')}.pdf`;
  
  // Gerar e fazer download do PDF
  doc.save(fileName);
}