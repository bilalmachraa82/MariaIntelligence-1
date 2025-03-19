import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// UI Utility Functions
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatting Functions
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Calculation Functions
export function calculateDays(checkIn: string, checkOut: string): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(checkIn);
  const secondDate = new Date(checkOut);
  const diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
  return diffDays;
}

export function calculateDuration(startDate: string, endDate: string): string {
  const days = calculateDays(startDate, endDate);
  
  if (days === 1) {
    return "1 dia";
  }
  return `${days} dias`;
}

export function calculateNetAmount(
  totalAmount: number, 
  platformFee: number = 0, 
  cleaningFee: number = 0, 
  teamPayment: number = 0,
  checkInFee: number = 0,
  commissionFee: number = 0
): number {
  return totalAmount - platformFee - cleaningFee - teamPayment - checkInFee - commissionFee;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Color Functions
export function calculateOccupancyColor(occupancy: number): string {
  if (occupancy >= 80) {
    return "text-green-600";
  } else if (occupancy >= 50) {
    return "text-yellow-600";
  } else {
    return "text-red-600";
  }
}

// UI Colors and Variants
export const reservationStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-600/20 hover:bg-yellow-500/20",
  confirmed: "bg-green-500/10 text-green-600 border-green-600/20 hover:bg-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-600/20 hover:bg-red-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-600/20 hover:bg-blue-500/20"
};

export const platformColors: Record<string, string> = {
  airbnb: "text-pink-600",
  booking: "text-blue-600",
  expedia: "text-yellow-600",
  direct: "text-green-600",
  other: "text-gray-600"
};