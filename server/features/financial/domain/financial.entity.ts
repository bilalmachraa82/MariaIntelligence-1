import type { BaseEntity } from "../../../shared/types/common.js";

export interface FinancialStatistics {
  totalRevenue: number;
  netProfit: number;
  occupancyRate: number;
  totalProperties: number;
  activeProperties: number;
  reservationsCount: number;
  topProperties: Array<{
    id: number;
    name: string;
    occupancyRate: number;
    revenue: number;
    profit: number;
  }>;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  profit: number;
}

export interface PropertyStatistics {
  propertyId: number;
  totalRevenue: number;
  netProfit: number;
  occupancyRate: number;
  averageStayDuration: number;
  totalReservations: number;
  monthlyData: MonthlyRevenueData[];
}

export interface FinancialFilters {
  startDate?: Date;
  endDate?: Date;
  propertyId?: number;
  granularity?: 'day' | 'week' | 'month' | 'year';
}

export interface FinancialReport {
  period: {
    startDate: string;
    endDate: string;
    granularity: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    occupancyRate: number;
    averageDailyRate: number;
  };
  breakdown: {
    byProperty: PropertyStatistics[];
    byMonth: MonthlyRevenueData[];
    byPlatform: Array<{
      platform: string;
      revenue: number;
      reservations: number;
      percentage: number;
    }>;
  };
  trends: {
    revenueGrowth: number;
    occupancyTrend: number;
    profitMargin: number;
  };
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

export interface Expense extends BaseEntity {
  categoryId: number;
  propertyId?: number;
  amount: number;
  description: string;
  date: Date;
  isRecurring: boolean;
  recurringPeriod?: 'monthly' | 'quarterly' | 'yearly';
  attachments?: string[];
}

export interface BudgetPlan extends BaseEntity {
  propertyId?: number;
  year: number;
  month?: number;
  plannedRevenue: number;
  plannedExpenses: number;
  actualRevenue?: number;
  actualExpenses?: number;
  notes?: string;
}