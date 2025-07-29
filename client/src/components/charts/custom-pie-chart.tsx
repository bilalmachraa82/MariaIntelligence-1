import React, { useState } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend as RechartsLegend,
  Sector
} from "recharts";

interface DataPoint {
  [key: string]: any;
}

interface CustomPieChartProps {
  data: DataPoint[];
  category: string;
  index: string;
  valueFormatter?: (value: number) => string;
  colors?: string[];
  showAnimation?: boolean;
  className?: string;
  donut?: boolean;
}

// Função para renderizar a forma ativa quando o usuário passa o mouse
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
    </g>
  );
};

export const CustomPieChart: React.FC<CustomPieChartProps> = ({
  data,
  category,
  index,
  valueFormatter = (value: number) => value.toString(),
  colors = ["#d946ef", "#ec4899", "#f59e0b", "#10b981", "#6366f1"],
  showAnimation = true,
  className = "",
  donut = false
}) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const processedData = data.map((dataPoint) => {
    // Garantir que o objeto tem as propriedades necessárias
    if (!dataPoint || typeof dataPoint !== 'object') {
      return { name: 'Desconhecido', value: 0 };
    }
    
    return {
      name: dataPoint[index] || 'Desconhecido',
      value: typeof dataPoint[category] === 'number' ? dataPoint[category] : 0
    };
  });

  // Gerenciar o estado ativo quando o mouse passa por cima de uma fatia
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            innerRadius={donut ? 60 : 0}
            outerRadius={90}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            isAnimationActive={showAnimation}
            animationDuration={1200}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), ""]}
            contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
          />
          <RechartsLegend layout="vertical" align="right" verticalAlign="middle" />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;