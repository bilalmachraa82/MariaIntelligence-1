import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useProperties } from "@/hooks/use-properties";
import { useReservations } from "@/hooks/use-reservations";
import { useOwners } from "@/hooks/use-owners";
import { getFixedPaymentOwner } from "@/services/fixed-payment-owners";

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
  nights: number; // Duração da estadia em noites
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

// Interface para proprietários com pagamento fixo no relatório
export interface FixedPaymentInfo {
  isFixedPayment: boolean;
  monthlyAmount: number;
  deductions: number;
  netAmount: number;
}

export function useOwnerReport(ownerId: number | null, dateRange: DateRange) {
  // Convertemos as datas para uma string única para usar como parte da cache key
  const dateKey = `${dateRange.startDate}-${dateRange.endDate}`;
  
  // Refetch automático quando as datas mudam
  const { data: owners, isLoading: isOwnersLoading } = useOwners();
  const { data: properties, isLoading: isPropertiesLoading } = useProperties();
  
  // Usamos o hook normal sem modificações - a key nos componentes principais forçará a atualização
  const { data: allReservations, isLoading: isReservationsLoading } = useReservations();
  
  const isLoading = isOwnersLoading || isPropertiesLoading || isReservationsLoading;
  
  // Gera o relatório para um proprietário específico
  const report = useMemo(() => {
    console.log("OwnerReportModern - dateRange atualizado:", dateRange);
    
    if (!ownerId || !properties || !allReservations || !owners || isLoading) {
      return null;
    }
    
    // Encontrar o proprietário
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) {
      return null;
    }
    
    // Verificar se é um proprietário com pagamento fixo
    const fixedPaymentOwner = getFixedPaymentOwner(owner.name);
    
    // Filtrar as propriedades deste proprietário
    const ownerProperties = properties.filter(p => p.ownerId === ownerId);
    if (!ownerProperties.length) {
      return null;
    }
    
    // Se for um proprietário com pagamento fixo, definir valores especiais
    if (fixedPaymentOwner) {
      console.log(`Proprietário ${owner.name} tem pagamento fixo de ${fixedPaymentOwner.monthlyPayment}€`);
      
      // Extrair o mês e ano do período do relatório
      const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date();
      const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
      const month = start.getMonth() + 1; // JavaScript meses são 0-11
      const year = start.getFullYear();
      
      // Criar um relatório simplificado com o valor fixo
      return {
        ownerId,
        ownerName: owner.name,
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        propertyReports: ownerProperties.map(property => ({
          propertyId: property.id,
          propertyName: property.name,
          reservations: [],
          revenue: 0,
          cleaningCosts: 0,
          checkInFees: 0,
          commission: 0,
          teamPayments: 0,
          netProfit: 0,
          occupancyRate: 0,
          availableDays: 0,
          occupiedDays: 0
        })),
        totals: {
          totalRevenue: fixedPaymentOwner.monthlyPayment,
          totalCleaningCosts: 0,
          totalCheckInFees: 0,
          totalCommission: 0,
          totalTeamPayments: 0,
          totalNetProfit: fixedPaymentOwner.monthlyPayment - fixedPaymentOwner.deductions,
          averageOccupancy: 0,
          totalProperties: ownerProperties.length,
          totalReservations: 0
        },
        fixedPaymentInfo: {
          isFixedPayment: true,
          monthlyAmount: fixedPaymentOwner.monthlyPayment,
          deductions: fixedPaymentOwner.deductions,
          netAmount: fixedPaymentOwner.monthlyPayment - fixedPaymentOwner.deductions
        }
      };
    }
    
    // Filtrar as reservas do período para cada propriedade
    const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date();
    const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    
    console.log("OwnerReportModern - report dados:", dateRange.startDate, dateRange.endDate);
    console.log("OwnerReportModern - reservas totais:", allReservations.length);
    
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
        const isInPeriod = (
          // Começa dentro do período (inclusive)
          (checkInDate >= start && checkInDate <= end) ||
          // Termina dentro do período (inclusive)
          (checkOutDate >= start && checkOutDate <= end) ||
          // Cobre todo o período
          (checkInDate <= start && checkOutDate >= end)
        );
        
        if (property.id === 28) { // Log apenas para uma propriedade específica para evitar sobrecarga de logs
          console.log(`Reserva ${reservation.id} (${reservation.propertyId}): ${checkInDate.toISOString().split('T')[0]} - ${checkOutDate.toISOString().split('T')[0]}, Em período: ${isInPeriod}`);
        }
        
        return isInPeriod;
      });
      
      if (property.id === 28) {
        console.log(`Propriedade ${property.name} (${property.id}): ${propertyReservations.length} reservas encontradas no período ${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`);
      }
      
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
      const revenue = propertyReservations.reduce((sum, res) => sum + parseFloat(res.totalAmount.toString()), 0);
      const cleaningCost = parseFloat(property.cleaningCost || "0");
      const checkInFee = parseFloat(property.checkInFee || "0");
      const commissionRate = parseFloat(property.commission || "0") / 100;
      // O valor do teamPayment é igual ao cleaningCost (esclarecido pelo cliente)
      // São a mesma coisa vista de diferentes perspectivas
      
      const cleaningCosts = propertyReservations.length * cleaningCost;
      const checkInFees = propertyReservations.length * checkInFee;
      const commission = revenue * commissionRate;
      // Usamos o mesmo valor para teamPayments e cleaningCosts
      const teamPayments = cleaningCosts;
      
      // Lucro líquido (corrigido para não contar o mesmo custo duas vezes)
      // Não incluímos teamPayments aqui porque já consideramos o cleaningCosts
      // que é o mesmo valor (conforme esclarecido pelo cliente)
      const netProfit = revenue - cleaningCosts - checkInFees - commission;
      
      // Resumos de reservas
      const reservationSummaries: ReservationSummary[] = propertyReservations.map(res => {
        const totalAmount = parseFloat(res.totalAmount.toString());
        const reserveCommission = totalAmount * commissionRate;
        
        // Calcular número de noites
        const checkIn = new Date(res.checkInDate);
        const checkOut = new Date(res.checkOutDate);
        const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        
        return {
          id: res.id,
          checkInDate: res.checkInDate,
          checkOutDate: res.checkOutDate,
          guestName: res.guestName,
          totalAmount,
          cleaningFee: cleaningCost,
          checkInFee,
          commission: reserveCommission,
          teamPayment: cleaningCost, // Usando o mesmo valor do cleaningCost
          netAmount: totalAmount - cleaningCost - checkInFee - reserveCommission, // Corrigido para não subtrair o mesmo custo duas vezes
          platform: res.platform || "other",
          nights
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
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      propertyReports,
      totals
    };
  }, [ownerId, properties, allReservations, owners, dateRange, isLoading]);
  
  const propertyOccupancyData = useMemo(() => {
    if (!report) return [];
    
    // Log para debug de reservas
    const totalReservations = report.propertyReports.reduce((sum, prop) => sum + prop.reservations.length, 0);
    console.log(`useOwnerReport - Total de reservas em todas as propriedades: ${totalReservations}`);
    
    // Log detalhado para propriedades com reservas
    report.propertyReports.forEach(prop => {
      console.log(`Propriedade ${prop.propertyName}: ${prop.reservations.length} reservas`);
      if (prop.reservations.length > 0) {
        console.log(`- Primeira reserva: ${prop.reservations[0].checkInDate} a ${prop.reservations[0].checkOutDate}`);
      }
    });
    
    return report.propertyReports.map(p => ({
      name: p.propertyName,
      occupancy: Math.round(p.occupancyRate),
      revenue: p.revenue,
      netProfit: p.netProfit
    }));
  }, [report]);
  
  const costDistributionData = useMemo(() => {
    if (!report) return [];
    
    // Removemos a entrada de "Pagamentos às Equipas" porque é igual aos custos de limpeza
    return [
      { name: "Custos de Limpeza", value: report.totals.totalCleaningCosts },
      { name: "Taxas de Check-in", value: report.totals.totalCheckInFees },
      { name: "Comissão", value: report.totals.totalCommission },
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