import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { 
  useFinancialDocumentItem,
  useUpdateFinancialDocumentItem
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

export default function EditDocumentItemPage() {
  const { t } = useTranslation();
  const [, params] = useRoute<{ id: string }>("/financial/documents/items/edit/:id");
  const [, navigate] = useLocation();
  
  const itemId = params ? parseInt(params.id) : undefined;
  
  // Carregar item existente
  const { 
    data: item, 
    isLoading: isLoadingItem,
    isError: isItemError
  } = useFinancialDocumentItem(itemId);
  
  // Estados para controlar seleções
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  // Carregar propriedades para o selector
  const { 
    data: propertiesData, 
    isLoading: isLoadingProperties 
  } = useProperties();
  
  // Carregar reservas da propriedade selecionada
  const { 
    data: reservationsData, 
    isLoading: isLoadingReservations 
  } = useReservations(selectedPropertyId ? parseInt(selectedPropertyId) : undefined);
  
  // Mutation para atualizar item
  const updateItemMutation = useUpdateFinancialDocumentItem();
  
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
  
  // Preencher formulário quando os dados do item forem carregados
  useEffect(() => {
    if (item) {
      form.reset({
        description: item.description,
        amount: item.amount,
        quantity: item.quantity ? item.quantity.toString() : "",
        unitValue: item.unitValue || "",
        propertyId: item.propertyId ? item.propertyId.toString() : "",
        reservationId: item.reservationId ? item.reservationId.toString() : "",
        taxRate: item.taxRate || "",
        notes: item.notes || "",
      });
      
      if (item.propertyId) {
        setSelectedPropertyId(item.propertyId.toString());
      }
    }
  }, [item, form]);
  
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
    if (!itemId) {
      toast({
        title: t("Erro"),
        description: t("ID do item não fornecido"),
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Converter valores para o formato esperado pela API
      const itemData = {
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
      await updateItemMutation.mutateAsync({
        id: itemId,
        data: itemData
      });
      
      // Mostrar mensagem de sucesso
      toast({
        title: t("Item atualizado"),
        description: t("O item foi atualizado com sucesso.")
      });
      
      // Redirecionar para a página de detalhes do documento
      if (item?.documentId) {
        navigate(`/financial/documents/${item.documentId}`);
      } else {
        navigate("/financial/documents");
      }
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      
      // Mostrar mensagem de erro
      toast({
        title: t("Erro ao atualizar item"),
        description: t("Ocorreu um erro ao atualizar o item. Verifique os dados e tente novamente."),
        variant: "destructive"
      });
    }
  };
  
  // Mostrar loading enquanto carrega
  if (isLoadingItem) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-xl">{t("Carregando item...")}</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Mostrar erro se não conseguir carregar
  if (isItemError || !item) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Erro ao carregar item")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("Não foi possível carregar os detalhes do item.")}
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
            <Link href={`/financial/documents/${item.documentId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Voltar para documento")}
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("Editar Item #{{id}}", { id: itemId })}
            </h1>
            <p className="text-muted-foreground">
              {t("Atualize os detalhes deste item do documento.")}
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
                  onClick={() => navigate(`/financial/documents/${item.documentId}`)}
                >
                  {t("Cancelar")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateItemMutation.isPending}
                >
                  {updateItemMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("Salvando...")}
                    </>
                  ) : t("Atualizar Item")}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Layout>
  );
}