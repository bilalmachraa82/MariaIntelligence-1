import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  Rocket,
  BarChart3,
  CheckCircle,
  Clock,
  Euro,
  Percent,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PropertyInsightsProps {
  ownerId: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  ownerName: string;
}

interface InsightsData {
  executiveSummary: string;
  performanceAnalysis: string;
  marketInsights: string;
  recommendations: string[];
  strategicActions: string[];
  riskAssessment: string;
  futureOpportunities: string;
  visualizationSuggestions: string[];
}

interface MetricsData {
  revpar: number;
  adr: number;
  seasonalityIndex: number;
  profitabilityScore: number;
  growthPotential: number;
}

interface SummaryData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: string;
  totalReservations: number;
  averageBookingValue: string;
}

export function PropertyInsights({ ownerId, dateRange, ownerName }: PropertyInsightsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{
        success: boolean;
        insights: InsightsData;
        metrics: MetricsData;
        summary: SummaryData;
        error?: string;
      }>(`/api/reports/owner/${ownerId}/insights`, {
        method: 'POST',
        data: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });

      if (response.success) {
        setInsights(response.insights);
        setMetrics(response.metrics);
        setSummary(response.summary);
        
        toast({
          title: "✨ Insights Gerados!",
          description: "Análise inteligente concluída com sucesso",
        });
      } else {
        throw new Error(response.error || 'Erro ao gerar insights');
      }
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      toast({
        title: "Erro ao Gerar Insights",
        description: "Não foi possível gerar a análise. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const getProfitabilityColor = (score: number) => {
    if (score >= 20) return 'text-emerald-600';
    if (score >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!insights) {
    return (
      <Card className="mt-8 border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-blue-800">
            🧠 Análise Inteligente por IA
          </CardTitle>
          <CardDescription className="text-lg text-blue-600">
            Gere insights avançados e recomendações personalizadas para {ownerName}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            A nossa IA especializada em alojamento local irá analisar os dados financeiros e operacionais 
            para fornecer recomendações estratégicas, identificar oportunidades de crescimento e avaliar riscos.
          </p>
          <Button 
            onClick={generateInsights}
            disabled={isLoading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            {isLoading ? (
              <>
                <Brain className="mr-2 h-5 w-5 animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-5 w-5" />
                Gerar Insights Inteligentes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Resumo Executivo */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <CheckCircle className="h-6 w-6" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-emerald-700 text-lg leading-relaxed">{insights.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Métricas Principais - DADOS REAIS DO BACKEND */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Euro className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {summary ? formatCurrency(summary.totalRevenue) : formatCurrency(0)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Receita Total</p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Percent className="h-5 w-5 text-blue-600" />
              <span className={`text-2xl font-bold ${summary && parseFloat(summary.profitMargin) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary ? `${summary.profitMargin}%` : '0%'}
              </span>
              </div>
              <p className="text-sm text-gray-600">Margem de Lucro</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {summary ? summary.totalReservations : 0}
                </span>
              </div>
              <p className="text-sm text-gray-600">Reservas</p>
            </CardContent>
          </Card>
        </div>

      {/* Tabs com Insights Detalhados */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">📊 Análise</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Recomendações</TabsTrigger>
          <TabsTrigger value="risks">⚠️ Riscos</TabsTrigger>
          <TabsTrigger value="opportunities">🚀 Oportunidades</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Análise de Desempenho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{insights.performanceAnalysis}</p>
              
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Score de Rentabilidade</span>
                        <span className="text-sm text-gray-600">{metrics.profitabilityScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(metrics.profitabilityScore, 100)} className="h-2" />
                    </div>
                    
                    {metrics.adr > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Taxa Diária Média</span>
                          <span className="text-sm text-gray-600">{formatCurrency(metrics.adr)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Insights de Mercado</h4>
                      <p className="text-blue-700 text-sm">{insights.marketInsights}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Recomendações Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Badge variant="outline" className="mt-0.5 bg-yellow-100 text-yellow-800">
                      {index + 1}
                    </Badge>
                    <p className="text-yellow-800 flex-1">{recommendation}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  Ações Estratégicas
                </h4>
                <div className="space-y-2">
                  {insights.strategicActions.map((action, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-200">
                      <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <p className="text-green-800 text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Avaliação de Riscos:</strong> {insights.riskAssessment}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Rocket className="h-5 w-5" />
                Oportunidades de Crescimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-700 leading-relaxed mb-4">{insights.futureOpportunities}</p>
              
              <div>
                <h4 className="font-semibold mb-3 text-purple-800">Métricas Recomendadas para Acompanhar:</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.visualizationSuggestions.map((suggestion, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}