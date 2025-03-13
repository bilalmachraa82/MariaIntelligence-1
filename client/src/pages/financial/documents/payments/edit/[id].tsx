import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { 
  usePaymentRecord,
  useUpdatePaymentRecord
} from "@/hooks/use-financial-documents";
import { ArrowLeft, Loader2, Calendar, CreditCard, Landmark, Banknote } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Esquema de validação para o formulário de pagamento
const paymentFormSchema = z.object({
  paymentDate: z.date({
    required_error: "É necessário informar a data do pagamento."
  }),
  amount: z.string().regex(/^\d+(\.\d{0,2})?$/, "Formato inválido. Use: 0.00"),
  method: z.string().min(1, "Selecione um método de pagamento"),
  notes: z.string().optional(),
  externalReference: z.string().optional(),
});

// Tipo para os valores do formulário
type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function EditPaymentPage() {
  const { t } = useTranslation();
  const [, params] = useRoute<{ id: string }>("/financial/documents/payments/edit/:id");
  const [, navigate] = useLocation();
  
  const paymentId = params ? parseInt(params.id) : undefined;
  
  // Carregar pagamento existente
  const { 
    data: payment, 
    isLoading: isLoadingPayment,
    isError: isPaymentError
  } = usePaymentRecord(paymentId);
  
  // Mutation para atualizar pagamento
  const updatePaymentMutation = useUpdatePaymentRecord();
  
  // Definir métodos de pagamento disponíveis
  const paymentMethods = [
    { value: "pix", label: "PIX", icon: <Landmark className="h-4 w-4 mr-2" /> },
    { value: "bank_transfer", label: "Transferência Bancária", icon: <Landmark className="h-4 w-4 mr-2" /> },
    { value: "credit_card", label: "Cartão de Crédito", icon: <CreditCard className="h-4 w-4 mr-2" /> },
    { value: "debit_card", label: "Cartão de Débito", icon: <CreditCard className="h-4 w-4 mr-2" /> },
    { value: "cash", label: "Dinheiro", icon: <Banknote className="h-4 w-4 mr-2" /> },
    { value: "other", label: "Outro", icon: null },
  ];
  
  // Configurar formulário
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentDate: new Date(),
      amount: "",
      method: "pix",
      notes: "",
      externalReference: "",
    },
  });
  
  // Preencher formulário quando os dados do pagamento forem carregados
  useEffect(() => {
    if (payment) {
      form.reset({
        paymentDate: new Date(payment.paymentDate),
        amount: payment.amount,
        method: payment.method,
        notes: payment.notes || "",
        externalReference: payment.externalReference || "",
      });
    }
  }, [payment, form]);
  
  // Manipular envio do formulário
  const onSubmit = async (values: PaymentFormValues) => {
    if (!paymentId) {
      toast({
        title: t("Erro"),
        description: t("ID do pagamento não fornecido"),
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Converter valores para o formato esperado pela API
      const paymentData = {
        paymentDate: format(values.paymentDate, 'yyyy-MM-dd'),
        amount: values.amount,
        method: values.method,
        notes: values.notes || null,
        externalReference: values.externalReference || null,
      };
      
      // Enviar para a API
      await updatePaymentMutation.mutateAsync({
        id: paymentId,
        data: paymentData
      });
      
      // Mostrar mensagem de sucesso
      toast({
        title: t("Pagamento atualizado"),
        description: t("O pagamento foi atualizado com sucesso.")
      });
      
      // Redirecionar para a página de detalhes do documento
      navigate(`/financial/documents/${payment?.documentId}`);
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      
      // Mostrar mensagem de erro
      toast({
        title: t("Erro ao atualizar pagamento"),
        description: t("Ocorreu um erro ao atualizar o pagamento. Verifique os dados e tente novamente."),
        variant: "destructive"
      });
    }
  };
  
  // Mostrar loading enquanto carrega
  if (isLoadingPayment) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-xl">{t("Carregando pagamento...")}</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Mostrar erro se não conseguir carregar
  if (isPaymentError || !payment) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Erro ao carregar pagamento")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("Não foi possível carregar os detalhes do pagamento.")}
            </p>
            <Button asChild>
              <Link href="/financial/documents">{t("Voltar para documentos")}</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" className="mr-4">
            <Link href={`/financial/documents/${payment.documentId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Voltar para documento")}
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("Editar Pagamento #{{id}}", { id: paymentId })}
            </h1>
            <p className="text-muted-foreground">
              {t("Atualize os detalhes deste pagamento.")}
            </p>
          </div>
        </div>
        
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("Data do Pagamento")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>{t("Selecione uma data")}</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Valor do Pagamento")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Método de Pagamento")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Selecione um método de pagamento")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center">
                              {method.icon}
                              {method.label}
                            </div>
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
                name="externalReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Referência Externa (opcional)")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("Ex: Número de transação, ID de pagamento, etc.")} />
                    </FormControl>
                    <FormDescription>
                      {t("Identificador externo do pagamento, como número de transação bancária.")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Observações (opcional)")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("Informações adicionais sobre este pagamento...")}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate(`/financial/documents/${payment.documentId}`)}
                >
                  {t("Cancelar")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePaymentMutation.isPending}
                >
                  {updatePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Salvando...")}
                    </>
                  ) : t("Atualizar Pagamento")}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}