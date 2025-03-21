import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps
} from 'recharts';

interface CustomPieChartProps {
  data: Array<Record<string, any>>;
  category: string;
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showAnimation?: boolean;
  className?: string;
  variant?: 'pie' | 'donut';
}

export const CustomPieChart: React.FC<CustomPieChartProps> = ({
  data,
  category,
  index,
  colors = ['#9333ea', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'],
  valueFormatter = (value) => value.toString(),
  showLegend = true,
  showAnimation = true,
  className = '',
  variant = 'pie',
}) => {
  // Ensure we have enough colors, repeat if necessary
  const ensuredColors = [...colors];
  while (ensuredColors.length < data.length) {
    ensuredColors.push(...colors.slice(0, data.length - ensuredColors.length));
  }

  const isDarkMode = document.documentElement.classList.contains('dark');
  
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      return (
        <div className="bg-card border border-border p-2 rounded shadow-md">
          <p className="font-bold text-sm">{dataPoint.name}</p>
          <p style={{ color: dataPoint.color }} className="text-xs">
            {valueFormatter(dataPoint.value as number)} ({((dataPoint.value / data.reduce((sum, item) => sum + item[category], 0)) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index: idx
  }: any) => {
    if (percent < 0.05) return null; // Don't render label for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = variant === 'donut' 
      ? innerRadius + (outerRadius - innerRadius) * 0.5
      : outerRadius * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? "white" : "black"}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const getInnerRadius = () => {
    return variant === 'donut' ? '50%' : 0;
  };

  const CustomizedLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center">
            <div
              className="h-3 w-3 rounded-full mr-1"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-xs font-medium">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="80%"
            innerRadius={getInnerRadius()}
            dataKey={category}
            nameKey={index}
            isAnimationActive={showAnimation}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={ensuredColors[index % ensuredColors.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              content={<CustomizedLegend />}
              layout="horizontal" 
              verticalAlign="bottom"
              align="center"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};