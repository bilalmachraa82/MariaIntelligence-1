import { formatCurrency, formatDate, reservationStatusColors } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { type Reservation } from "@shared/schema";

interface RecentReservationsProps {
  reservations?: Reservation[];
  isLoading: boolean;
}

export function RecentReservations({ reservations, isLoading }: RecentReservationsProps) {
  return (
    <div className="rounded-lg overflow-hidden h-full">
      <div className="bg-gradient-to-r from-maria-primary to-maria-primary-light p-0.5 h-full">
        <div className="bg-white rounded-lg flex flex-col h-full">
          <div className="px-5 py-4 border-b border-maria-primary-light flex flex-row justify-between items-center">
            <h3 className="text-xl font-bold text-maria-dark flex items-center">
              <span className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              Reservas Recentes
            </h3>
            <Link href="/reservations">
              <Button variant="ghost" className="text-sm font-medium text-maria-primary hover:text-maria-accent hover:bg-maria-primary-light transition-colors">
                Ver todas →
              </Button>
            </Link>
          </div>
          <div className="bg-white overflow-hidden p-0 flex-grow">
            {isLoading ? (
              <ReservationsSkeleton />
            ) : (
              <ul role="list" className="h-full">
                {reservations && reservations.length > 0 ? (
                  reservations.map((reservation, index) => (
                    <li key={reservation.id} className={`px-5 py-4 ${index < reservations.length - 1 ? 'border-b border-maria-primary-light border-opacity-30' : ''} hover:bg-maria-primary-light hover:bg-opacity-5 transition-colors`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-start">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-maria-primary to-maria-accent flex items-center justify-center text-white shadow-sm">
                            <CalendarIcon className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-bold text-maria-dark">Propriedade #{reservation.propertyId}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <div className="flex items-center text-xs text-maria-gray">
                                <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Check-in: {formatDate(reservation.checkInDate)}</span>
                              </div>
                              <div className="flex items-center text-xs text-maria-gray">
                                <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Check-out: {formatDate(reservation.checkOutDate)}</span>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-maria-gray flex items-center">
                              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {reservation.guestName} 
                              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-maria-primary-light bg-opacity-30 text-maria-dark text-xs">
                                {reservation.numGuests || 1} hóspedes
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                              reservation.status === "confirmed" ? "bg-green-100 text-green-800" : 
                              reservation.status === "cancelled" ? "bg-red-100 text-red-800" : 
                              "bg-blue-100 text-blue-800"}`}>
                            {reservation.status === "pending" && "Pendente"}
                            {reservation.status === "confirmed" && "Confirmada"}
                            {reservation.status === "cancelled" && "Cancelada"}
                            {reservation.status === "completed" && "Completada"}
                          </span>
                          <p className="mt-1 text-sm font-bold text-maria-primary">{formatCurrency(typeof reservation.totalAmount === 'string' ? parseFloat(reservation.totalAmount) : Number(reservation.totalAmount))}</p>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-5 py-12 h-full flex items-center justify-center">
                    <div className="text-center p-6 bg-white rounded-lg border border-maria-primary-light shadow-sm max-w-xs">
                      <svg className="mx-auto h-12 w-12 text-maria-gray" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-3 text-sm font-medium text-maria-dark">Nenhuma reserva encontrada</p>
                      <p className="mt-1 text-xs text-maria-gray">Adicione novas reservas para visualizar aqui</p>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationsSkeleton() {
  return (
    <ul role="list" className="h-full">
      {[0, 1, 2, 3].map((item, index) => (
        <li key={item} className={`px-5 py-4 ${index < 3 ? 'border-b border-maria-primary-light border-opacity-30' : ''}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-start">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="ml-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <div className="flex flex-wrap gap-2 mb-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="h-5 w-20 rounded-full mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
