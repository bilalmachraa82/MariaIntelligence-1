import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsGrid } from "./stats-grid";
import { RecentReservations } from "./recent-reservations";
import { PropertyInsights } from "./property-insights";
import { RecentActivity } from "./recent-activity";
import { UploadPDF } from "./upload-pdf";
import { format, subDays } from "date-fns";

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

const dateRanges: DateRange[] = [
  {
    label: "Últimos 30 dias",
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Mês atual",
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Mês anterior",
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 0), "yyyy-MM-dd"),
  },
  {
    label: "Trimestre atual",
    startDate: format(new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
  {
    label: "Ano atual",
    startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  },
];

export default function Dashboard() {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(dateRanges[0]);

  // Fetch statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics", selectedDateRange.startDate, selectedDateRange.endDate],
  });

  // Fetch recent reservations
  const { data: reservations, isLoading: isLoadingReservations } = useQuery({
    queryKey: ["/api/reservations"],
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities?limit=4"],
  });

  // Prepare recent reservations data (latest 4)
  const recentReservations = reservations?.slice(0, 4) || [];

  // Handle date range change
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRange = dateRanges.find(range => range.label === e.target.value);
    if (selectedRange) {
      setSelectedDateRange(selectedRange);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Dashboard</h2>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <div>
            <label htmlFor="period" className="sr-only">Período</label>
            <select 
              id="period" 
              className="block w-full pl-3 pr-10 py-2 text-base border-secondary-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={selectedDateRange.label}
              onChange={handleDateRangeChange}
            >
              {dateRanges.map((range) => (
                <option key={range.label} value={range.label}>{range.label}</option>
              ))}
            </select>
          </div>
          <button 
            type="button" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => {
              // In a real app, this would trigger a download of the statistics
              alert('Exportação de dados implementada na versão completa');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid 
        data={statistics} 
        isLoading={isLoadingStats} 
      />

      {/* Recent Reservations and Property Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentReservations 
          reservations={recentReservations} 
          isLoading={isLoadingReservations} 
        />
        <PropertyInsights 
          topProperties={statistics?.topProperties} 
          isLoading={isLoadingStats} 
        />
      </div>

      {/* Recent Activity and Upload PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity 
            activities={activities} 
            isLoading={isLoadingActivities} 
          />
        </div>
        <div>
          <UploadPDF />
        </div>
      </div>
    </div>
  );
}
