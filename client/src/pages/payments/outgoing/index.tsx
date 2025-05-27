import { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Euro,
  Users, 
  ArrowRight, 
  Calendar, 
  Receipt,
  Building2,
  Brush,
  ArrowDownCircle,
  Filter,
  Search,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReservations } from "@/hooks/use-reservations";
import { useProperties } from "@/hooks/use-properties";

export default function PaymentsOutgoing() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Buscar dados reais da base de dados
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  
  // Calcular pagamentos a fazer baseados em dados reais
  const payments = useMemo(() => {
    if (!reservations || !properties) return [];
    
    const outgoingPayments: any[] = [];
    
    // Adicionar pagamentos para equipas de limpeza baseados em reservas completadas
    reservations
      .filter(reservation => reservation.status === 'completed')
      .forEach(reservation => {
        const property = properties.find(p => p.id === reservation.propertyId);
        if (!property) return;
        
        const teamPayment = parseFloat(reservation.teamPayment || '0');
        if (teamPayment > 0) {
          outgoingPayments.push({
            id: `cleaning-${reservation.id}`,
            recipient: `Equipa de Limpeza - ${property.name}`,
            type: "cleaning",
            propertyName: property.name,
            amount: teamPayment,
            dueDate: new Date(reservation.checkOutDate).toISOString().split('T')[0],
            status: "pending",
            invoiceNumber: `LMP-${reservation.id}`,
            createdAt: reservation.checkOutDate,
            reservationId: reservation.id
          });
        }
      });
    
    return outgoingPayments;
  }, [reservations, properties]);
  
  const isLoading = isLoadingReservations || isLoadingProperties;
  
  // Função para obter a cor do tipo de pagamento
  const getTypeColor = (type: string) => {
    switch (type) {
      case "cleaning":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300";
      case "maintenance":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300";
      case "commission":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };
  
  // Função para traduzir o tipo
  const getTypeText = (type: string) => {
    switch (type) {
      case "cleaning":
        return "Limpeza";
      case "maintenance":
        return "Manutenção";
      case "commission":
        return "Comissão";
      default:
        return type;
    }
  };
  
  // Função para filtrar os pagamentos
  const filteredPayments = payments.filter(payment => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.recipient.toLowerCase().includes(searchLower) ||
        payment.propertyName.toLowerCase().includes(searchLower) ||
        payment.invoiceNumber.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }).filter(payment => {
    if (activeTab === "pending") return payment.status === "pending";
    if (activeTab === "paid") return payment.status === "paid";
    return true;
  });
  
  // Função para obter o ícone com base no tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cleaning":
        return <Brush className="mr-2 h-4 w-4 text-blue-600" />;
      case "maintenance":
        return <Users className="mr-2 h-4 w-4 text-amber-600" />;
      default:
        return <Receipt className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagamentos a Efetuar</h1>
          <p className="text-maria-gray">Gerenciamento de todos os pagamentos pendentes e efetuados</p>
        </div>
        <Link href="/pagamentos/novo">
          <Button className="mt-4 md:mt-0 bg-green-500 hover:bg-green-600 text-white">
            <Euro className="mr-2 h-4 w-4" />
            Novo Pagamento
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Pesquisar por destinatário, propriedade ou número de fatura..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActiveTab("all")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("pending")}>Pendentes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("paid")}>Pagos</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Tabs defaultValue="all" className="mt-4" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos ({payments.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({payments.filter(p => p.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="paid">Pagos ({payments.filter(p => p.status === "paid").length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-maria-gray">Nenhum pagamento encontrado para os filtros selecionados.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map(payment => (
              <Card key={payment.id} className="payment-card overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {getTypeIcon(payment.type)}
                        {payment.recipient}
                      </CardTitle>
                      <CardDescription className="flex items-center">
                        <Building2 className="mr-1 h-3 w-3" />
                        {payment.propertyName} • {payment.invoiceNumber}
                      </CardDescription>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <Badge variant="outline" className={getTypeColor(payment.type)}>
                        {getTypeText(payment.type)}
                      </Badge>
                      <Badge className={payment.status === "paid" 
                        ? "ml-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                        : "ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                      }>
                        {payment.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-4 md:mb-0">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                      <div className="flex items-center text-xs text-maria-gray">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>
                          {payment.status === "paid" && payment.paidAt
                            ? `Pago em ${new Date(payment.paidAt).toLocaleDateString('pt-PT')}` 
                            : `Vencimento: ${new Date(payment.dueDate).toLocaleDateString('pt-PT')}`
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => toast({
                          title: "Ação em desenvolvimento",
                          description: "A visualização detalhada será disponibilizada em breve.",
                        })}
                      >
                        Ver Detalhes
                      </Button>
                      {payment.status === "pending" && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => {
                            toast({
                              title: "Pagamento confirmado",
                              description: `O pagamento de ${formatCurrency(payment.amount)} foi marcado como pago.`
                            });
                            
                            // Em produção atualizaria o estado
                            const updatedPayments = payments.map(p => 
                              p.id === payment.id ? {...p, status: "paid", paidAt: new Date().toISOString()} : p
                            );
                            setPayments(updatedPayments);
                          }}
                        >
                          <ArrowDownCircle className="mr-2 h-3 w-3" />
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}