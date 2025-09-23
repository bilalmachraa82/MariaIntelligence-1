import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import { DashboardFilters } from '../types';
import { subDays } from 'date-fns';

export function useDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: subDays(new Date(), 30),
      end: new Date(),
    },
  });

  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: () => dashboardApi.getMetrics(filters),
  });

  const revenueChartQuery = useQuery({
    queryKey: ['dashboard-revenue-chart', filters],
    queryFn: () => dashboardApi.getRevenueChart(filters),
  });

  const propertyPerformanceQuery = useQuery({
    queryKey: ['dashboard-property-performance', filters],
    queryFn: () => dashboardApi.getPropertyPerformance(filters),
  });

  const recentActivityQuery = useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(),
  });

  const occupancyDataQuery = useQuery({
    queryKey: ['dashboard-occupancy', filters],
    queryFn: () => dashboardApi.getOccupancyData(filters),
  });

  const upcomingReservationsQuery = useQuery({
    queryKey: ['dashboard-upcoming-reservations'],
    queryFn: () => dashboardApi.getUpcomingReservations(),
  });

  const isLoading = useMemo(() => {
    return metricsQuery.isLoading ||
           revenueChartQuery.isLoading ||
           propertyPerformanceQuery.isLoading ||
           recentActivityQuery.isLoading ||
           occupancyDataQuery.isLoading ||
           upcomingReservationsQuery.isLoading;
  }, [
    metricsQuery.isLoading,
    revenueChartQuery.isLoading,
    propertyPerformanceQuery.isLoading,
    recentActivityQuery.isLoading,
    occupancyDataQuery.isLoading,
    upcomingReservationsQuery.isLoading,
  ]);

  const hasError = useMemo(() => {
    return metricsQuery.error ||
           revenueChartQuery.error ||
           propertyPerformanceQuery.error ||
           recentActivityQuery.error ||
           occupancyDataQuery.error ||
           upcomingReservationsQuery.error;
  }, [
    metricsQuery.error,
    revenueChartQuery.error,
    propertyPerformanceQuery.error,
    recentActivityQuery.error,
    occupancyDataQuery.error,
    upcomingReservationsQuery.error,
  ]);

  const refetchAll = () => {
    metricsQuery.refetch();
    revenueChartQuery.refetch();
    propertyPerformanceQuery.refetch();
    recentActivityQuery.refetch();
    occupancyDataQuery.refetch();
    upcomingReservationsQuery.refetch();
  };

  return {
    // Data
    metrics: metricsQuery.data?.data || null,
    revenueChart: revenueChartQuery.data?.data || [],
    propertyPerformance: propertyPerformanceQuery.data?.data || [],
    recentActivity: recentActivityQuery.data?.data || [],
    occupancyData: occupancyDataQuery.data?.data || [],
    upcomingReservations: upcomingReservationsQuery.data?.data || [],

    // State
    filters,
    setFilters,
    isLoading,
    hasError,

    // Actions
    refetchAll,
  };
}

export function useDashboardMetrics(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: () => dashboardApi.getMetrics(filters),
  });
}