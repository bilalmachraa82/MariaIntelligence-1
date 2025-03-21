import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SimpleBarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  color?: string;
  valueFormatter?: (value: number) => string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  color = '#d946ef',
  valueFormatter = (value) => `${value}%`
}) => {
  // Garantir que os dados nunca sejam undefined
  const safeData = data || [];
  
  // Converter para formato esperado pelo Recharts
  const chartData = safeData.map(item => ({
    name: item.name,
    value: item.value || 0
  }));

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#666' }}
            tickLine={{ stroke: '#666' }}
          />
          <YAxis 
            tick={{ fill: '#666' }}
            tickLine={{ stroke: '#666' }}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            formatter={(value: number) => [valueFormatter(value), 'Valor']}
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="value" 
            fill={color} 
            name="Ocupação" 
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleBarChart;