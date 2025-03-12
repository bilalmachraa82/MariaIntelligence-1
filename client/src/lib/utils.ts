import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(numValue);
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "dd/MM/yyyy", { locale: pt });
}

export function formatDateISO(date: string | Date): string {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "yyyy-MM-dd");
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, "dd/MM/yyyy HH:mm", { locale: pt });
}

export function calculateDuration(checkIn: string | Date, checkOut: string | Date): number {
  if (!checkIn || !checkOut) return 0;
  
  const startDate = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const endDate = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  
  return differenceInDays(endDate, startDate);
}

export function calculateOccupancyColor(occupancy: number): string {
  if (occupancy >= 80) return "bg-green-500";
  if (occupancy >= 60) return "bg-blue-500";
  if (occupancy >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function truncate(str: string, length: number): string {
  if (!str) return "";
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function calculateNetAmount(
  totalAmount: number, 
  cleaningFee: number, 
  checkInFee: number, 
  commissionFee: number,
  teamPayment: number,
  platformFee: number
): number {
  return totalAmount - (cleaningFee + checkInFee + commissionFee + teamPayment + platformFee);
}

export const reservationStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

export const platformColors = {
  airbnb: "bg-rose-100 text-rose-800",
  booking: "bg-blue-100 text-blue-800",
  expedia: "bg-indigo-100 text-indigo-800",
  direct: "bg-emerald-100 text-emerald-800",
  other: "bg-gray-100 text-gray-800",
};
