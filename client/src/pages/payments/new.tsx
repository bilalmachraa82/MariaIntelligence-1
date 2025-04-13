import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Building2, CalendarIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useProperties } from "@/hooks/use-properties";
import { useCreateFinancialDocument } from "@/hooks/use-financial-documents";
import { queryClient } from "@/lib/queryClient";

// Esquema de validação
const paymentFormSchema = z.object({
  recipient: z.string().min(3, { message: "Nome do destinatário é obrigatório" }),
  propertyId: z.string().min(1, { message: "Propriedade é obrigatória" }),
  amount: z.string().min(1, { message: "Valor é obrigatório" }),
  type: z.string().min(1, { message: "Tipo é obrigatório" }),
  dueDate: z.date({ required_error: "Data de vencimento é obrigatória" }),
  invoiceNumber: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "paid"], { required_error: "Status é obrigatório" }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function NewPaymentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Obter propriedades do banco de dados
  const { properties = [], isLoading: isLoadingProperties } = useProperties();
  
  // Mutation para criar documento financeiro
  const createFinancialDocument = useCreateFinancialDocument();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      recipient: "",
      propertyId: "",
      amount: "",
      type: "cleaning",
      invoiceNumber: "",
      description: "",
      status: "pending",
    }
  });

  const onSubmit = async (values: PaymentFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Valores do formulário:", values);
      
      // Criar documento financeiro (despesa)
      const documentData = {
        documentType: "expense",
        documentNumber: values.invoiceNumber || `EXP-${Date.now().toString().slice(-6)}`,
        amount: values.amount,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: values.dueDate.toISOString().split('T')[0],
        status: values.status,
        description: values.description || `Despesa: ${values.type}`,
        relatedEntityType: "property",
        relatedEntityId: parseInt(values.propertyId),
        pdfUrl: null,
        items: [
          {
            description: `${values.type === "cleaning" ? "Limpeza" : 
                          values.type === "maintenance" ? "Manutenção" : 
                          values.type === "commission" ? "Comissão" : 
                          values.type === "travel" ? "Deslocações" : "Outro"}`,
            quantity: 1,
            unitPrice: values.amount,
            totalPrice: values.amount,
            notes: values.description || ""
          }
        ]
      };
      
      await createFinancialDocument.mutateAsync(documentData);
      
      // Invalidar queries para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ["/api/financial-documents"] });
      
      toast({
        title: "Pagamento registrado com sucesso!",
        description: `Pagamento de ${formatCurrency(parseFloat(values.amount))} para ${values.recipient}.`,
      });
      
      navigate("/pagamentos/saida");
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro ao registrar pagamento",
        description: "Ocorreu um erro. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <Link href="/pagamentos/saida" className="inline-flex items-center text-maria-gray hover:text-maria-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Pagamentos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Novo Pagamento</h1>
        <p className="text-maria-gray">Registre um novo pagamento a ser efetuado</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Detalhes do Pagamento</CardTitle>
          <CardDescription>Preencha as informações do pagamento a ser efetuado</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="recipient" className="text-sm font-medium">Destinatário</label>
                <Input 
                  id="recipient" 
                  placeholder="Nome do destinatário" 
                  {...form.register("recipient")} 
                />
                {form.formState.errors.recipient && (
                  <p className="text-red-500 text-xs">{form.formState.errors.recipient.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="propertyId" className="text-sm font-medium">Propriedade</label>
                <Select 
                  onValueChange={(value) => form.setValue("propertyId", value)} 
                  defaultValue={form.getValues("propertyId")}
                >
                  <SelectTrigger id="propertyId">
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProperties ? (
                      <SelectItem value="loading" disabled>Carregando propriedades...</SelectItem>
                    ) : properties.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhuma propriedade encontrada</SelectItem>
                    ) : (
                      properties.map(property => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.propertyId && (
                  <p className="text-red-500 text-xs">{form.formState.errors.propertyId.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">Valor (€)</label>
                <Input 
                  id="amount" 
                  placeholder="0,00" 
                  {...form.register("amount")} 
                />
                {form.formState.errors.amount && (
                  <p className="text-red-500 text-xs">{form.formState.errors.amount.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Tipo</label>
                <Select 
                  onValueChange={(value) => form.setValue("type", value)} 
                  defaultValue="cleaning"
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Limpeza</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="commission">Comissão</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-red-500 text-xs">{form.formState.errors.type.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">Data de Vencimento</label>
                <div className="flex">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                          formatDate(date)
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => {
                          setDate(date);
                          form.setValue("dueDate", date as Date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {form.formState.errors.dueDate && (
                  <p className="text-red-500 text-xs">{form.formState.errors.dueDate.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="invoiceNumber" className="text-sm font-medium">Número da Fatura</label>
                <Input 
                  id="invoiceNumber" 
                  placeholder="Opcional" 
                  {...form.register("invoiceNumber")} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Descrição</label>
              <Textarea 
                id="description" 
                placeholder="Adicione detalhes sobre este pagamento" 
                {...form.register("description")} 
              />
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio h-4 w-4 text-green-600" 
                    value="pending" 
                    {...form.register("status")} 
                    defaultChecked 
                  />
                  <span>Pendente</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    className="form-radio h-4 w-4 text-green-600" 
                    value="paid" 
                    {...form.register("status")} 
                  />
                  <span>Pago</span>
                </label>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600 text-white" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}