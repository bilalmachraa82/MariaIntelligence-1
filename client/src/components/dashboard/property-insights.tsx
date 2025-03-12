import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface PropertyPerformance {
  id: number;
  name: string;
  occupancyRate: number;
  revenue: number;
  profit: number;
}

interface PropertyInsightsProps {
  topProperties?: PropertyPerformance[];
  isLoading: boolean;
}

export function PropertyInsights({ topProperties, isLoading }: PropertyInsightsProps) {
  // Data for the chart - in a real app, this would be from a more detailed API call
  const chartData = topProperties?.map(property => ({
    name: property.name,
    occupancy: property.occupancyRate,
    revenue: property.revenue / 100, // Scale down for better visualization
    profit: property.profit / 100, // Scale down for better visualization
  })) || [];

  return (
    <Card className="bg-white shadow">
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg leading-6 font-medium text-secondary-900">
          Desempenho das Propriedades
        </CardTitle>
        <Link href="/reports">
          <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            Ver detalhes
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="bg-white p-4">
        {/* Chart */}
        <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <p className="text-sm text-secondary-500">Gráfico de ocupação e receita</p>
              <p className="text-xs text-secondary-400 mt-1">Carregando dados...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === "occupancy") return [`${value}%`, "Ocupação"];
                  if (name === "revenue") return [`€${(value * 100).toFixed(0)}`, "Receita"];
                  if (name === "profit") return [`€${(value * 100).toFixed(0)}`, "Lucro"];
                  return [value, name];
                }} />
                <Legend />
                <Bar dataKey="occupancy" name="Ocupação (%)" fill="#0ea5e9" />
                <Bar dataKey="revenue" name="Receita (€)" fill="#10b981" />
                <Bar dataKey="profit" name="Lucro (€)" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <p className="text-sm text-secondary-500">Sem dados disponíveis</p>
              <p className="text-xs text-secondary-400 mt-1">Cadastre reservas para ver estatísticas</p>
            </div>
          )}
        </div>
        
        {/* Top properties */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-secondary-700 mb-3">Propriedades com Maior Ocupação</h4>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-4 w-28" />
                  <div className="flex-1 mx-2">
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : topProperties && topProperties.length > 0 ? (
            <div className="space-y-3">
              {topProperties.map((property) => (
                <div key={property.id} className="flex items-center">
                  <span className="text-sm font-medium text-secondary-900 w-28 truncate">{property.name}</span>
                  <div className="flex-1 mx-2">
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-primary-500 rounded-full" 
                        style={{ width: `${property.occupancyRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-secondary-900">{Math.round(property.occupancyRate)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary-500 text-center py-4">
              Sem dados de ocupação disponíveis
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
