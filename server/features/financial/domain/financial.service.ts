import type {
  FinancialStatistics,
  MonthlyRevenueData,
  PropertyStatistics,
  FinancialFilters,
  FinancialReport,
  ExpenseCategory,
  Expense,
  BudgetPlan
} from "./financial.entity.js";
import type { ServiceResult } from "../../../shared/types/common.js";

export interface FinancialService {
  getFinancialStatistics(filters?: FinancialFilters): Promise<ServiceResult<FinancialStatistics>>;
  getMonthlyRevenue(filters?: FinancialFilters): Promise<ServiceResult<MonthlyRevenueData[]>>;
  getPropertyStatistics(propertyId: number, filters?: FinancialFilters): Promise<ServiceResult<PropertyStatistics>>;
  generateFinancialReport(filters: FinancialFilters): Promise<ServiceResult<FinancialReport>>;
  getExpenseCategories(): Promise<ServiceResult<ExpenseCategory[]>>;
  getExpenses(filters?: FinancialFilters): Promise<ServiceResult<Expense[]>>;
  getBudgetPlans(year: number, propertyId?: number): Promise<ServiceResult<BudgetPlan[]>>;
}

export class FinancialDomainService implements FinancialService {
  constructor(
    private readonly financialRepository: FinancialRepository
  ) {}

  async getFinancialStatistics(filters?: FinancialFilters): Promise<ServiceResult<FinancialStatistics>> {
    try {
      const statistics = await this.financialRepository.getStatistics(filters);
      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch financial statistics'
      };
    }
  }

  async getMonthlyRevenue(filters?: FinancialFilters): Promise<ServiceResult<MonthlyRevenueData[]>> {
    try {
      const revenueData = await this.financialRepository.getMonthlyRevenue(filters);
      return {
        success: true,
        data: revenueData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch monthly revenue data'
      };
    }
  }

  async getPropertyStatistics(propertyId: number, filters?: FinancialFilters): Promise<ServiceResult<PropertyStatistics>> {
    try {
      const statistics = await this.financialRepository.getPropertyStatistics(propertyId, filters);
      if (!statistics) {
        return {
          success: false,
          error: 'Property not found or no data available'
        };
      }
      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch property statistics'
      };
    }
  }

  async generateFinancialReport(filters: FinancialFilters): Promise<ServiceResult<FinancialReport>> {
    try {
      // Validate date range
      if (filters.startDate && filters.endDate && filters.startDate >= filters.endDate) {
        return {
          success: false,
          error: 'Start date must be before end date'
        };
      }

      const report = await this.financialRepository.generateReport(filters);
      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate financial report'
      };
    }
  }

  async getExpenseCategories(): Promise<ServiceResult<ExpenseCategory[]>> {
    try {
      const categories = await this.financialRepository.getExpenseCategories();
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch expense categories'
      };
    }
  }

  async getExpenses(filters?: FinancialFilters): Promise<ServiceResult<Expense[]>> {
    try {
      const expenses = await this.financialRepository.getExpenses(filters);
      return {
        success: true,
        data: expenses
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch expenses'
      };
    }
  }

  async getBudgetPlans(year: number, propertyId?: number): Promise<ServiceResult<BudgetPlan[]>> {
    try {
      if (year < 2020 || year > 2050) {
        return {
          success: false,
          error: 'Invalid year provided'
        };
      }

      const budgetPlans = await this.financialRepository.getBudgetPlans(year, propertyId);
      return {
        success: true,
        data: budgetPlans
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch budget plans'
      };
    }
  }
}

// Repository interface
export interface FinancialRepository {
  getStatistics(filters?: FinancialFilters): Promise<FinancialStatistics>;
  getMonthlyRevenue(filters?: FinancialFilters): Promise<MonthlyRevenueData[]>;
  getPropertyStatistics(propertyId: number, filters?: FinancialFilters): Promise<PropertyStatistics | null>;
  generateReport(filters: FinancialFilters): Promise<FinancialReport>;
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getExpenses(filters?: FinancialFilters): Promise<Expense[]>;
  getBudgetPlans(year: number, propertyId?: number): Promise<BudgetPlan[]>;
}