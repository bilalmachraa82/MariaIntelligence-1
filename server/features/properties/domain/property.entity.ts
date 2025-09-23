import type { BaseEntity } from "../../../shared/types/common.js";

export interface Property extends BaseEntity {
  name: string;
  aliases?: string | null;
  ownerId: number;
  cleaningCost: string;
  checkInFee: string;
  commission: string;
  teamPayment: string;
  cleaningTeam?: string | null;
  cleaningTeamId?: number | null;
  monthlyFixedCost?: string | null;
  active: boolean;
}

export interface CreatePropertyRequest {
  name: string;
  aliases?: string;
  ownerId: number;
  cleaningCost?: string;
  checkInFee?: string;
  commission?: string;
  teamPayment?: string;
  cleaningTeam?: string;
  cleaningTeamId?: number;
  monthlyFixedCost?: string;
  active?: boolean;
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {}

export interface PropertyStatistics {
  occupancyRate: number;
  totalRevenue: number;
  netProfit: number;
  totalReservations: number;
  averageStayDuration: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}