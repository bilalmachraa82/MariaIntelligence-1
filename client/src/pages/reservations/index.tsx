import { useState } from "react";
import type { Reservation, ReservationStatus } from "../../lib/types";
import { useReservations, useDeleteReservation, useReservationEnums } from "@/hooks/use-reservations";
import { useProperties } from "@/hooks/use-properties";
import { Link, useLocation } from "wouter";
import { PlusCircle, FileUp, Calendar } from "lucide-react";
import { InspirationQuote } from "@/components/ui/inspiration-quote";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary, FeatureErrorFallback } from "@/shared/components/ErrorBoundary";
import { useQueryClient } from "@tanstack/react-query";
import { ReservationsVirtualTable } from "@/components/reservations/ReservationsVirtualTable";

function ReservationsPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);
  
  const [, setLocation] = useLocation();
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: enums } = useReservationEnums();
  const deleteReservation = useDeleteReservation();
  const { toast } = useToast();

  // Filter reservations
  const filteredReservations = (reservations || []).filter((reservation: Reservation) => {
    const matchesSearch = 
      reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (properties?.find(p => p.id === reservation.propertyId)?.name || "")
        .toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    const matchesProperty = propertyFilter === "all" || reservation.propertyId.toString() === propertyFilter;
    
    return matchesSearch && matchesStatus && matchesProperty;
  });

  const handleDeleteReservation = async () => {
    if (reservationToDelete !== null) {
      try {
        await deleteReservation.mutateAsync(reservationToDelete);
        toast({
          title: "Reserva excluída",
          description: "A reserva foi excluída com sucesso.",
        });
        setReservationToDelete(null);
      } catch (error) {
        toast({
          title: "Erro ao excluir reserva",
          description: "Ocorreu um erro ao excluir a reserva.",
          variant: "destructive",
        });
      }
    }
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties?.find(p => p.id === propertyId);
    return property ? property.name : "Propriedade não encontrada";
  };

  const isLoading = isLoadingReservations || isLoadingProperties;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Reservas</h2>
        <div className="mt-4 sm:mt-0 space-x-2">
          <Link href="/reservations/new">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Nova Reserva
            </Button>
          </Link>
          <Link href="/pdf-upload">
            <Button variant="outline">
              <FileUp className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Mensagem inspiradora */}
      <div className="w-full">
        <InspirationQuote context="reservations" variant="minimal" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Gerenciar Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar reservas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            <div className="flex gap-2">
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {enums?.reservationStatus?.map((status: ReservationStatus) => (
                    <SelectItem key={status} value={status}>
                      {status === "pending" && "Pendente"}
                      {status === "confirmed" && "Confirmada"}
                      {status === "cancelled" && "Cancelada"}
                      {status === "completed" && "Completada"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={propertyFilter} 
                onValueChange={setPropertyFilter}
                disabled={isLoadingProperties}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Propriedade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as propriedades</SelectItem>
                  {properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredReservations && filteredReservations.length > 0 ? (
            <ReservationsVirtualTable
              reservations={filteredReservations}
              getPropertyName={getPropertyName}
              onReservationClick={(id) => setLocation(`/reservations/${id}`)}
              onReservationEdit={(id) => setLocation(`/reservations/edit/${id}`)}
              onReservationDelete={(id) => setReservationToDelete(id)}
              onPropertyClick={(id) => setLocation(`/properties/${id}`)}
            />
          ) : (
            <div className="text-center py-12 border rounded-md">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || propertyFilter !== "all"
                  ? "Nenhuma reserva corresponde aos filtros aplicados."
                  : "Nenhuma reserva cadastrada."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={reservationToDelete !== null} onOpenChange={(open) => !open && setReservationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReservation} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Wrap the page with error boundary for better error handling
export default function ReservationsPage() {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallback={
        <FeatureErrorFallback
          feature="Reservas"
          onReset={() => {
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            window.location.reload();
          }}
        />
      }
    >
      <ReservationsPageContent />
    </ErrorBoundary>
  );
}
