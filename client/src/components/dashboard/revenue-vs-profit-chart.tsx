import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'lucide-react';
import { Text } from '@tremor/react';
import { formatCurrency } from '@/lib/utils';
import { 
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Area,
  AreaChart as ReAreaChart,
  Legend as ReLegend
} from 'recharts';

// Tipo para os dados do gráfico
interface ChartData {
  name: string;
  Receita: number;
  Lucro: number;
}

// Propriedades do componente
interface RevenueVsProfitChartProps {
  data: ChartData[];
  isLoading: boolean;
}

// Ponto ativo no gráfico
interface ActivePoint {
  dataKey: string;
  name: string;
  value: number;
}

/**
 * Componente de gráfico avançado que mostra a comparação entre Receita e Lucro
 * com interatividade aprimorada
 */
export function RevenueVsProfitChart({ data, isLoading }: RevenueVsProfitChartProps) {
  const { t } = useTranslation();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);

  // Se não houver dados ou estiver carregando, mostramos um estado de carregamento
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <LineChart className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-muted-foreground font-medium">
          {t("dashboard.noDataAvailable", "Não há dados disponíveis.")}
        </p>
        <Text className="text-xs text-muted-foreground mt-1">
          Aguardando registros de receita e lucro
        </Text>
      </div>
    );
  }

  // Formato para tooltips
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  // Handle click no ponto do gráfico
  const handlePointClick = (dataKey: string, name: string, value: number) => {
    setActivePoint({ dataKey, name, value });
    // Poderíamos abrir um modal ou mostrar mais informações
  };

  // Tooltip customizado para os pontos do gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="font-bold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Valores máximos para o gráfico
  const maxRevenue = Math.max(...data.map(item => item.Receita || 0));

  return (
    <div className="h-full relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium">Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium">Lucro</span>
          </div>
        </div>
        <div className="text-sm font-bold">
          {formatCurrency(maxRevenue)}
        </div>
      </div>
      
      {/* Componente responsivo do Recharts */}
      <div className="h-[calc(100%-2rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <ReAreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            onClick={(data: any) => {
              if (data && data.activePayload && data.activePayload.length) {
                const entry = data.activePayload[0];
                if (entry.dataKey && entry.payload) {
                  handlePointClick(
                    entry.dataKey as string,
                    entry.payload.name as string,
                    entry.payload[entry.dataKey] as number
                  );
                }
              }
            }}
          >
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false} 
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} €`}
            />
            <ReTooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area 
              type="monotone" 
              dataKey="Receita" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fill="url(#colorReceita)"
              activeDot={{ 
                r: 6, 
                stroke: 'white', 
                strokeWidth: 2,
                fill: '#3b82f6',
                className: 'cursor-pointer hover:r-8 transition-all duration-300 drop-shadow-md'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="Lucro" 
              stroke="#10b981" 
              strokeWidth={3}
              fill="url(#colorLucro)"
              activeDot={{ 
                r: 6, 
                stroke: 'white', 
                strokeWidth: 2,
                fill: '#10b981',
                className: 'cursor-pointer hover:r-8 transition-all duration-300 drop-shadow-md'
              }}
            />
          </ReAreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Mostrar informações do ponto selecionado */}
      {activePoint && (
        <div className="absolute top-0 right-0 mt-2 mr-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-fadeIn">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ 
                backgroundColor: activePoint.dataKey === 'Receita' ? '#3b82f6' : '#10b981' 
              }}
            />
            <span className="text-sm font-medium">{activePoint.dataKey}</span>
          </div>
          <div className="text-sm font-bold">
            {formatCurrency(activePoint.value)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {activePoint.name}
          </div>
        </div>
      )}
    </div>
  );
}