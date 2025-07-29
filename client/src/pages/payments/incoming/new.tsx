import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define o schema de validação do formulário
const paymentFormSchema = z.object({
  ownerId: z.string().min(1, { message: "Selecione um proprietário" }),
  paymentDate: z.string().min(1, { message: "Informe a data de recebimento" }),
  paymentType: z.string().min(1, { message: "Selecione o tipo de recebimento" }),
  paymentMethod: z.string().min(1, { message: "Selecione o método de pagamento" }),
  amount: z.string().min(1, { message: "Informe o valor recebido" }),
  invoiceReference: z.string().optional(),
  description: z.string().optional(),
  attachFile: z.any().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function NewIncomingPaymentPage() {
  const [location, setLocation] = useState<"/payments/incoming">();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedPaymentType, setSelectedPaymentType] = useState("invoice");
  const [owners, setOwners] = useState([
    { id: "1", name: "Manuel Gomes", pendingAmount: 1250.00 },
    { id: "2", name: "Sofia Carvalho", pendingAmount: 320.00 },
    { id: "3", name: "António Silva", pendingAmount: 0 }
  ]);
  const [pendingInvoices, setPendingInvoices] = useState([
    { id: "1", ownerId: "1", reference: "INV-2025-001", amount: 750.00, dueDate: "2025-04-10", propertyName: "Apartamento Ajuda", month: "Março 2025" },
    { id: "2", ownerId: "1", reference: "INV-2025-002", amount: 500.00, dueDate: "2025-04-10", propertyName: "Vila SJ Estoril", month: "Março 2025" },
    { id: "3", ownerId: "2", reference: "INV-2025-003", amount: 320.00, dueDate: "2025-04-15", propertyName: "Apartamento Cascais", month: "Março 2025" }
  ]);
  
  const { toast } = useToast();
  
  // Configurar o formulário
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      ownerId: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentType: "invoice",
      paymentMethod: "bank_transfer",
      amount: "",
      invoiceReference: "",
      description: "",
    },
  });
  
  // Observar mudanças no proprietário selecionado
  const watchOwnerId = form.watch("ownerId");
  
  // Filtrar faturas pelo proprietário selecionado
  const filteredInvoices = pendingInvoices.filter(
    invoice => invoice.ownerId === watchOwnerId
  );
  
  // Obter o valor pendente total para o proprietário selecionado
  const selectedOwnerPendingAmount = owners.find(
    owner => owner.id === watchOwnerId
  )?.pendingAmount || 0;
  
  // Atualizar valor do formulário com base no proprietário selecionado
  useEffect(() => {
    if (watchOwnerId && selectedOwnerPendingAmount > 0) {
      form.setValue("amount", selectedOwnerPendingAmount.toString());
    } else {
      form.setValue("amount", "");
    }
  }, [watchOwnerId, selectedOwnerPendingAmount, form]);
  
  // Manipular envio do formulário
  const onSubmit = async (values: PaymentFormValues) => {
    setIsLoading(true);
    
    try {
      // Simular chamada à API para criar novo pagamento
      console.log("Dados do pagamento:", values);
      
      // Simular atraso de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Recebimento registrado com sucesso",
        description: "O pagamento foi registrado e as faturas foram atualizadas.",
      });
      
      // Redirecionar para a lista de pagamentos
      setLocation("/payments/incoming");
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro ao registrar recebimento",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => setLocation("/payments/incoming")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar Novo Recebimento</h1>
          <p className="text-maria-gray">Registre o recebimento de valores de proprietários</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Recebimento</CardTitle>
              <CardDescription>Preencha as informações do recebimento</CardDescription>
            </CardHeader>
            <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab}>
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Detalhes do Pagamento</TabsTrigger>
                  <TabsTrigger value="invoices">Faturas Relacionadas</TabsTrigger>
                </TabsList>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <TabsContent value="details">
                    <CardContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="ownerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proprietário</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um proprietário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {owners.map((owner) => (
                                  <SelectItem 
                                    key={owner.id} 
                                    value={owner.id}
                                    disabled={owner.pendingAmount === 0}
                                  >
                                    {owner.name} {owner.pendingAmount > 0 ? `(${formatCurrency(owner.pendingAmount)})` : "(Sem valores pendentes)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Recebimento</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Recebimento</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedPaymentType(value);
                              }}
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de recebimento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="invoice">Pagamento de Fatura</SelectItem>
                                <SelectItem value="advance">Adiantamento</SelectItem>
                                <SelectItem value="deposit">Depósito de Caução</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Pagamento</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o método de pagamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                                <SelectItem value="mbway">MB Way</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Recebido</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">€</span>
                                <Input 
                                  className="pl-8" 
                                  type="number" 
                                  step="0.01"
                                  {...field} 
                                  disabled={isLoading}
                                />
                              </div>
                            </FormControl>
                            {watchOwnerId && (
                              <FormDescription>
                                Valor pendente total: {formatCurrency(selectedOwnerPendingAmount)}
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="invoiceReference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referência da Fatura</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: INV-2025-001" 
                                {...field} 
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormDescription>
                              Em caso de pagamento parcial, indique a fatura específica
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Informações adicionais sobre o pagamento" 
                                {...field} 
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="invoices">
                    <CardContent className="pt-4">
                      {!watchOwnerId ? (
                        <Alert className="mb-4">
                          <AlertTitle>Selecione um proprietário</AlertTitle>
                          <AlertDescription>
                            Primeiro selecione um proprietário na aba "Detalhes do Pagamento" para ver as faturas pendentes.
                          </AlertDescription>
                        </Alert>
                      ) : filteredInvoices.length === 0 ? (
                        <Alert className="mb-4">
                          <AlertTitle>Sem faturas pendentes</AlertTitle>
                          <AlertDescription>
                            Este proprietário não possui faturas pendentes no momento.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Faturas Pendentes</h3>
                          <div className="space-y-2">
                            {filteredInvoices.map((invoice) => (
                              <Card key={invoice.id} className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium">{invoice.reference}</h4>
                                    <p className="text-sm text-gray-500">
                                      {invoice.propertyName} - {invoice.month}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-green-600">
                                      {formatCurrency(invoice.amount)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Vencimento: {formatDate(invoice.dueDate)}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </TabsContent>
                  
                  <CardFooter className="flex justify-between border-t p-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setLocation("/payments/incoming")}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !watchOwnerId || selectedOwnerPendingAmount === 0}
                      className="gap-2"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Registrar Recebimento
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Tabs>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Sobre este formulário</h3>
                <p className="text-sm text-gray-500">
                  Utilize este formulário para registrar recebimentos de proprietários.
                  Os valores registrados serão automaticamente vinculados às faturas pendentes.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-1">Tipos de Recebimento</h3>
                <ul className="text-sm text-gray-500 space-y-1 list-disc pl-4">
                  <li><span className="font-medium">Pagamento de Fatura:</span> Recebimento referente a fatura(s) emitida(s)</li>
                  <li><span className="font-medium">Adiantamento:</span> Valores recebidos antecipadamente</li>
                  <li><span className="font-medium">Depósito de Caução:</span> Valores de caução/garantia</li>
                  <li><span className="font-medium">Outro:</span> Outros tipos de recebimento</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-1">Dicas</h3>
                <ul className="text-sm text-gray-500 space-y-1 list-disc pl-4">
                  <li>Verifique se o valor recebido corresponde ao valor total pendente</li>
                  <li>Em caso de pagamento parcial, especifique a fatura correspondente</li>
                  <li>Anexe o comprovante de pagamento quando disponível</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}