import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart } from 'lucide-react';
import { Text } from '@tremor/react';
import { formatCurrency } from '@/lib/utils';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Sector,
  Tooltip as ReTooltip,
  ResponsiveContainer
} from 'recharts';

// Tipo para os itens do gráfico
interface DistributionItem {
  name: string;
  value: number;
  color: string;
  textColor: string;
}

// Propriedades do componente
interface FinancialDistributionChartProps {
  data: DistributionItem[];
  totalValue: number;
  isLoading: boolean;
}

/**
 * Componente de gráfico em pizza para distribuição financeira
 * com interatividade aprimorada
 */
export function FinancialDistributionChart({ 
  data, 
  totalValue, 
  isLoading 
}: FinancialDistributionChartProps) {
  const { t } = useTranslation();
  // Estado para controlar qual fatia está ativa
  const [activeIndex, setActiveIndex] = useState(0);

  // Se não houver dados ou estiver carregando, mostramos um estado de carregamento
  if (isLoading || !data || data.length === 0 || totalValue <= 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <PieChart className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-muted-foreground font-medium">
          {t("dashboard.noDataAvailable", "Não há dados disponíveis.")}
        </p>
        <Text className="text-xs text-muted-foreground mt-1">
          Aguardando registros financeiros
        </Text>
      </div>
    );
  }

  // Componente personalizado para renderizar a fatia ativa
  const renderActiveShape = (props: any) => {
    const { 
      cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill
    } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6} // Aumentar o tamanho da fatia ativa
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="drop-shadow-lg"
        />
      </g>
    );
  };
  
  // Componente personalizado para tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="font-medium mb-1">{payload[0].name}</div>
          <div className="font-bold text-lg" style={{ color: payload[0].payload.textColor }}>
            {formatCurrency(payload[0].value)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {(payload[0].payload.value / totalValue * 100).toFixed(1)}% do total
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Para detectar cliques nas fatias e atualizar o estado
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-64 h-64 mx-auto relative" style={{ minHeight: "200px" }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <RePieChart>
            <defs>
              <filter id="dropShadow" height="130%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> 
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge> 
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </defs>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onClick={(_, index) => {
                setActiveIndex(index);
                // Poderíamos abrir um modal ou navegar para detalhes
              }}
              className="cursor-pointer"
              filter="url(#dropShadow)"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  style={{
                    filter: index === activeIndex ? 'brightness(1.1)' : 'none',
                    transition: 'filter 0.3s ease'
                  }}
                  className="hover:brightness-110 transition-all duration-300"
                />
              ))}
            </Pie>
            <ReTooltip content={<CustomTooltip />} />
            
            {/* Texto central */}
            <text
              x="50%"
              y="45%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-500 text-sm"
            >
              Total
            </text>
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-900 dark:fill-white font-bold text-lg"
            >
              {formatCurrency(totalValue)}
            </text>
          </RePieChart>
        </ResponsiveContainer>
        
        {/* Círculo animado ao redor do gráfico */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[170px] h-[170px] rounded-full border-2 border-blue-100 dark:border-blue-900/40 animate-pulse-slow"></div>
        </div>
      </div>
      
      {/* Legenda interativa */}
      <div className="flex flex-col gap-4 mt-6 w-full max-w-xs">
        {data.map((item, index) => (
          <div 
            key={`legend-${index}`}
            className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeIndex === index 
                ? 'bg-gray-100 dark:bg-gray-800/60' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
            }`}
            onClick={() => setActiveIndex(index)}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <span 
              className="text-sm font-bold tabular-nums"
              style={{ color: item.textColor }}
            >
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}