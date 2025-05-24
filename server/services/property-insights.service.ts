import { GeminiService } from './gemini.service.js';

const geminiService = new GeminiService();

interface PropertyData {
  name: string;
  totalRevenue: number;
  reservations: number;
  occupancyRate: number;
  averageRate: number;
  seasonality: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
}

interface OwnerReportData {
  ownerName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  properties: PropertyData[];
  period: {
    startDate: string;
    endDate: string;
  };
  reservations: any[];
}

export class PropertyInsightsService {
  /**
   * Gera insights inteligentes para proprietários usando IA
   */
  async generateOwnerInsights(reportData: OwnerReportData): Promise<{
    executiveSummary: string;
    performanceAnalysis: string;
    marketInsights: string;
    recommendations: string[];
    strategicActions: string[];
    riskAssessment: string;
    futureOpportunities: string;
    visualizationSuggestions: string[];
  }> {
    const prompt = this.buildInsightsPrompt(reportData);
    
    try {
      const response = await geminiService.generateText(prompt);
      return this.parseInsightsResponse(response);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return this.getFallbackInsights(reportData);
    }
  }

  private buildInsightsPrompt(data: OwnerReportData): string {
    const hasRevenue = data.totalRevenue > 0;
    const hasReservations = data.reservations.length > 0;
    const profitMargin = hasRevenue ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1) : '0';
    const avgRevenuePerProperty = data.properties.length > 0 ? (data.totalRevenue / data.properties.length).toFixed(0) : '0';
    
