import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface CustomBarChartProps {
  data: Array<Record<string, any>>;
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  className?: string;
  height?: string | number;
}

export const CustomBarChart: React.FC<CustomBarChartProps> = ({
  data,
  index,
  categories,
  colors = ['#9333ea', '#f43f5e', '#f59e0b', '#10b981'],
  valueFormatter = (value) => value.toString(),
  showGridLines = true,
  className = '',
  height = 300,
}) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Ensure colors is always an array with at least as many elements as categories
  const ensuredColors = colors.length >= categories.length 
    ? colors 
    : [...colors, ...Array(categories.length - colors.length).fill('#9333ea')];
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-2 rounded shadow-md">
          <p className="font-bold text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {valueFormatter(entry.value as number)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full h-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          {showGridLines && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
            />
          )}
          <XAxis 
            dataKey={index} 
            tick={{ fontSize: 12, fill: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }} 
            tickLine={false}
            axisLine={{ stroke: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
            stroke={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
          />
          <YAxis 
            tickFormatter={valueFormatter} 
            tick={{ fontSize: 12, fill: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }} 
            tickLine={false}
            axisLine={{ stroke: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
            stroke={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              fill={ensuredColors[index]}
              radius={[4, 4, 0, 0]}
              animationDuration={showGridLines ? 1000 : 0}
              strokeWidth={0}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};