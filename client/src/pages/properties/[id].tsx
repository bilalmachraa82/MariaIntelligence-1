import { useParams, Link, useLocation } from "wouter";
import { useProperty } from "@/hooks/use-properties";
import { useOwner } from "@/hooks/use-owners";
import { useReservations } from "@/hooks/use-reservations";
import { usePropertyStatistics } from "@/hooks/use-properties";
import { 
  Calendar, 
  Edit, 
  Users, 
  Home, 
  SprayCan, 
  CreditCard, 
  Percent, 
  UserCog, 
  ArrowLeft, 
  BarChart 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, reservationStatusColors } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  
  const propertyId = id ? parseInt(id) : undefined;
  const { data: property, isLoading: isLoadingProperty } = useProperty(propertyId);
  const { data: owner, isLoading: isLoadingOwner } = useOwner(property?.ownerId);
  const { data: reservations, isLoading: isLoadingReservations } = useReservations(propertyId);
  const { data: statistics, isLoading: isLoadingStatistics } = usePropertyStatistics(propertyId);

  if (isLoadingProperty || isLoadingOwner) {
    return <PropertyDetailSkeleton />;
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Propriedade não encontrada</h2>
        <p className="text-secondary-600 mb-6">A propriedade que você está procurando não existe ou foi removida.</p>
        <Button onClick={() => navigate("/properties")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Propriedades
        </Button>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = [
    { name: 'Ocupado', value: statistics?.occupancyRate || 0 },
    { name: 'Disponível', value: 100 - (statistics?.occupancyRate || 0) }
  ];
  
  const COLORS = ['#0ea5e9', '#e2e8f0'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/properties")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-secondary-900">{property.name}</h2>
          {property.active ? (
            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Ativa</Badge>
          ) : (
            <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-200">Inativa</Badge>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <Link href={`/properties/edit/${property.id}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar Propriedade
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main property information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Detalhes da Propriedade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Home className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Nome</h3>
                    <p className="text-secondary-900">{property.name}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <UserCog className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Proprietário</h3>
                    <p className="text-secondary-900">
                      {isLoadingOwner ? (
                        <Skeleton className="h-4 w-32" />
                      ) : owner ? (
                        <Link href={`/owners/${owner.id}`}>
                          <a className="text-primary-600 hover:underline">{owner.name}</a>
                        </Link>
                      ) : (
                        "Proprietário não encontrado"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <SprayCan className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Equipe de Limpeza</h3>
                    <p className="text-secondary-900">{property.cleaningTeam || "Não especificado"}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Custo de Limpeza</h3>
                    <p className="text-secondary-900">{formatCurrency(Number(property.cleaningCost))}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Taxa de Check-in</h3>
                    <p className="text-secondary-900">{formatCurrency(Number(property.checkInFee))}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Percent className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Comissão</h3>
                    <p className="text-secondary-900">{Number(property.commission)}%</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-secondary-700">Pagamento da Equipe</h3>
                    <p className="text-secondary-900">{formatCurrency(Number(property.teamPayment))}</p>
                  </div>
                </div>
                
                {Number(property.monthlyFixedCost) > 0 && (
                  <div className="flex items-start">
                    <CreditCard className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700">Custo Fixo Mensal</h3>
                      <p className="text-secondary-900">{formatCurrency(Number(property.monthlyFixedCost))}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Estatísticas</CardTitle>
            <CardDescription>Nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStatistics ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-28 rounded-full mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : statistics ? (
              <div className="space-y-4">
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Receita Total</span>
                    <span className="font-medium">{formatCurrency(statistics.totalRevenue)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Custos Totais</span>
                    <span className="font-medium">{formatCurrency(statistics.totalCosts)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Lucro Líquido</span>
                    <span className="font-medium">{formatCurrency(statistics.netProfit)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Taxa de Ocupação</span>
                    <span className="font-medium">{Math.round(statistics.occupancyRate)}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600">Reservas</span>
                    <span className="font-medium">{statistics.reservationsCount}</span>
                  </div>
                </div>
                
                <Link href="/reports">
                  <Button variant="outline" className="w-full mt-4">
                    <BarChart className="mr-2 h-4 w-4" />
                    Ver Relatório Completo
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-center text-secondary-500 py-6">
                Sem dados estatísticos disponíveis
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Reservas</CardTitle>
            <CardDescription>Histórico de reservas para esta propriedade</CardDescription>
          </div>
          <Link href="/reservations/new">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Nova Reserva
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoadingReservations ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : reservations && reservations.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hóspede</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Hóspedes</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plataforma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <Link href={`/reservations/${reservation.id}`}>
                          <a className="text-primary-600 hover:underline">
                            {reservation.guestName}
                          </a>
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(reservation.checkInDate)}</TableCell>
                      <TableCell>{formatDate(reservation.checkOutDate)}</TableCell>
                      <TableCell>{reservation.numGuests}</TableCell>
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
                        <Badge variant="outline">
                          {reservation.platform === "airbnb" && "Airbnb"}
                          {reservation.platform === "booking" && "Booking"}
                          {reservation.platform === "expedia" && "Expedia"}
                          {reservation.platform === "direct" && "Direto"}
                          {reservation.platform === "other" && "Outro"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-secondary-300" />
              <h3 className="mt-4 text-lg font-medium text-secondary-900">Sem reservas</h3>
              <p className="mt-2 text-secondary-500">Esta propriedade ainda não possui reservas.</p>
              <Link href="/reservations/new">
                <Button className="mt-4">Criar Reserva</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PropertyDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
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
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-28 w-28 rounded-full mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
