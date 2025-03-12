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
    <Card className="bg-white shadow">
      <CardHeader className="px-4 py-5 sm:px-6 flex flex-row justify-between items-center">
        <CardTitle className="text-lg leading-6 font-medium text-secondary-900">
          Reservas Recentes
        </CardTitle>
        <Link href="/reservations">
          <Button variant="link" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="bg-white overflow-hidden p-0">
        {isLoading ? (
          <ReservationsSkeleton />
        ) : (
          <ul role="list" className="divide-y divide-secondary-200">
            {reservations && reservations.length > 0 ? (
              reservations.map((reservation) => (
                <li key={reservation.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-md bg-primary-50 flex items-center justify-center text-primary-600">
                        <CalendarIcon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-secondary-900">{reservation.propertyName}</h4>
                        <div className="mt-1 flex items-center">
                          <p className="text-sm text-secondary-500">Check-in: {formatDate(reservation.checkInDate)}</p>
                          <span className="mx-2 text-secondary-300">|</span>
                          <p className="text-sm text-secondary-500">Check-out: {formatDate(reservation.checkOutDate)}</p>
                        </div>
                        <p className="mt-1 text-sm text-secondary-500">{reservation.guestName} ({reservation.numGuests} hóspedes)</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reservationStatusColors[reservation.status] || 'bg-gray-100 text-gray-800'}`}>
                        {reservation.status === "pending" && "Pendente"}
                        {reservation.status === "confirmed" && "Confirmada"}
                        {reservation.status === "cancelled" && "Cancelada"}
                        {reservation.status === "completed" && "Completada"}
                      </span>
                      <p className="mt-1 text-sm font-medium text-secondary-900">{formatCurrency(Number(reservation.totalAmount))}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-12 text-center">
                <p className="text-sm text-secondary-500">Nenhuma reserva encontrada</p>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ReservationsSkeleton() {
  return (
    <ul role="list" className="divide-y divide-secondary-200">
      {[0, 1, 2, 3].map((item) => (
        <li key={item} className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="ml-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
