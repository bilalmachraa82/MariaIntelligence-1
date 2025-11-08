import { memo } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend as RechartsLegend
} from "recharts";

interface DataPoint {
  [key: string]: any;
}

interface CustomBarChartProps {
  data: DataPoint[];
  index: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  className?: string;
}

export const CustomBarChart = memo<CustomBarChartProps>(({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value: number) => value.toString(),
  yAxisWidth = 50,
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  className = ""
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          {showGridLines && <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />}
          <XAxis dataKey={index} tick={{ fill: "#666" }} />
          <YAxis width={yAxisWidth} tick={{ fill: "#666" }} tickFormatter={valueFormatter} />
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), ""]}
            contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
          />
          {showLegend && <RechartsLegend />}
          
          {categories.map((category, i) => (
            <Bar 
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={showAnimation}
              animationDuration={1000}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if data, categories, or colors change
  return (
    prevProps.data === nextProps.data &&
    prevProps.categories === nextProps.categories &&
    prevProps.colors === nextProps.colors &&
    prevProps.index === nextProps.index &&
    prevProps.showLegend === nextProps.showLegend &&
    prevProps.showGridLines === nextProps.showGridLines &&
    prevProps.showAnimation === nextProps.showAnimation
  );
});

CustomBarChart.displayName = 'CustomBarChart';

export default CustomBarChart;