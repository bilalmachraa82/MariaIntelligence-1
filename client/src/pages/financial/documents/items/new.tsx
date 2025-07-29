import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { 
  useFinancialDocument, 
  useCreateFinancialDocumentItem 
} from "@/hooks/use-financial-documents";
import { useProperties } from "@/hooks/use-properties";
import { useReservations } from "@/hooks/use-reservations";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

// Esquema de validação para o formulário de item
const itemFormSchema = z.object({
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  amount: z.string().regex(/^\d+(\.\d{0,2})?$/, "Formato inválido. Use: 0.00"),
  quantity: z.string().regex(/^\d+(\.\d{0,2})?$/, "Formato inválido. Use: 0.00").optional(),
  unitValue: z.string().regex(/^\d+(\.\d{0,2})?$/, "Formato inválido. Use: 0.00").optional(),
  propertyId: z.string().optional(),
  reservationId: z.string().optional(),
  taxRate: z.string().regex(/^\d+(\.\d{0,2})?$/, "Formato inválido. Use: 0.00").optional(),
  notes: z.string().optional(),
});

// Tipo para os valores do formulário
type ItemFormValues = z.infer<typeof itemFormSchema>;

export default function NewDocumentItemPage() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  
  // Extrair documentId da query string
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const documentId = parseInt(searchParams.get('documentId') || '0');
  
  // Carregar documento financeiro relacionado
  const { 
    data: documentData, 
    isLoading: isLoadingDocument,
    isError: isDocumentError
  } = useFinancialDocument(documentId || undefined);
  
  // Carregar propriedades para o selector
  const { 
    data: propertiesData, 
    isLoading: isLoadingProperties 
  } = useProperties();
  
  // Estados para controlar seleções
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  // Carregar reservas da propriedade selecionada
  const { 
    data: reservationsData, 
    isLoading: isLoadingReservations 
  } = useReservations(selectedPropertyId ? parseInt(selectedPropertyId) : undefined);
  
  // Mutation para criar item
  const createItemMutation = useCreateFinancialDocumentItem();
  
  // Configurar formulário
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      quantity: "",
      unitValue: "",
      propertyId: "",
      reservationId: "",
      taxRate: "",
      notes: "",
    },
  });
  
  // Observar mudanças em quantidade e valor unitário
  useEffect(() => {
    const quantity = form.watch("quantity");
    const unitValue = form.watch("unitValue");
    
    if (quantity && unitValue) {
      const qtyNum = parseFloat(quantity);
      const valNum = parseFloat(unitValue);
      if (!isNaN(qtyNum) && !isNaN(valNum)) {
        const total = (qtyNum * valNum).toFixed(2);
        form.setValue("amount", total);
      }
    }
  }, [form.watch("quantity"), form.watch("unitValue")]);
  
  // Atualizar seleção de propriedade
  const handlePropertyChange = (value: string) => {
    setSelectedPropertyId(value);
    form.setValue("propertyId", value);
    form.setValue("reservationId", "");
  };
  
  // Manipular envio do formulário
  const onSubmit = async (values: ItemFormValues) => {
    if (!documentId) {
      toast({
        title: t("Erro"),
        description: t("ID do documento não fornecido"),
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Converter valores para o formato esperado pela API
      const itemData = {
        documentId,
        description: values.description,
        amount: values.amount,
        quantity: values.quantity ? parseFloat(values.quantity) : null,
        unitValue: values.unitValue || null,
        propertyId: values.propertyId ? parseInt(values.propertyId) : null,
        reservationId: values.reservationId ? parseInt(values.reservationId) : null,
        taxRate: values.taxRate || null,
        notes: values.notes || null,
      };
      
      // Enviar para a API
      await createItemMutation.mutateAsync(itemData);
      
      // Mostrar mensagem de sucesso
      toast({
        title: t("Item adicionado"),
        description: t("O item foi adicionado ao documento com sucesso.")
      });
      
      // Redirecionar para a página de detalhes do documento
      navigate(`/financial/documents/${documentId}`);
    } catch (error) {
      console.error("Erro ao criar item:", error);
      
      // Mostrar mensagem de erro
      toast({
        title: t("Erro ao adicionar item"),
        description: t("Ocorreu um erro ao adicionar o item. Verifique os dados e tente novamente."),
        variant: "destructive"
      });
    }
  };
  
  // Verificar se o ID do documento é válido
  if (!documentId) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Documento não especificado")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("É necessário especificar um documento financeiro para adicionar um item.")}
            </p>
            <Button asChild>
              <Link href="/financial/documents">{t("Ir para documentos")}</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Mostrar loading enquanto carrega o documento
  if (isLoadingDocument) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-xl">{t("Carregando documento...")}</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Verificar erro ao carregar documento
  if (isDocumentError || !documentData?.document) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Erro ao carregar documento")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("Não foi possível carregar os detalhes do documento financeiro.")}
            </p>
            <Button asChild>
              <Link href="/financial/documents">{t("Voltar para lista")}</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Extrair documento
  const document = documentData.document;

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" className="mr-4">
            <Link href={`/financial/documents/${documentId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Voltar para documento")}
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("Adicionar Item ao Documento #{{id}}", { id: documentId })}
            </h1>
            <p className="text-muted-foreground">
              {document?.type === 'incoming' ? 
                t("Adicione um item de receita a este documento.") : 
                t("Adicione um item de despesa a este documento.")}
            </p>
          </div>
        </div>
        
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Descrição")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t("Descreva o item de forma clara e objetiva.")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Quantidade")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unitValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Valor Unitário")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Valor Total")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Propriedade (opcional)")}</FormLabel>
                      <Select 
                        onValueChange={handlePropertyChange}
                        value={field.value}
                        disabled={isLoadingProperties}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Selecione uma propriedade")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">{t("Nenhuma")}</SelectItem>
                          {propertiesData?.map(property => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("Associe este item a uma propriedade específica.")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reservationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Reserva (opcional)")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedPropertyId || isLoadingReservations}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Selecione uma reserva")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">{t("Nenhuma")}</SelectItem>
                          {reservationsData?.map(reservation => (
                            <SelectItem key={reservation.id} value={reservation.id.toString()}>
                              {`${new Date(reservation.checkInDate).toLocaleDateString()} - ${reservation.guestName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedPropertyId ? 
                          t("Associe este item a uma reserva específica.") : 
                          t("Selecione uma propriedade primeiro para ver as reservas.")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Taxa de Imposto (opcional)")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0.00" />
                    </FormControl>
                    <FormDescription>
                      {t("Taxa de imposto aplicável a este item (se houver).")}
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
                        placeholder={t("Informações adicionais sobre este item...")}
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
                  onClick={() => navigate(`/financial/documents/${documentId}`)}
                >
                  {t("Cancelar")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createItemMutation.isPending}
                >
                  {createItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Salvando...")}
                    </>
                  ) : t("Adicionar Item")}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}