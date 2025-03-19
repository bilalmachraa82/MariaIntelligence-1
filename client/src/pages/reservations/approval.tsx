import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Property, Reservation } from "../../lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useProperties } from "@/hooks/use-properties";
import { useReservationApproval } from "@/hooks/use-reservation-approval";
import { Check, X, Eye } from "lucide-react";

export default function ReservationApprovalPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: properties } = useProperties();

  // Buscar reservas que precisam de revisão
  const { data: pendingReservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations', { status: 'needs_review' }],
    queryFn: () => fetch('/api/reservations?status=needs_review').then(res => res.json())
  });

  const getPropertyName = (propertyId: number) => {
    const property = properties?.find(p => p.id === propertyId);
    return property ? property.name : "Propriedade não encontrada";
  };

  const { approve, reject } = useReservationApproval();

  const handleApprove = async (id: number) => {
    try {
      await approve.mutateAsync(id);
      toast({
        title: "Reserva aprovada",
        description: "A reserva foi aprovada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao aprovar reserva",
        description: "Ocorreu um erro ao aprovar a reserva.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reject.mutateAsync(id);
      toast({
        title: "Reserva rejeitada",
        description: "A reserva foi rejeitada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao rejeitar reserva",
        description: "Ocorreu um erro ao rejeitar a reserva.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Aprovação de Reservas</h2>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Reservas Pendentes de Aprovação</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !pendingReservations?.length ? (
            <div className="text-center py-8 text-secondary-500">
              Não há reservas pendentes de aprovação.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hóspede</TableHead>
                    <TableHead>Propriedade</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReservations.map((reservation: Reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {reservation.guestName}
                      </TableCell>
                      <TableCell>
                        {getPropertyName(reservation.propertyId)}
                      </TableCell>
                      <TableCell>{formatDate(reservation.checkInDate)}</TableCell>
                      <TableCell>{formatDate(reservation.checkOutDate)}</TableCell>
                      <TableCell>{formatCurrency(Number(reservation.totalAmount))}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reservation.platform === "airbnb" && "Airbnb"}
                          {reservation.platform === "booking" && "Booking"}
                          {reservation.platform === "expedia" && "Expedia"}
                          {reservation.platform === "direct" && "Direto"}
                          {reservation.platform === "other" && "Outro"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/reservas/${reservation.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalhes</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApprove(reservation.id)}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Aprovar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleReject(reservation.id)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Rejeitar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}