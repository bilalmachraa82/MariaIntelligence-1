import { ApiResponse } from '@/shared/types';
import {
  DashboardMetrics,
  RevenueChart,
  PropertyPerformance,
  RecentActivity,
  DashboardFilters,
  OccupancyData,
  UpcomingReservation
} from '../types';

const BASE_URL = '/api';

class DashboardApiService {
  async getMetrics(filters?: DashboardFilters): Promise<ApiResponse<DashboardMetrics>> {
    const searchParams = new URLSearchParams();

    if (filters) {
      searchParams.append('startDate', filters.dateRange.start.toISOString());
      searchParams.append('endDate', filters.dateRange.end.toISOString());

      if (filters.propertyIds?.length) {
        searchParams.append('propertyIds', filters.propertyIds.join(','));
      }
    }

    const response = await fetch(`${BASE_URL}/dashboard/metrics?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard metrics: ${response.statusText}`);
    }

    return response.json();
  }

  async getRevenueChart(filters?: DashboardFilters): Promise<ApiResponse<RevenueChart[]>> {
    const searchParams = new URLSearchParams();

    if (filters) {
      searchParams.append('startDate', filters.dateRange.start.toISOString());
      searchParams.append('endDate', filters.dateRange.end.toISOString());

      if (filters.propertyIds?.length) {
        searchParams.append('propertyIds', filters.propertyIds.join(','));
      }
    }

    const response = await fetch(`${BASE_URL}/dashboard/revenue-chart?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch revenue chart: ${response.statusText}`);
    }

    return response.json();
  }

  async getPropertyPerformance(filters?: DashboardFilters): Promise<ApiResponse<PropertyPerformance[]>> {
    const searchParams = new URLSearchParams();

    if (filters) {
      searchParams.append('startDate', filters.dateRange.start.toISOString());
      searchParams.append('endDate', filters.dateRange.end.toISOString());

      if (filters.propertyIds?.length) {
        searchParams.append('propertyIds', filters.propertyIds.join(','));
      }
    }

    const response = await fetch(`${BASE_URL}/dashboard/property-performance?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch property performance: ${response.statusText}`);
    }

    return response.json();
  }

  async getRecentActivity(): Promise<ApiResponse<RecentActivity[]>> {
    const response = await fetch(`${BASE_URL}/dashboard/recent-activity`);

    if (!response.ok) {
      throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
    }

    return response.json();
  }

  async getOccupancyData(filters?: DashboardFilters): Promise<ApiResponse<OccupancyData[]>> {
    const searchParams = new URLSearchParams();

    if (filters) {
      searchParams.append('startDate', filters.dateRange.start.toISOString());
      searchParams.append('endDate', filters.dateRange.end.toISOString());

      if (filters.propertyIds?.length) {
        searchParams.append('propertyIds', filters.propertyIds.join(','));
      }
    }

    const response = await fetch(`${BASE_URL}/dashboard/occupancy?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch occupancy data: ${response.statusText}`);
    }

    return response.json();
  }

  async getUpcomingReservations(): Promise<ApiResponse<UpcomingReservation[]>> {
    const response = await fetch(`${BASE_URL}/dashboard/upcoming-reservations`);

    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming reservations: ${response.statusText}`);
    }

    return response.json();
  }
}

export const dashboardApi = new DashboardApiService();