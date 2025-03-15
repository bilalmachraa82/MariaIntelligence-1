import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from "./utils";
import { OwnerReport, PropertyReportItem, ReservationSummary } from "@/hooks/use-owner-report";

// Necessário para TypeScript reconhecer os tipos estendidos do jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
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
    
    yPos = doc.lastAutoTable.finalY + 10;
    
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
          0: { cellWidth: 35 },
          1: { cellWidth: 18 },
          2: { cellWidth: 18 },
          3: { cellWidth: 25 },
          4: { cellWidth: 18 },
          5: { halign: 'right', cellWidth: 20 },
          6: { halign: 'right', cellWidth: 20 },
          7: { halign: 'right', cellWidth: 20 },
          8: { halign: 'right', cellWidth: 20 }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 14 }
      });
      
      return doc.lastAutoTable.finalY + 10;
    } else {
      // Para relatórios com poucas propriedades, mostrar cada propriedade separadamente
      // com detalhes adicionais e melhor formatação
      let currentY = yPos;
      
      // Percorrer cada propriedade e mostrar suas reservas
      for (const property of report.propertyReports) {
        // Verificar se precisamos adicionar uma nova página
        const internal = doc.internal as unknown as JsPDFInternal;
        if (currentY > internal.pageSize.height - 60) {
          doc.addPage();
          currentY = 20;
        }
        
        // Título da propriedade
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`${property.propertyName} (${property.reservations.length} ${t.reservations || "reservas"})`, 14, currentY);
        currentY += 8;
        
        // Estatísticas da propriedade
        doc.setFontSize(9);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(`${t.occupancyRate || "Taxa de Ocupação"}: ${property.occupancyRate.toFixed(1)}% | ${t.revenue || "Receita"}: ${formatCurrency(property.revenue)} | ${t.netProfit || "Lucro"}: ${formatCurrency(property.netProfit)}`, 14, currentY);
        currentY += 10;
        
        // Se não houver reservas, mostrar mensagem
        if (property.reservations.length === 0) {
          doc.setFontSize(9);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(t.noReservations || "Sem reservas no período selecionado", 14, currentY);
          currentY += 10;
          continue;
        }
        
        // Preparar dados para tabela de reservas desta propriedade
        const propertyReservations = property.reservations.map(r => [
          formatDate(r.checkInDate),
          formatDate(r.checkOutDate),
          r.guestName,
          r.platform,
          formatCurrency(r.totalAmount),
          formatCurrency(r.cleaningFee),
          formatCurrency(r.checkInFee),
          formatCurrency(r.commission),
          formatCurrency(r.teamPayment),
          formatCurrency(r.netAmount)
        ]);
        
        // Cabeçalhos da tabela de reservas
        const propertyReservationsHeaders = [
          [
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
          ]
        ];
        
        // Renderizar tabela de reservas desta propriedade
        doc.autoTable({
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
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: 14 }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;
      }
      
      return currentY;
    }
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
 * Gera insights inteligentes para o relatório usando o contexto de RAG/IA
 * Esses insights são úteis para adicionar informações contextuais ao relatório
 * 
 * @param report Dados do relatório de proprietário
 * @returns Objeto com insights gerados pela IA
 */
export async function generateReportInsights(report: OwnerReport): Promise<{
  summaryInsight: string;
  trendAnalysis: string;
  recommendations: string[];
  keyMetrics: {label: string; value: string}[];
}> {
  try {
    // Tentar obter insights do servidor se houver conexão com Mistral AI
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Analise os seguintes dados de relatório e forneça insights sobre o desempenho: 
          Proprietário: ${report.ownerName}, 
          Período: ${formatDate(report.startDate)} a ${formatDate(report.endDate)}, 
          Receita Total: ${formatCurrency(report.totals.totalRevenue)}, 
          Lucro Líquido: ${formatCurrency(report.totals.totalNetProfit)}, 
          Taxa de Ocupação: ${report.totals.averageOccupancy.toFixed(1)}%,
          Total de Propriedades: ${report.totals.totalProperties},
          Total de Reservas: ${report.totals.totalReservations}`,
        context: {
          type: 'report',
          reportData: report
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // Processar resposta do assistente Maria
      return {
        summaryInsight: data.content || "Análise não disponível no momento.",
        trendAnalysis: "Tendência de alta ocupação em fins de semana e feriados.",
        recommendations: [
          "Aumente os preços em períodos de alta demanda",
          "Considere descontos para estadias mais longas",
          "Otimize custos de limpeza agendando consecutivamente"
        ],
        keyMetrics: [
          { label: "Taxa de Ocupação", value: `${report.totals.averageOccupancy.toFixed(1)}%` },
          { label: "Margem de Lucro", value: `${((report.totals.totalNetProfit / report.totals.totalRevenue) * 100).toFixed(1)}%` },
          { label: "Receita/Propriedade", value: formatCurrency(report.totals.totalRevenue / report.totals.totalProperties) }
        ]
      };
    } else {
      // Caso falhe, retornar insights padrão baseados apenas nos cálculos locais
      return getLocalInsights(report);
    }
  } catch (error) {
    console.error("Erro ao gerar insights com IA:", error);
    // Gerar insights localmente como fallback
    return getLocalInsights(report);
  }
}

/**
 * Gera insights localmente baseados apenas nos dados do relatório
 * Usado como fallback quando não há conexão com o servidor Mistral AI
 */
function getLocalInsights(report: OwnerReport) {
  const occupancyRate = report.totals.averageOccupancy;
  const profitMargin = (report.totals.totalNetProfit / report.totals.totalRevenue) * 100;
  
  // Encontrar propriedade com melhor desempenho
  const bestProperty = report.propertyReports.reduce((prev, current) => 
    (prev.netProfit > current.netProfit) ? prev : current
  );
  
  // Gerar insights baseados nos dados disponíveis
  return {
    summaryInsight: `No período analisado, a taxa média de ocupação foi de ${occupancyRate.toFixed(1)}% com uma margem de lucro de ${profitMargin.toFixed(1)}%. A propriedade com melhor desempenho foi "${bestProperty.propertyName}" com lucro líquido de ${formatCurrency(bestProperty.netProfit)}.`,
    trendAnalysis: "Análise de tendências requer integração com serviço de IA.",
    recommendations: [
      "Considere otimizar custos para propriedades com baixa margem de lucro",
      "Aumente disponibilidade em períodos de alta demanda",
      "Revise propriedades com baixa taxa de ocupação"
    ],
    keyMetrics: [
      { label: "Taxa de Ocupação", value: `${occupancyRate.toFixed(1)}%` },
      { label: "Margem de Lucro", value: `${profitMargin.toFixed(1)}%` },
      { label: "Melhor Propriedade", value: bestProperty.propertyName }
    ]
  };
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