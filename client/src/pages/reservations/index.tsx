import { useState } from "react";
import { useReservations, useDeleteReservation, useReservationEnums } from "@/hooks/use-reservations";
import { useProperties } from "@/hooks/use-properties";
import { Link } from "wouter";
import { PlusCircle, MoreHorizontal, Edit, Trash2, FileUp, Calendar } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
import { formatCurrency, formatDate, reservationStatusColors, platformColors } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ReservationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);
  
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: enums } = useReservationEnums();
  const deleteReservation = useDeleteReservation();
  const { toast } = useToast();

  // Filter reservations
  const filteredReservations = reservations?.filter(reservation => {
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
          <Link href="/#upload-pdf">
            <Button variant="outline">
              <FileUp className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
          </Link>
        </div>
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
                  {enums?.reservationStatus?.map((status) => (
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
                    <TableHead>Status</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations && filteredReservations.length > 0 ? (
                    filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          <div 
                            className="text-primary-600 hover:underline cursor-pointer"
                            onClick={() => window.location.href = `/reservations/${reservation.id}`}
                          >
                            {reservation.guestName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="text-primary-600 hover:underline cursor-pointer"
                            onClick={() => window.location.href = `/properties/${reservation.propertyId}`}
                          >
                            {getPropertyName(reservation.propertyId)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(reservation.checkInDate)}</TableCell>
                        <TableCell>{formatDate(reservation.checkOutDate)}</TableCell>
                        <TableCell>{formatCurrency(Number(reservation.totalAmount))}</TableCell>
                        <TableCell>
                          <Badge className={reservationStatusColors[reservation.status] || ""}>
                            {reservation.status === "pending" && "Pendente"}
                            {reservation.status === "confirmed" && "Confirmada"}
                            {reservation.status === "cancelled" && "Cancelada"}
                            {reservation.status === "completed" && "Completada"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={platformColors[reservation.platform] || ""}>
                            {reservation.platform === "airbnb" && "Airbnb"}
                            {reservation.platform === "booking" && "Booking"}
                            {reservation.platform === "expedia" && "Expedia"}
                            {reservation.platform === "direct" && "Direto"}
                            {reservation.platform === "other" && "Outro"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.location.href = `/reservations/${reservation.id}`}>
                                <Button variant="ghost" className="p-0 h-auto w-full justify-start">
                                  Ver detalhes
                                </Button>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.location.href = `/reservations/edit/${reservation.id}`}>
                                <Button variant="ghost" className="p-0 h-auto w-full justify-start">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Button>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Button 
                                  variant="ghost" 
                                  className="p-0 h-auto w-full justify-start text-red-600"
                                  onClick={() => setReservationToDelete(reservation.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </Button>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
                        {searchTerm || statusFilter !== "all" || propertyFilter !== "all" 
                          ? "Nenhuma reserva corresponde aos filtros aplicados." 
                          : "Nenhuma reserva cadastrada."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
