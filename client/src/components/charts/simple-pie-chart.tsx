import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SimplePieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  colors = ['#d946ef', '#f43f5e', '#f59e0b', '#10b981', '#6366f1'],
  valueFormatter = (value) => `${value}`
}) => {
  // Garantir que os dados nunca sejam undefined
  const safeData = data || [];
  
  // Converter para formato esperado pelo Recharts e filtrar valores zero
  const chartData = safeData
    .filter(item => item.value > 0)
    .map(item => ({
      name: item.name,
      value: item.value || 0
    }));

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [valueFormatter(value), '']}
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px'
            }}
          />
          <Legend 
            formatter={(value) => <span style={{color: '#333'}}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimplePieChart;