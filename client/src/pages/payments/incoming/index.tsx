import { useState } from "react";
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
  UserCog, 
  ArrowRight, 
  Calendar, 
  BuildingIcon,
  Filter,
  Search,
  ArrowUpCircle,
  ChevronDown,
  Mail,
  Phone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PaymentsIncoming() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOwner, setExpandedOwner] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Dados mockup para a interface - em produção viriam da API
  const [incomingPayments, setMockData] = useState([
    {
      id: 1,
      ownerId: 1,
      ownerName: "Manuel Gomes",
      ownerEmail: "manuel.gomes@example.com",
      ownerPhone: "+351 912 345 678",
      totalDue: 1250.00,
      propertyPayments: [
        {
          id: 1,
          propertyId: 1,
          propertyName: "Apartamento Ajuda",
          amount: 750.00,
          type: "profit",
          month: "Março 2025",
          dueDate: "2025-04-10",
          status: "pending",
          periodStart: "2025-03-01",
          periodEnd: "2025-03-31"
        },
        {
          id: 2,
          propertyId: 2,
          propertyName: "Vila SJ Estoril",
          amount: 500.00,
          type: "profit",
          month: "Março 2025",
          dueDate: "2025-04-10",
          status: "pending",
          periodStart: "2025-03-01",
          periodEnd: "2025-03-31"
        }
      ]
    },
    {
      id: 2,
      ownerId: 2,
      ownerName: "Sofia Carvalho",
      ownerEmail: "sofia.carvalho@example.com",
      ownerPhone: "+351 965 432 109",
      totalDue: 320.00,
      propertyPayments: [
        {
          id: 3,
          propertyId: 3,
          propertyName: "Apartamento Cascais",
          amount: 320.00,
          type: "profit",
          month: "Março 2025",
          dueDate: "2025-04-15",
          status: "pending",
          periodStart: "2025-03-01",
          periodEnd: "2025-03-31"
        }
      ]
    },
    {
      id: 3,
      ownerId: 3,
      ownerName: "António Silva",
      ownerEmail: "antonio.silva@example.com",
      ownerPhone: "+351 936 789 012",
      totalDue: 0,
      propertyPayments: [
        {
          id: 4,
          propertyId: 4,
          propertyName: "Moradia Sintra",
          amount: 450.00,
          type: "profit",
          month: "Fevereiro 2025",
          dueDate: "2025-03-10",
          status: "paid",
          paidAt: "2025-03-08",
          periodStart: "2025-02-01",
          periodEnd: "2025-02-29"
        }
      ]
    }
  ]);
  
  // Função para traduzir o tipo
  const getStatusText = (status: string) => {
    return status === "paid" ? "Pago" : "Pendente";
  };
  
  // Função para calcular o valor total pendente
  const totalPendingAmount = incomingPayments.reduce((total, payment) => {
    return total + payment.totalDue;
  }, 0);
  
  // Função para filtrar os pagamentos
  const filteredPayments = incomingPayments.filter(payment => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.ownerName.toLowerCase().includes(searchLower) ||
        payment.ownerEmail.toLowerCase().includes(searchLower) ||
        payment.propertyPayments.some(p => p.propertyName.toLowerCase().includes(searchLower))
      );
    }
    return true;
  }).filter(payment => {
    if (activeTab === "pending") return payment.totalDue > 0;
    if (activeTab === "paid") return payment.totalDue === 0;
    return true;
  });
  
  // Toggle para expandir/colapsar os detalhes de um proprietário
  const toggleOwnerDetails = (ownerId: number) => {
    if (expandedOwner === ownerId) {
      setExpandedOwner(null);
    } else {
      setExpandedOwner(ownerId);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagamentos a Receber</h1>
          <p className="text-maria-gray">Valores a receber de proprietários</p>
        </div>
        <Link href="/payments/incoming/new">
          <Button className="mt-4 md:mt-0 bg-green-500 hover:bg-green-600 text-white">
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Novo Recebimento
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-maria-gray">Valor Pendente Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPendingAmount)}</div>
            <p className="text-xs text-maria-gray mt-1">
              De {incomingPayments.filter(p => p.totalDue > 0).length} proprietários
            </p>
          </CardContent>
        </Card>
        
        <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Pesquisar por proprietário ou propriedade..."
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
      </div>
      
      <Tabs defaultValue="all" className="mt-4" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todos ({incomingPayments.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({incomingPayments.filter(p => p.totalDue > 0).length})</TabsTrigger>
          <TabsTrigger value="paid">Recebidos ({incomingPayments.filter(p => p.totalDue === 0).length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-maria-gray">Nenhum pagamento encontrado para os filtros selecionados.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map(owner => (
              <Collapsible
                key={owner.id}
                open={expandedOwner === owner.id}
                onOpenChange={() => toggleOwnerDetails(owner.id)}
                className="payment-card"
              >
                <Card>
                  <CollapsibleTrigger className="w-full text-left">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <UserCog className="mr-2 h-5 w-5 text-green-600" />
                            {owner.ownerName}
                            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${expandedOwner === owner.id ? 'rotate-180' : ''}`} />
                          </CardTitle>
                          <CardDescription className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <span className="flex items-center">
                              <Mail className="mr-1 h-3 w-3" />
                              {owner.ownerEmail}
                            </span>
                            <span className="flex items-center">
                              <Phone className="mr-1 h-3 w-3" />
                              {owner.ownerPhone}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0 space-x-2">
                          <Badge variant="outline" className={owner.totalDue > 0 
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" 
                            : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          }>
                            {owner.totalDue > 0 ? "Pendente" : "Pago"}
                          </Badge>
                          
                          {owner.totalDue > 0 && (
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(owner.totalDue)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent>
                      <h3 className="text-sm font-semibold mb-2">Detalhes do Pagamento</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Propriedade</TableHead>
                            <TableHead>Período</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {owner.propertyPayments.map((payment, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <BuildingIcon className="mr-2 h-4 w-4 text-maria-primary" />
                                  {payment.propertyName}
                                </div>
                              </TableCell>
                              <TableCell>{payment.month}</TableCell>
                              <TableCell>
                                {new Date(payment.dueDate).toLocaleDateString('pt-PT')}
                              </TableCell>
                              <TableCell>{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>
                                <Badge className={payment.status === "paid" 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" 
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                                }>
                                  {getStatusText(payment.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {payment.status === "pending" ? (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Em produção, atualizaria via API
                                      const updatedPayments = owner.propertyPayments.map(p => 
                                        p.id === payment.id ? {...p, status: "paid", paidAt: new Date().toISOString()} : p
                                      );
                                      
                                      const updatedOwners = incomingPayments.map(o => 
                                        o.id === owner.id ? {...o, propertyPayments: updatedPayments} : o
                                      );
                                      
                                      setMockData(updatedOwners);
                                      
                                      toast({
                                        title: "Pagamento recebido",
                                        description: `Pagamento de ${formatCurrency(payment.amount)} marcado como recebido.`,
                                      });
                                    }}
                                  >
                                    Marcar como Recebido
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast({
                                        title: "Detalhes do pagamento",
                                        description: "Detalhes do pagamento serão exibidos em breve.",
                                      });
                                    }}
                                  >
                                    Ver Detalhes
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Relatório em preparação",
                            description: "O relatório será enviado por e-mail em breve.",
                          });
                        }}
                      >
                        Gerar Relatório
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={owner.totalDue === 0}
                        onClick={() => {
                          if (owner.totalDue > 0) {
                            // Em produção, atualizaria via API
                            const updatedPayments = owner.propertyPayments.map(p => 
                              p.status === "pending" ? {...p, status: "paid", paidAt: new Date().toISOString()} : p
                            );
                            
                            const updatedOwners = incomingPayments.map(o => 
                              o.id === owner.id ? {...o, propertyPayments: updatedPayments, totalDue: 0} : o
                            );
                            
                            setMockData(updatedOwners);
                            
                            toast({
                              title: "Pagamentos recebidos",
                              description: `Todos os pagamentos pendentes de ${owner.ownerName} foram marcados como recebidos.`,
                            });
                          }
                        }}
                      >
                        {owner.totalDue > 0 ? (
                          <>
                            <BadgeDollarSign className="mr-2 h-4 w-4" />
                            Registrar Pagamento Total
                          </>
                        ) : (
                          "Todos os pagamentos recebidos"
                        )}
                      </Button>
                    </CardFooter>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}