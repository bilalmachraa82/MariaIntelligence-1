import { useParams, Link, useLocation } from "wouter";
import { useReservation } from "@/hooks/use-reservations";
import { useProperty } from "@/hooks/use-properties";
import { 
  ArrowLeft, 
  Edit, 
  Home, 
  Users, 
  Calendar, 
  ReceiptText, 
  CircleDollarSign, 
  Percent, 
  BadgePercent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  formatCurrency, 
  formatDate, 
  calculateDuration,
  reservationStatusColors,
  platformColors
} from "@/lib/utils";

export default function ReservationDetailPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  
  const reservationId = id ? parseInt(id) : undefined;
  const { data: reservation, isLoading: isLoadingReservation } = useReservation(reservationId);
  const { data: property, isLoading: isLoadingProperty } = useProperty(
    reservation?.propertyId
  );

  if (isLoadingReservation || isLoadingProperty) {
    return <ReservationDetailSkeleton />;
  }

  if (!reservation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Reserva não encontrada</h2>
        <p className="text-secondary-600 mb-6">A reserva que você está procurando não existe ou foi removida.</p>
        <Button onClick={() => navigate("/reservations")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Reservas
        </Button>
      </div>
    );
  }

  const nights = calculateDuration(reservation.checkInDate, reservation.checkOutDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/reservations")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-secondary-900">Detalhes da Reserva</h2>
          <Badge className={reservationStatusColors[reservation.status] || ""}>
            {reservation.status === "pending" && "Pendente"}
            {reservation.status === "confirmed" && "Confirmada"}
            {reservation.status === "cancelled" && "Cancelada"}
            {reservation.status === "completed" && "Completada"}
          </Badge>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href={`/reservations/edit/${reservation.id}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar Reserva
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main reservation information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Informações da Reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Home className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Propriedade</h3>
                    <p className="text-secondary-900">
                      {property ? (
                        <Link href={`/properties/${property.id}`}>
                          <a className="text-primary-600 hover:underline">{property.name}</a>
                        </Link>
                      ) : (
                        "Propriedade não encontrada"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Hóspede</h3>
                    <p className="text-secondary-900">{reservation.guestName}</p>
                    {reservation.guestEmail && (
                      <p className="text-sm text-secondary-500">
                        <a href={`mailto:${reservation.guestEmail}`} className="text-primary-600 hover:underline">
                          {reservation.guestEmail}
                        </a>
                      </p>
                    )}
                    {reservation.guestPhone && (
                      <p className="text-sm text-secondary-500">
                        <a href={`tel:${reservation.guestPhone}`} className="text-primary-600 hover:underline">
                          {reservation.guestPhone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Período</h3>
                    <p className="text-secondary-900">
                      Check-in: {formatDate(reservation.checkInDate)}
                    </p>
                    <p className="text-secondary-900">
                      Check-out: {formatDate(reservation.checkOutDate)}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {nights} {nights === 1 ? 'noite' : 'noites'}, {reservation.numGuests} {reservation.numGuests === 1 ? 'hóspede' : 'hóspedes'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <BadgePercent className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Plataforma</h3>
                    <div>
                      <Badge variant="outline" className={platformColors[reservation.platform] || ""}>
                        {reservation.platform === "airbnb" && "Airbnb"}
                        {reservation.platform === "booking" && "Booking"}
                        {reservation.platform === "expedia" && "Expedia"}
                        {reservation.platform === "direct" && "Direto"}
                        {reservation.platform === "other" && "Outro"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ReceiptText className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Valores</h3>
                    <p className="text-secondary-900">
                      <span className="font-medium">Total:</span> {formatCurrency(Number(reservation.totalAmount))}
                    </p>
                    <p className="text-sm text-secondary-500">
                      <span className="font-medium">Taxa da Plataforma:</span> {formatCurrency(Number(reservation.platformFee))}
                    </p>
                    <p className="text-sm text-secondary-500">
                      <span className="font-medium">Valor Líquido:</span> {formatCurrency(Number(reservation.netAmount))}
                    </p>
                  </div>
                </div>
                
                {reservation.notes && (
                  <div className="flex items-start">
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700">Notas</h3>
                      <p className="text-sm text-secondary-700 mt-1">{reservation.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Custos e Valores</CardTitle>
            <CardDescription>Detalhes financeiros da reserva</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Valor Total</span>
                <span className="font-medium">{formatCurrency(Number(reservation.totalAmount))}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Taxa da Plataforma</span>
                <span className="font-medium text-red-600">-{formatCurrency(Number(reservation.platformFee))}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Custo de Limpeza</span>
                <span className="font-medium text-red-600">-{formatCurrency(Number(reservation.cleaningFee))}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Taxa de Check-in</span>
                <span className="font-medium text-red-600">-{formatCurrency(Number(reservation.checkInFee))}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Comissão</span>
                <span className="font-medium text-red-600">-{formatCurrency(Number(reservation.commissionFee))}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Pagamento Equipe</span>
                <span className="font-medium text-red-600">-{formatCurrency(Number(reservation.teamPayment))}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-medium text-secondary-800">Valor Líquido</span>
                <span className="font-medium text-lg text-green-600">{formatCurrency(Number(reservation.netAmount))}</span>
              </div>
            </div>
            
            {/* Property info */}
            {property && (
              <div className="mt-6 pt-4 border-t border-secondary-200">
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Informações da Propriedade</h3>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Custo de Limpeza</span>
                    <span>{formatCurrency(Number(property.cleaningCost))}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Taxa de Check-in</span>
                    <span>{formatCurrency(Number(property.checkInFee))}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Comissão</span>
                    <span>{Number(property.commission)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Pagamento Equipe</span>
                    <span>{formatCurrency(Number(property.teamPayment))}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Equipe de Limpeza</span>
                    <span>{property.cleaningTeam}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReservationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-10 w-32 mt-4 md:mt-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
