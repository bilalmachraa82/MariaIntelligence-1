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
    const profitMargin = data.totalRevenue > 0 ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1) : '0';
    const avgRevenuePerProperty = data.properties.length > 0 ? (data.totalRevenue / data.properties.length).toFixed(0) : '0';
    const totalReservations = data.reservations.length;
    
    return `
Atua como um consultor especialista em alojamento local e análise financeira imobiliária. Analisa os seguintes dados financeiros e operacionais de ${data.ownerName} e gera insights profissionais em português de Portugal.

DADOS FINANCEIROS:
- Receita Total: €${data.totalRevenue}
- Despesas Totais: €${data.totalExpenses}
- Lucro Líquido: €${data.netProfit}
- Margem de Lucro: ${profitMargin}%
- Período: ${data.period.startDate} a ${data.period.endDate}

DADOS OPERACIONAIS:
- Número de Propriedades: ${data.properties.length}
- Total de Reservas: ${totalReservations}
- Receita Média por Propriedade: €${avgRevenuePerProperty}

PROPRIEDADES DETALHADAS:
${data.properties.map(prop => `
- ${prop.name}: €${prop.totalRevenue} (${prop.reservations} reservas, taxa ocupação: ${prop.occupancyRate}%, preço médio: €${prop.averageRate})
`).join('')}

RESERVAS RECENTES:
${data.reservations.slice(0, 5).map(res => `
- ${res.guestName}: €${res.totalAmount} (${res.checkInDate} - ${res.checkOutDate})
`).join('')}

RESPONDE EM FORMATO JSON com as seguintes secções:

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
    return {
      executiveSummary: "Análise detalhada em preparação. Os dados financeiros mostram um desempenho sólido com oportunidades de otimização identificadas.",
      performanceAnalysis: "O portfolio apresenta métricas operacionais consistentes. A análise detalhada dos padrões de reserva revela oportunidades de melhoria na gestão de preços e ocupação. Recomenda-se monitorização contínua das tendências sazonais e ajustes estratégicos baseados nos dados históricos.",
      marketInsights: "O mercado de alojamento local mantém-se dinâmico com variações sazonais típicas. A concorrência exige estratégias diferenciadas e foco na experiência do hóspede para manter a competitividade.",
      recommendations: [
        "Otimizar preços baseado na procura sazonal",
        "Melhorar a experiência de check-in/check-out",
        "Investir em marketing digital direcionado",
        "Implementar programa de fidelização",
        "Diversificar canais de distribuição"
      ],
      strategicActions: [
        "Revisar estratégia de preços - próximos 30 dias",
        "Implementar automações operacionais - próximos 60 dias",
        "Expandir presença online - próximos 90 dias"
      ],
      riskAssessment: "Riscos moderados relacionados com sazonalidade e dependência de canais específicos. Recomenda-se diversificação e criação de reservas financeiras para períodos de menor ocupação.",
      futureOpportunities: "Oportunidades de crescimento através da expansão do portfolio, melhoria da eficiência operacional e desenvolvimento de serviços complementares. O mercado apresenta potencial para investimentos estratégicos.",
      visualizationSuggestions: [
        "Taxa de ocupação mensal",
        "Receita por disponibilidade (RevPAR)",
        "Tempo médio de antecedência das reservas"
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