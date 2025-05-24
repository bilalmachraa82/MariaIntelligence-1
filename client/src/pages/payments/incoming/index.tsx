import { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BadgeDollarSign, 
  Euro,
  UserCog, 
  ArrowRight, 
  BuildingIcon,
  Search,
  ArrowUpCircle,
  ChevronDown,
  Mail,
  Phone,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReservations } from "@/hooks/use-reservations";
import { useProperties } from "@/hooks/use-properties";
import { useOwners } from "@/hooks/use-owners";
import { useTranslation } from "react-i18next";

export default function PaymentsIncoming() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOwner, setExpandedOwner] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Buscar dados reais da base de dados
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: owners, isLoading: isLoadingOwners } = useOwners();
  
  // Calcular pagamentos a receber baseados em dados reais
  const incomingPayments = useMemo(() => {
    if (!reservations || !properties || !owners) return [];
    
    // Agrupar reservas por proprietário e calcular valores devidos
    const ownerPayments = owners.map(owner => {
      const ownerProperties = properties.filter(prop => prop.ownerId === owner.id);
      const ownerReservations = reservations.filter(reservation => 
        ownerProperties.some(prop => prop.id === reservation.propertyId) &&
        ['confirmed', 'checked-in', 'completed'].includes(reservation.status)
      );
      
      const propertyPayments = ownerProperties.map(property => {
        const propReservations = ownerReservations.filter(res => res.propertyId === property.id);
        const totalRevenue = propReservations.reduce((sum, res) => sum + parseFloat(res.totalAmount || '0'), 0);
        const totalFees = propReservations.reduce((sum, res) => 
          sum + parseFloat(res.platformFee || '0') + parseFloat(res.cleaningFee || '0') + 
          parseFloat(res.checkInFee || '0') + parseFloat(res.commission || '0') + 
          parseFloat(res.teamPayment || '0'), 0
        );
        const netAmount = totalRevenue - totalFees;
        
        return {
          propertyId: property.id,
          propertyName: property.name,
          reservations: propReservations.length,
          totalRevenue,
          totalFees,
          netAmount,
          details: propReservations
        };
      }).filter(payment => payment.netAmount > 0);
      
      const totalDue = propertyPayments.reduce((sum, payment) => sum + payment.netAmount, 0);
      
      return {
        id: owner.id,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email || '',
        ownerPhone: owner.phone || '',
        totalDue,
        propertyPayments,
        status: totalDue > 0 ? 'pending' : 'paid'
      };
    }).filter(payment => payment.totalDue > 0);
    
    return ownerPayments;
  }, [reservations, properties, owners]);
  
  const isLoading = isLoadingReservations || isLoadingProperties || isLoadingOwners;
  
  // Filtrar pagamentos baseado na aba activa e pesquisa
  const filteredPayments = incomingPayments.filter(payment => {
    const matchesSearch = payment.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "pending" && payment.status === 'pending') ||
                      (activeTab === "paid" && payment.status === 'paid');
    return matchesSearch && matchesTab;
  });
  
  // Calcular totais
  const totalOwed = incomingPayments.reduce((sum, payment) => sum + payment.totalDue, 0);
  const pendingCount = incomingPayments.filter(p => p.status === 'pending').length;
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>A carregar dados financeiros...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-maria-primary">
            Pagamentos a Receber
          </h1>
          <p className="text-muted-foreground">
            Gerir pagamentos devidos pelos proprietários
          </p>
        </div>
        <Link href="/payments/incoming/new">
          <Button className="bg-maria-primary hover:bg-maria-primary/90">
            <Euro className="mr-2 h-4 w-4" />
            Novo Recebimento
          </Button>
        </Link>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Dívida</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-maria-primary">
              {formatCurrency(totalOwed)}
            </div>
            <p className="text-xs text-muted-foreground">
              De {incomingPayments.length} proprietário{incomingPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              A aguardar processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriedades Activas</CardTitle>
            <BuildingIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {properties?.filter(p => p.active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              A gerar receita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Pesquisa */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por proprietário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs de Status */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos ({incomingPayments.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingCount})</TabsTrigger>
          <TabsTrigger value="paid">Pagos (0)</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Euro className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'pending' ? 'Nenhum pagamento pendente' : 'Nenhum pagamento encontrado'}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'Todos os pagamentos estão em dia!' 
                    : 'Quando houver reservas confirmadas, os pagamentos aparecerão aqui.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id} className="w-full">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                      onClick={() => setExpandedOwner(expandedOwner === payment.id ? null : payment.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-maria-primary/10 p-2 rounded-full">
                            <UserCog className="h-5 w-5 text-maria-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{payment.ownerName}</CardTitle>
                            <CardDescription className="flex items-center space-x-4">
                              {payment.ownerEmail && (
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {payment.ownerEmail}
                                </span>
                              )}
                              {payment.ownerPhone && (
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {payment.ownerPhone}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-maria-primary">
                              {formatCurrency(payment.totalDue)}
                            </div>
                            <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                              {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                          <ChevronDown 
                            className={`h-5 w-5 transition-transform ${
                              expandedOwner === payment.id ? 'rotate-180' : ''
                            }`} 
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {payment.propertyPayments.map((propPayment) => (
                          <div key={propPayment.propertyId} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-semibold text-lg">{propPayment.propertyName}</h4>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {formatCurrency(propPayment.netAmount)}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {propPayment.reservations} reserva{propPayment.reservations !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Receita Total:</span>
                                <span className="ml-2 font-medium">{formatCurrency(propPayment.totalRevenue)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total de Taxas:</span>
                                <span className="ml-2 font-medium">{formatCurrency(propPayment.totalFees)}</span>
                              </div>
                            </div>
                            
                            {propPayment.details.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium mb-2">Detalhes das Reservas:</h5>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Hóspede</TableHead>
                                      <TableHead>Check-in</TableHead>
                                      <TableHead>Check-out</TableHead>
                                      <TableHead>Valor</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {propPayment.details.map((reservation) => (
                                      <TableRow key={reservation.id}>
                                        <TableCell>{reservation.guestName}</TableCell>
                                        <TableCell>{new Date(reservation.checkInDate).toLocaleDateString('pt-PT')}</TableCell>
                                        <TableCell>{new Date(reservation.checkOutDate).toLocaleDateString('pt-PT')}</TableCell>
                                        <TableCell>{formatCurrency(parseFloat(reservation.totalAmount || '0'))}</TableCell>
                                        <TableCell>
                                          <Badge variant={
                                            reservation.status === 'completed' ? 'default' : 
                                            reservation.status === 'confirmed' ? 'secondary' : 'outline'
                                          }>
                                            {reservation.status}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <CardFooter className="px-0 pt-4">
                        <div className="flex space-x-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              toast({
                                title: "Pagamento processado",
                                description: `Pagamento de ${formatCurrency(payment.totalDue)} marcado como pago.`,
                              });
                            }}
                          >
                            Marcar como Pago
                          </Button>
                          <Link href={`/reports/owner-report?ownerId=${payment.ownerId}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Ver Relatório
                            </Button>
                          </Link>
                        </div>
                      </CardFooter>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}