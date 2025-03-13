import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsGrid } from "./stats-grid";
import { RecentReservations } from "./recent-reservations";
import { PropertyInsights } from "./property-insights";
import { RecentActivity } from "./recent-activity";
import { format, subDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";

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

  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            {t("dashboard.title", "Dashboard")}
          </h2>
          <p className="text-secondary-500">
            {t("dashboard.description", "Visão geral do seu negócio de aluguel de imóveis")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="period" className="sr-only">{t("dashboard.period", "Período")}</label>
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
          
          <Link href="/upload-pdf">
            <Button variant="outline" className="flex items-center">
              <FileUp className="mr-2 h-4 w-4" />
              {t("pdfUpload.uploadButton", "Importar PDF")}
            </Button>
          </Link>
          
          <Button 
            variant="default"
            className="flex items-center"
            onClick={() => {
              // In a real app, this would trigger a download of the statistics
              alert(t("dashboard.exportNotImplemented", 'Exportação de dados implementada na versão completa'));
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("dashboard.export", "Exportar")}
          </Button>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <RecentActivity 
          activities={activities} 
          isLoading={isLoadingActivities} 
        />
      </div>
    </div>
  );
}
