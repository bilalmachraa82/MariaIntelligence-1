import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useProperties } from "@/hooks/use-properties";
import { useReservations } from "@/hooks/use-reservations";
import { useOwners } from "@/hooks/use-owners";

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface OwnerReport {
  ownerId: number;
  ownerName: string;
  startDate: string;
  endDate: string;
  propertyReports: PropertyReportItem[];
  totals: ReportTotals;
}

export interface PropertyReportItem {
  propertyId: number;
  propertyName: string;
  reservations: ReservationSummary[];
  revenue: number;
  cleaningCosts: number;
  checkInFees: number;
  commission: number;
  teamPayments: number;
  netProfit: number;
  occupancyRate: number;
  availableDays: number;
  occupiedDays: number;
}

export interface ReservationSummary {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  totalAmount: number;
  cleaningFee: number;
  checkInFee: number;
  commission: number;
  teamPayment: number;
  netAmount: number;
  platform: string;
}

export interface ReportTotals {
  totalRevenue: number;
  totalCleaningCosts: number;
  totalCheckInFees: number;
  totalCommission: number;
  totalTeamPayments: number;
  totalNetProfit: number;
  averageOccupancy: number;
  totalProperties: number;
  totalReservations: number;
}

export function useOwnerReport(ownerId: number | null, dateRange: DateRange) {
  const { data: owners, isLoading: isOwnersLoading } = useOwners();
  const { data: properties, isLoading: isPropertiesLoading } = useProperties();
  const { data: allReservations, isLoading: isReservationsLoading } = useReservations();
  
  const isLoading = isOwnersLoading || isPropertiesLoading || isReservationsLoading;
  
  // Gera o relatório para um proprietário específico
  const report = useMemo(() => {
    if (!ownerId || !properties || !allReservations || !owners || isLoading) {
      return null;
    }
    
    // Encontrar o proprietário
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) {
      return null;
    }
    
    // Filtrar as propriedades deste proprietário
    const ownerProperties = properties.filter(p => p.ownerId === ownerId);
    if (!ownerProperties.length) {
      return null;
    }
    
    // Filtrar as reservas do período para cada propriedade
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    // Calcular os dias disponíveis no período
    const availableDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Mapear cada propriedade para um relatório
    const propertyReports: PropertyReportItem[] = ownerProperties.map(property => {
      // Filtrar reservas desta propriedade no período desejado
      const propertyReservations = allReservations.filter(reservation => {
        if (reservation.propertyId !== property.id) {
          return false;
        }
        
        const checkInDate = new Date(reservation.checkInDate);
        const checkOutDate = new Date(reservation.checkOutDate);
        
        // Verificar se a reserva está dentro do período ou se sobrepõe
        return (
          // Começa dentro do período (inclusive)
          (checkInDate >= start && checkInDate <= end) ||
          // Termina dentro do período (inclusive)
          (checkOutDate >= start && checkOutDate <= end) ||
          // Cobre todo o período
          (checkInDate <= start && checkOutDate >= end)
        );
      });
      
      // Calcular dias ocupados
      let occupiedDays = 0;
      propertyReservations.forEach(res => {
        const resStart = new Date(res.checkInDate);
        const resEnd = new Date(res.checkOutDate);
        
        // Ajustar se a reserva não estiver totalmente dentro do período
        const effectiveStart = resStart < start ? start : resStart;
        const effectiveEnd = resEnd > end ? end : resEnd;
        
        // Adicionar os dias de ocupação ajustados
        occupiedDays += Math.max(0, 
          Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24))
        );
      });
      
      // Taxa de ocupação
      const occupancyRate = availableDays > 0 ? (occupiedDays / availableDays * 100) : 0;
      
      // Cálculos financeiros
      const revenue = propertyReservations.reduce((sum, res) => sum + parseFloat(res.totalAmount), 0);
      const cleaningCost = parseFloat(property.cleaningCost || "0");
      const checkInFee = parseFloat(property.checkInFee || "0");
      const commissionRate = parseFloat(property.commission || "0") / 100;
      const teamPayment = parseFloat(property.teamPayment || "0");
      
      const cleaningCosts = propertyReservations.length * cleaningCost;
      const checkInFees = propertyReservations.length * checkInFee;
      const commission = revenue * commissionRate;
      const teamPayments = propertyReservations.length * teamPayment;
      
      // Lucro líquido
      const netProfit = revenue - cleaningCosts - checkInFees - commission - teamPayments;
      
      // Resumos de reservas
      const reservationSummaries: ReservationSummary[] = propertyReservations.map(res => {
        const totalAmount = parseFloat(res.totalAmount);
        const reserveCommission = totalAmount * commissionRate;
        
        return {
          id: res.id,
          checkInDate: res.checkInDate,
          checkOutDate: res.checkOutDate,
          guestName: res.guestName,
          totalAmount,
          cleaningFee: cleaningCost,
          checkInFee,
          commission: reserveCommission,
          teamPayment,
          netAmount: totalAmount - cleaningCost - checkInFee - reserveCommission - teamPayment,
          platform: res.platform || "other"
        };
      });
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        reservations: reservationSummaries,
        revenue,
        cleaningCosts,
        checkInFees,
        commission,
        teamPayments,
        netProfit,
        occupancyRate,
        availableDays,
        occupiedDays
      };
    });
    
    // Calcular totais para o relatório geral
    const totals: ReportTotals = {
      totalRevenue: propertyReports.reduce((sum, p) => sum + p.revenue, 0),
      totalCleaningCosts: propertyReports.reduce((sum, p) => sum + p.cleaningCosts, 0),
      totalCheckInFees: propertyReports.reduce((sum, p) => sum + p.checkInFees, 0),
      totalCommission: propertyReports.reduce((sum, p) => sum + p.commission, 0),
      totalTeamPayments: propertyReports.reduce((sum, p) => sum + p.teamPayments, 0),
      totalNetProfit: propertyReports.reduce((sum, p) => sum + p.netProfit, 0),
      averageOccupancy: propertyReports.length > 0 
        ? propertyReports.reduce((sum, p) => sum + p.occupancyRate, 0) / propertyReports.length 
        : 0,
      totalProperties: propertyReports.length,
      totalReservations: propertyReports.reduce((sum, p) => sum + p.reservations.length, 0)
    };
    
    return {
      ownerId,
      ownerName: owner.name,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      propertyReports,
      totals
    };
  }, [ownerId, properties, allReservations, owners, dateRange, isLoading]);
  
  const propertyOccupancyData = useMemo(() => {
    if (!report) return [];
    
    return report.propertyReports.map(p => ({
      name: p.propertyName,
      occupancy: Math.round(p.occupancyRate),
      revenue: p.revenue,
      netProfit: p.netProfit
    }));
  }, [report]);
  
  const costDistributionData = useMemo(() => {
    if (!report) return [];
    
    return [
      { name: "Custos de Limpeza", value: report.totals.totalCleaningCosts },
      { name: "Taxas de Check-in", value: report.totals.totalCheckInFees },
      { name: "Comissão", value: report.totals.totalCommission },
      { name: "Pagamentos às Equipas", value: report.totals.totalTeamPayments },
      { name: "Lucro Líquido", value: report.totals.totalNetProfit }
    ];
  }, [report]);
  
  return {
    report,
    propertyOccupancyData,
    costDistributionData,
    isLoading
  };
}