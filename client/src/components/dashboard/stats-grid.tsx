import { 
  BanknoteIcon, 
  HomeIcon, 
  CalendarIcon, 
  CheckCircleIcon 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  totalRevenue: number;
  netProfit: number;
  activeProperties: number;
  occupancyRate: number;
  revenueChange?: number;
  profitChange?: number;
  propertiesChange?: number;
  occupancyChange?: number;
}

interface StatsGridProps {
  data?: StatsData;
  isLoading: boolean;
}

export function StatsGrid({ data, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Revenue Card */}
      <Card className="bg-white overflow-hidden shadow">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
                <BanknoteIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">Receita Total</dt>
                <dd>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <div className="text-lg font-medium text-secondary-900">
                      {formatCurrency(data?.totalRevenue || 0)}
                    </div>
                  )}
                  {!isLoading && data?.revenueChange !== undefined && (
                    <div className={`flex items-center text-xs ${data.revenueChange >= 0 ? 'text-success-600' : 'text-red-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.revenueChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                      </svg>
                      {Math.abs(data.revenueChange).toFixed(1)}% comparado ao período anterior
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit Card */}
      <Card className="bg-white overflow-hidden shadow">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">Ganho Líquido</dt>
                <dd>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <div className="text-lg font-medium text-secondary-900">
                      {formatCurrency(data?.netProfit || 0)}
                    </div>
                  )}
                  {!isLoading && data?.profitChange !== undefined && (
                    <div className={`flex items-center text-xs ${data.profitChange >= 0 ? 'text-success-600' : 'text-red-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.profitChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                      </svg>
                      {Math.abs(data.profitChange).toFixed(1)}% comparado ao período anterior
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Card */}
      <Card className="bg-white overflow-hidden shadow">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                <HomeIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">Propriedades Ativas</dt>
                <dd>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <div className="text-lg font-medium text-secondary-900">
                      {data?.activeProperties || 0}
                    </div>
                  )}
                  {!isLoading && data?.propertiesChange !== undefined && (
                    <div className={`flex items-center text-xs ${data.propertiesChange >= 0 ? 'text-success-600' : 'text-red-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.propertiesChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                      </svg>
                      {data.propertiesChange > 0 ? `${data.propertiesChange} novas` : `${Math.abs(data.propertiesChange)} removidas`}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occupancy Rate Card */}
      <Card className="bg-white overflow-hidden shadow">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-600">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-secondary-500 truncate">Taxa de Ocupação</dt>
                <dd>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16 mt-1" />
                  ) : (
                    <div className="text-lg font-medium text-secondary-900">
                      {data?.occupancyRate ? `${Math.round(data.occupancyRate)}%` : '0%'}
                    </div>
                  )}
                  {!isLoading && data?.occupancyChange !== undefined && (
                    <div className={`flex items-center text-xs ${data.occupancyChange >= 0 ? 'text-success-600' : 'text-red-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.occupancyChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                      </svg>
                      {Math.abs(data.occupancyChange).toFixed(1)}% comparado ao período anterior
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
