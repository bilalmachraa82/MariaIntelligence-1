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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Revenue Card */}
      <div className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/3 translate-x-1/3 transform rounded-full bg-maria-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 h-16 w-16 translate-y-1/3 -translate-x-1/3 transform rounded-full bg-maria-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
        
        <div className="p-6 relative z-10">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full primary-gradient flex items-center justify-center text-white shadow-md">
                <BanknoteIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-base font-semibold text-maria-dark">Receita Total</h3>
            </div>
          </div>
          
          <div className="relative pl-1">
            {isLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <div className="text-3xl font-bold text-maria-dark">
                {formatCurrency(data?.totalRevenue || 0)}
              </div>
            )}
            
            {!isLoading && data?.revenueChange !== undefined && (
              <div className={`flex items-center text-xs font-medium mt-2 ${data.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.revenueChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
                {Math.abs(data.revenueChange).toFixed(1)}% comparado ao período anterior
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/3 translate-x-1/3 transform rounded-full bg-maria-accent opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 h-16 w-16 translate-y-1/3 -translate-x-1/3 transform rounded-full bg-maria-accent opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
        
        <div className="p-6 relative z-10">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full accent-gradient flex items-center justify-center text-maria-dark shadow-md">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-base font-semibold text-maria-dark">Ganho Líquido</h3>
            </div>
          </div>
          
          <div className="relative pl-1">
            {isLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <div className="text-3xl font-bold text-maria-dark">
                {formatCurrency(data?.netProfit || 0)}
              </div>
            )}
            
            {!isLoading && data?.profitChange !== undefined && (
              <div className={`flex items-center text-xs font-medium mt-2 ${data.profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.profitChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
                {Math.abs(data.profitChange).toFixed(1)}% comparado ao período anterior
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Card */}
      <div className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/3 translate-x-1/3 transform rounded-full bg-maria-primary-light opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 h-16 w-16 translate-y-1/3 -translate-x-1/3 transform rounded-full bg-maria-primary-light opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        
        <div className="p-6 relative z-10">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full card-gradient flex items-center justify-center text-maria-dark shadow-md">
                <HomeIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-base font-semibold text-maria-dark">Propriedades Ativas</h3>
            </div>
          </div>
          
          <div className="relative pl-1">
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <div className="text-3xl font-bold text-maria-dark">
                {data?.activeProperties || 0}
              </div>
            )}
            
            {!isLoading && data?.propertiesChange !== undefined && (
              <div className={`flex items-center text-xs font-medium mt-2 ${data.propertiesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.propertiesChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
                {data.propertiesChange > 0 ? `${data.propertiesChange} novas` : `${Math.abs(data.propertiesChange)} removidas`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Occupancy Rate Card */}
      <div className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="absolute top-0 right-0 h-24 w-24 -translate-y-1/3 translate-x-1/3 transform rounded-full bg-maria-accent opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 h-16 w-16 translate-y-1/3 -translate-x-1/3 transform rounded-full bg-maria-primary opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
        
        <div className="p-6 relative z-10">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full primary-gradient flex items-center justify-center text-white shadow-md">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-base font-semibold text-maria-dark">Taxa de Ocupação</h3>
            </div>
          </div>
          
          <div className="relative pl-1">
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <div className="text-3xl font-bold text-maria-dark">
                {data?.occupancyRate ? `${Math.round(data.occupancyRate)}%` : '0%'}
              </div>
            )}
            
            {!isLoading && data?.occupancyChange !== undefined && (
              <div className={`flex items-center text-xs font-medium mt-2 ${data.occupancyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={data.occupancyChange >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                </svg>
                {Math.abs(data.occupancyChange).toFixed(1)}% comparado ao período anterior
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
