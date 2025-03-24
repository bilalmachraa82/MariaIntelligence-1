import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { extendedQuotationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface QuotationFormProps {
  defaultValues?: any;
  onSuccess?: (data: any) => void;
  isEditing?: boolean;
}

export function QuotationForm({ defaultValues, onSuccess, isEditing = false }: QuotationFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Configurar formulário
  const form = useForm({
    resolver: zodResolver(extendedQuotationSchema),
    defaultValues: defaultValues || {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      status: "draft",
      propertyType: "apartment",
      totalArea: "",
      bedrooms: "",
      bathrooms: "",
      hasExteriorSpace: false,
      exteriorArea: "",
      isDuplex: false,
      hasBBQ: false,
      hasGarden: false,
      hasGlassSurfaces: false,
      basePrice: "",
      additionalPrice: "",
      totalPrice: "",
      notes: "",
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 15 dias a partir de hoje
    }
  });

  // Calcular o preço total baseado em características
  React.useEffect(() => {
    const calculateTotalPrice = () => {
      // Obter valores do formulário
      const basePrice = parseFloat(form.getValues('basePrice')) || 0;
      let additionalPrice = 0;
      
      // Regras de negócio para adicionar valores ao preço base
      // +€10 para espaços exteriores >15m²
      if (form.getValues('hasExteriorSpace') && parseFloat(form.getValues('exteriorArea')) > 15) {
        additionalPrice += 10;
      }
      
      // +€10 para propriedades duplex
      if (form.getValues('isDuplex')) {
        additionalPrice += 10;
      }
      
      // +€10 para apartamentos com churrasqueira
      if (form.getValues('hasBBQ')) {
        additionalPrice += 10;
      }
      
      // +€10 para jardins com vidros para limpar
      if (form.getValues('hasGarden') && form.getValues('hasGlassSurfaces')) {
        additionalPrice += 10;
      }
      
      const totalPrice = basePrice + additionalPrice;
      
      // Atualizar valores no formulário
      form.setValue('additionalPrice', additionalPrice.toString());
      form.setValue('totalPrice', totalPrice.toString());
    };
    
    // Calcular sempre que os campos relacionados mudarem
    calculateTotalPrice();
  }, [
    form.watch('basePrice'),
    form.watch('hasExteriorSpace'),
    form.watch('exteriorArea'),
    form.watch('isDuplex'),
    form.watch('hasBBQ'),
    form.watch('hasGarden'),
    form.watch('hasGlassSurfaces')
  ]);

  // Função para enviar o formulário
  const onSubmit = async (data: any) => {
    try {
      let response;
      
      if (isEditing && defaultValues?.id) {
        // Atualizar orçamento existente
        response = await apiRequest({
          url: `/api/quotations/${defaultValues.id}`,
          method: 'PATCH',
          data
        });
        
        toast({
          title: t('quotation.updated'),
          description: t('quotation.updateSuccess'),
          variant: "default"
        });
      } else {
        // Criar novo orçamento
        response = await apiRequest({
          url: "/api/quotations",
          method: 'POST',
          data
        });
        
        toast({
          title: t('quotation.created'),
          description: t('quotation.createSuccess'),
          variant: "default"
        });
      }
      
      // Invalidar queries para atualizar a lista de orçamentos
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      
      // Chamar callback de sucesso se existir
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Resetar formulário se for um novo orçamento
      if (!isEditing) {
        form.reset();
      }
    } catch (error: any) {
      console.error("Erro ao salvar orçamento:", error);
      toast({
        title: t('quotation.error'),
        description: error.message || t('quotation.saveError'),
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? t('quotation.editTitle') : t('quotation.newTitle')}</CardTitle>
        <CardDescription>{t('quotation.formDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('quotation.clientInfo')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.clientName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('quotation.clientNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.clientEmail')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('quotation.clientEmailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.clientPhone')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('quotation.clientPhonePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.status')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('quotation.selectStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{t('quotation.statusDraft')}</SelectItem>
                          <SelectItem value="sent">{t('quotation.statusSent')}</SelectItem>
                          <SelectItem value="accepted">{t('quotation.statusAccepted')}</SelectItem>
                          <SelectItem value="rejected">{t('quotation.statusRejected')}</SelectItem>
                          <SelectItem value="expired">{t('quotation.statusExpired')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator className="my-6" />
              
              <h3 className="text-lg font-medium">{t('quotation.propertyDetails')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.propertyType')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('quotation.selectPropertyType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartment">{t('quotation.propertyTypeApartment')}</SelectItem>
                          <SelectItem value="house">{t('quotation.propertyTypeHouse')}</SelectItem>
                          <SelectItem value="villa">{t('quotation.propertyTypeVilla')}</SelectItem>
                          <SelectItem value="commercial">{t('quotation.propertyTypeCommercial')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="totalArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.totalArea')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="80" {...field} />
                      </FormControl>
                      <FormDescription>m²</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.bedrooms')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.bathrooms')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isDuplex"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('quotation.isDuplex')}</FormLabel>
                        <FormDescription>
                          {t('quotation.isDuplexDescription')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hasExteriorSpace"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('quotation.hasExteriorSpace')}</FormLabel>
                        <FormDescription>
                          {t('quotation.hasExteriorSpaceDescription')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {form.watch('hasExteriorSpace') && (
                <div className="pl-6 border-l-2 border-gray-200 my-2">
                  <FormField
                    control={form.control}
                    name="exteriorArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quotation.exteriorArea')}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="20" {...field} />
                        </FormControl>
                        <FormDescription>m²</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="hasBBQ"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t('quotation.hasBBQ')}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hasGarden"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t('quotation.hasGarden')}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              
              {form.watch('hasGarden') && (
                <div className="pl-6 border-l-2 border-gray-200 my-2">
                  <FormField
                    control={form.control}
                    name="hasGlassSurfaces"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('quotation.hasGlassSurfaces')}</FormLabel>
                          <FormDescription>
                            {t('quotation.hasGlassSurfacesDescription')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <Separator className="my-6" />
              
              <h3 className="text-lg font-medium">{t('quotation.pricing')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.basePrice')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="80" {...field} />
                      </FormControl>
                      <FormDescription>€</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="additionalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.additionalPrice')}</FormLabel>
                      <FormControl>
                        <Input type="number" readOnly {...field} />
                      </FormControl>
                      <FormDescription>€ ({t('quotation.calculatedAutomatically')})</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quotation.totalPrice')}</FormLabel>
                      <FormControl>
                        <Input type="number" readOnly className="font-bold" {...field} />
                      </FormControl>
                      <FormDescription>€ ({t('quotation.calculatedAutomatically')})</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('quotation.validUntil')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>{t('quotation.validUntilDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('quotation.notes')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('quotation.notesPlaceholder')}
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="flex justify-between px-0">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => form.reset()}
              >
                {t('common.cancel')}
              </Button>
              
              <Button type="submit">
                {isEditing ? t('common.save') : t('common.create')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}