    return `
És um consultor especializado em alojamento local em Portugal. Analisa os dados REAIS de ${data.ownerName} para o período ${data.period.startDate} a ${data.period.endDate}.

=== SITUAÇÃO FINANCEIRA REAL ===
- Receita Total: €${data.totalRevenue.toFixed(2)}
- Despesas Totais: €${data.totalExpenses.toFixed(2)}
- Lucro Líquido: €${data.netProfit.toFixed(2)}
- Margem de Lucro: ${profitMargin}%
- Total de Reservas: ${data.reservations.length}

=== PROPRIEDADES DE ${data.ownerName.toUpperCase()} ===
${data.properties.map(prop => `
• ${prop.name}: €${prop.totalRevenue.toFixed(2)} receita, ${prop.reservations} reservas, ${prop.occupancyRate}% ocupação
`).join('')}

${hasReservations ? 
`=== RESERVAS NO PERÍODO ===
${data.reservations.map(r => `• ${r.guestName}: €${r.totalAmount} (${r.checkInDate} → ${r.checkOutDate})`).join('\n')}` 
: 
`=== ALERTA: SEM RESERVAS NO PERÍODO ===
• Período analisado: ${data.period.startDate} a ${data.period.endDate}
• Receita: €0,00
• Situação requer AÇÃO IMEDIATA para reactivar propriedades`}

CONTEXTO PORTUGAL: Mercado de alojamento local, sazonalidade, concorrência regional.

${hasReservations ? 'FOCA nos dados reais para recomendações específicas.' : 'PRIORIDADE: Estratégias para reactivar propriedades SEM RESERVAS.'}

RESPOSTA OBRIGATÓRIA EM JSON VÁLIDO:

{
  "executiveSummary": "Resumo executivo em 2-3 frases sobre o desempenho geral",
  "performanceAnalysis": "Análise detalhada do desempenho financeiro e operacional (150-200 palavras)",
  "marketInsights": "Insights sobre tendências de mercado e posicionamento competitivo (100-150 palavras)",
  "recommendations": [
    "Recomendação específica 1",
    "Recomendação específica 2",
    "Recomendação específica 3",
    "Recomendação específica 4",
    "Recomendação específica 5"
  ],
  "strategicActions": [
    "Ação estratégica 1 com prazo",
    "Ação estratégica 2 com prazo",
    "Ação estratégica 3 com prazo"
  ],
  "riskAssessment": "Avaliação de riscos e pontos de atenção (100 palavras)",
  "futureOpportunities": "Oportunidades de crescimento e expansão (100-150 palavras)",
  "visualizationSuggestions": [
    "Sugestão de métrica para acompanhar 1",
    "Sugestão de métrica para acompanhar 2",
    "Sugestão de métrica para acompanhar 3"
  ]
}

DIRETRIZES:
- Usa linguagem profissional mas acessível
- Inclui números específicos e percentagens
- Foca em ações práticas e implementáveis
- Considera sazonalidade do alojamento local
- Menciona benchmarks da indústria quando relevante
- Sugere métricas KPI importantes para acompanhar
- Identifica oportunidades de otimização de preços
- Avalia diversificação de portfólio
`;
  }

  private parseInsightsResponse(response: string): any {
    try {
      // Remove qualquer texto antes ou depois do JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('JSON não encontrado na resposta');
    } catch (error) {
      console.error('Erro ao fazer parse da resposta:', error);
      return this.getFallbackInsights(null);
    }
  }

  private getFallbackInsights(data: OwnerReportData | null): any {
    if (!data) {
      return {
        executiveSummary: "Dados insuficientes para análise.",
        performanceAnalysis: "Análise requer dados válidos.",
        marketInsights: "Sem dados disponíveis.",
        recommendations: ["Verificar dados do sistema"],
        strategicActions: ["Validar informações"],
        riskAssessment: "Impossível avaliar sem dados.",
        futureOpportunidades: "Dependem de dados válidos.",
        visualizationSuggestions: ["Corrigir fonte de dados"]
      };
    }

    // ANÁLISE DINÂMICA BASEADA NOS DADOS REAIS
    const hasReservations = data.reservations.length > 0;
    const totalRevenue = data.totalRevenue;
    const totalReservations = data.reservations.length;
    const avgRevenue = hasReservations ? (totalRevenue / totalReservations) : 0;
    const propertyNames = data.properties.map(p => p.name).join(', ');
    const profitMargin = totalRevenue > 0 ? ((data.netProfit / totalRevenue) * 100) : 0;

    return {
      executiveSummary: hasReservations 
        ? `${data.ownerName} registou €${totalRevenue.toFixed(2)} com ${totalReservations} reserva(s) em ${propertyNames}. Receita média: €${avgRevenue.toFixed(2)} por reserva. ${totalReservations === 1 ? 'Actividade muito baixa requer acção imediata.' : 'Performance limitada com margem para crescimento.'}`
        : `${data.ownerName}: Zero reservas em ${propertyNames} durante o período ${data.period.startDate} - ${data.period.endDate}. Situação crítica exige intervenção urgente.`,

      performanceAnalysis: hasReservations
        ? `Performance actual: €${totalRevenue.toFixed(2)} receita, €${data.netProfit.toFixed(2)} lucro (${profitMargin.toFixed(1)}% margem). ${totalReservations === 1 ? 'Apenas 1 reserva indica sérios problemas de ocupação' : `${totalReservations} reservas mostram actividade limitada`}. Propriedade(s) ${propertyNames} ${avgRevenue < 80 ? 'com preços potencialmente baixos' : avgRevenue > 150 ? 'com preços elevados que podem estar a limitar procura' : 'com preços na média de mercado'}.`
        : `Análise crítica: 0% ocupação em ${propertyNames}. Possíveis causas: (1) Anúncios suspensos/invisíveis, (2) Preços desalinhados com mercado, (3) Problemas de qualidade, (4) Calendário bloqueado, (5) Concorrência muito forte.`,

      marketInsights: hasReservations
        ? `Contexto mercado AL português (${data.period.startDate}-${data.period.endDate}): Actividade de ${data.ownerName} está ${totalReservations === 1 ? 'muito abaixo' : 'abaixo'} da média esperada. ${propertyNames} precisa de reposicionamento competitivo.`
        : `Mercado AL: Outras propriedades na região mantêm ocupação. ${data.ownerName} perdeu competitividade em ${propertyNames}. Urgente análise da concorrência local.`,

      recommendations: hasReservations ? [
        totalReservations === 1 ? `Campanha promocional urgente para ${propertyNames}` : `Intensificar marketing digital para ${propertyNames}`,
        avgRevenue < 80 ? `Aumentar preços gradualmente - actual €${avgRevenue.toFixed(2)} está baixo` : avgRevenue > 150 ? `Reduzir preços - actual €${avgRevenue.toFixed(2)} pode estar a afastar hóspedes` : "Manter preços actuais e focar na ocupação",
        "Actualizar fotografias profissionais de todas as propriedades",
        `Analisar calendário de ${propertyNames} - pode estar bloqueado`,
        "Contactar hóspede actual para feedback e avaliação"
      ] : [
        `URGENTE: Verificar se ${propertyNames} estão visíveis nas plataformas`,
        "Reduzir preços temporariamente para gerar primeiras reservas",
        "Implementar desconto de 'reabertura' de 20-30%",
        "Verificar se calendários não estão bloqueados",
        "Contactar suporte Airbnb/Booking para verificar visibilidade"
      ],

      strategicActions: hasReservations ? [
        totalReservations === 1 ? "Duplicar ocupação nos próximos 30 dias" : "Aumentar ocupação em 50% nos próximos 45 dias",
        `Optimizar gestão de ${propertyNames} - próximos 15 dias`,
        "Implementar sistema de follow-up com hóspedes"
      ] : [
        "ACÇÃO IMEDIATA: Reactivar todas as propriedades em 24h",
        "Ajustar preços e relançar anúncios em 48h",
        "Obter primeira reserva nos próximos 7 dias"
      ],

      riskAssessment: hasReservations
        ? `Risco ALTO: Com apenas ${totalReservations} reserva(s) e €${totalRevenue.toFixed(2)}, ${data.ownerName} está em risco de perder viabilidade financeira. Dependência excessiva de poucos hóspedes.`
        : `RISCO CRÍTICO: Zero actividade em ${propertyNames}. Sem intervenção imediata, pode perder posição no mercado e relevância nas plataformas de reserva.`,

      futureOpportunidades: hasReservations
        ? `Potencial identificado: Se conseguir 4-5 reservas/mês como a actual (€${avgRevenue.toFixed(2)}), pode gerar €${(avgRevenue * 5).toFixed(2)}/mês. Focar em optimização de ${propertyNames}.`
        : `Oportunidade de recomeço: Mercado AL mantém procura. ${data.ownerName} pode reposicionar ${propertyNames} com estratégia renovada e preços competitivos.`,

      visualizationSuggestions: [
        `Comparação mensal: ${propertyNames} vs. concorrência local`,
        hasReservations ? "Evolução de preços vs. ocupação" : "Análise de preços de propriedades similares na zona",
        "Timeline de reservas e períodos vazios"
      ]
    };
  }

  /**
   * Gera insights comparativos entre propriedades
   */
  async generatePropertyComparison(properties: PropertyData[]): Promise<{
    topPerformer: string;
    improvementNeeded: string;
    recommendations: string[];
  }> {
    if (properties.length === 0) {
      return {
        topPerformer: "Nenhuma propriedade encontrada",
        improvementNeeded: "Dados insuficientes",
        recommendations: ["Adicionar propriedades ao portfolio"]
      };
    }

    const sortedByRevenue = properties.sort((a, b) => b.totalRevenue - a.totalRevenue);
    const topPerformer = sortedByRevenue[0];
    const worstPerformer = sortedByRevenue[sortedByRevenue.length - 1];

    return {
      topPerformer: `${topPerformer.name} lidera com €${topPerformer.totalRevenue} de receita`,
      improvementNeeded: `${worstPerformer.name} tem potencial de melhoria com €${worstPerformer.totalRevenue}`,
      recommendations: [
        `Aplicar estratégias de ${topPerformer.name} em outras propriedades`,
        `Aumentar investimento em marketing para ${worstPerformer.name}`,
        "Analisar fatores de diferenciação entre propriedades"
      ]
    };
  }

  /**
   * Calcula métricas avançadas para insights
   */
  calculateAdvancedMetrics(data: OwnerReportData) {
    const metrics = {
      revpar: 0, // Revenue per Available Room
      adr: 0,    // Average Daily Rate
      seasonalityIndex: 0,
      profitabilityScore: 0,
      growthPotential: 0
    };

    if (data.reservations.length > 0) {
      const totalNights = data.reservations.reduce((sum, res) => {
        const checkIn = new Date(res.checkInDate);
        const checkOut = new Date(res.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }, 0);

      metrics.adr = totalNights > 0 ? data.totalRevenue / totalNights : 0;
      metrics.profitabilityScore = data.totalRevenue > 0 ? (data.netProfit / data.totalRevenue) * 100 : 0;
    }

    return metrics;
  }
}

export const propertyInsightsService = new PropertyInsightsService();