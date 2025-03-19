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
    <div className="rounded-lg overflow-hidden h-full">
      <div className="bg-gradient-to-r from-maria-accent to-maria-primary p-0.5 h-full">
        <div className="bg-white rounded-lg flex flex-col h-full">
          <div className="px-5 py-4 border-b border-maria-accent flex flex-row justify-between items-center">
            <h3 className="text-xl font-bold text-maria-dark flex items-center">
              <span className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </span>
              Desempenho das Propriedades
            </h3>
            <Link href="/reports">
              <Button variant="ghost" className="text-sm font-medium text-maria-primary hover:text-maria-accent hover:bg-maria-primary-light transition-colors">
                Ver detalhes →
              </Button>
            </Link>
          </div>
          <div className="bg-white p-5 flex-grow">
            {/* Chart */}
            <div className="h-64 bg-maria-primary-light bg-opacity-30 rounded-lg flex items-center justify-center">
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-pulse">
                    <p className="text-sm text-maria-dark">Carregando estatísticas...</p>
                    <div className="flex justify-center mt-2 space-x-1">
                      <div className="w-2 h-2 rounded-full bg-maria-primary"></div>
                      <div className="w-2 h-2 rounded-full bg-maria-primary animation-delay-200"></div>
                      <div className="w-2 h-2 rounded-full bg-maria-primary animation-delay-500"></div>
                    </div>
                  </div>
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
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === "occupancy") return [`${value}%`, "Ocupação"];
                        if (name === "revenue") return [`€${(value * 100).toFixed(0)}`, "Receita"];
                        if (name === "profit") return [`€${(value * 100).toFixed(0)}`, "Lucro"];
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '8px',
                        borderColor: '#E5A4A4',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="occupancy" name="Ocupação (%)" fill="#E5A4A4" />
                    <Bar dataKey="revenue" name="Receita (€)" fill="#98D8D8" />
                    <Bar dataKey="profit" name="Lucro (€)" fill="#2C2C2C" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-6 bg-white rounded-lg border border-maria-primary-light shadow-sm">
                  <svg className="mx-auto h-12 w-12 text-maria-gray" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-maria-dark">Sem dados disponíveis</p>
                  <p className="mt-1 text-xs text-maria-gray">Cadastre reservas para ver estatísticas</p>
                </div>
              )}
            </div>
            
            {/* Top properties */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-maria-dark mb-3 flex items-center">
                <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                Propriedades com Maior Ocupação
              </h4>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center bg-maria-primary-light bg-opacity-10 p-2 rounded-lg">
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
                    <div key={property.id} className="flex items-center bg-white p-2 rounded-lg border border-maria-primary-light hover:bg-maria-primary-light hover:bg-opacity-10 transition-colors group">
                      <span className="text-sm font-medium text-maria-dark w-28 truncate group-hover:text-maria-primary transition-colors">{property.name}</span>
                      <div className="flex-1 mx-2">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-2 bg-maria-primary rounded-full transition-all" 
                            style={{ width: `${property.occupancyRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-maria-dark">{Math.round(property.occupancyRate)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-maria-primary-light bg-opacity-10 rounded-lg">
                  <p className="text-sm text-maria-dark">
                    Sem dados de ocupação disponíveis
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
