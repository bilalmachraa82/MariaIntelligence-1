import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { addDays, format } from "date-fns";
import { Building2, Home, Euro } from "lucide-react";

// Importar constantes para preços e tipos de propriedade
import { BASE_PRICES, EXTRA_PRICES, EXTERIOR_AREA_THRESHOLD, PROPERTY_TYPES } from "@/api/constants";

// Esquema simplificado alinhado com o banco de dados
const formSchema = z.object({
  // Dados do cliente
  clientName: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  clientEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  clientPhone: z.string().optional().or(z.literal("")),
  
  // Dados da propriedade
  propertyType: z.enum([
    "apartment_t0t1", "apartment_t2", "apartment_t3", "apartment_t4", "apartment_t5", 
    "house_v1", "house_v2", "house_v3", "house_v4", "house_v5"
  ]),
  propertyAddress: z.string().optional().or(z.literal("")),
  propertyArea: z.coerce.number().min(1),
  bedrooms: z.coerce.number().min(1),
  bathrooms: z.coerce.number().min(1),
  exteriorArea: z.coerce.number().min(0).default(0),
  
  // Características
  isDuplex: z.boolean().default(false),
  hasBBQ: z.boolean().default(false),
  hasGlassGarden: z.boolean().default(false),
  
  // Preços
  basePrice: z.string().default("20"),
  totalPrice: z.string().default("20"),
  
  // Detalhes do orçamento
  notes: z.string().optional().or(z.literal("")),
  validUntil: z.string().default(() => format(addDays(new Date(), 30), "yyyy-MM-dd")),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
});

type FormValues = z.infer<typeof formSchema>;

interface SimpleQuotationFormProps {
  defaultValues?: any;
  onSuccess?: () => void;
  isEditing?: boolean;
}

export function SimpleQuotationForm({ defaultValues, onSuccess, isEditing = false }: SimpleQuotationFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Valores iniciais
  const defaultExpirationDate = format(addDays(new Date(), 30), "yyyy-MM-dd");
  
  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      propertyType: "apartment_t0t1",
      propertyAddress: "",
      propertyArea: 50,
      bedrooms: 1,
      bathrooms: 1,
      exteriorArea: 0,
      isDuplex: false,
      hasBBQ: false,
      hasGlassGarden: false,
      basePrice: "20",
      totalPrice: "20",
      notes: "",
      validUntil: defaultExpirationDate,
      status: "draft",
    },
  });
  
  // Função simplificada para envio do formulário
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // Inicializar variável fora do try/catch para poder acessá-la no bloco catch
    let submissionData: Record<string, any> = {};
    
    try {
      // Obter o preço base conforme o tipo de propriedade escolhido
      const basePriceValue = BASE_PRICES[data.propertyType] || 47; // Padrão para T0/T1 se não encontrar
      const basePrice = basePriceValue.toFixed(2);
      
      // Calcular preços extras fixos com valores da constante para garantir consistência
      const duplexSurcharge = data.isDuplex ? `${EXTRA_PRICES.DUPLEX}.00` : "0.00";
      const bbqSurcharge = data.hasBBQ ? `${EXTRA_PRICES.BBQ}.00` : "0.00";
      
      // Calcular sobretaxa para área exterior (apenas se acima do limite)
      const hasExteriorSurcharge = data.exteriorArea > EXTERIOR_AREA_THRESHOLD;
      const exteriorSurcharge = hasExteriorSurcharge ? `${EXTRA_PRICES.EXTERIOR_AREA}.00` : "0.00";
      
      // Sobretaxa para jardim de vidro
      const glassGardenSurcharge = data.hasGlassGarden ? `${EXTRA_PRICES.GLASS_GARDEN}.00` : "0.00";
      
      // Calcular o valor adicional total
      const additionalValue = (
        (data.isDuplex ? EXTRA_PRICES.DUPLEX : 0) +
        (data.hasBBQ ? EXTRA_PRICES.BBQ : 0) + 
        (hasExteriorSurcharge ? EXTRA_PRICES.EXTERIOR_AREA : 0) +
        (data.hasGlassGarden ? EXTRA_PRICES.GLASS_GARDEN : 0)
      );
      const additionalPrice = additionalValue.toFixed(2);
      
      // Calcular preço total
      const totalValue = basePriceValue + additionalValue;
      const totalPrice = totalValue.toFixed(2);
      
      // Objeto completo para envio ao servidor
      submissionData = {
        // Cópias explícitas de todos os campos para garantir formatação correta
        clientName: data.clientName,
        clientEmail: data.clientEmail || "",
        clientPhone: data.clientPhone || "",
        propertyType: data.propertyType,
        propertyAddress: data.propertyAddress || "",
        propertyArea: data.propertyArea,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        exteriorArea: data.exteriorArea,
        
        // Características booleanas
        isDuplex: Boolean(data.isDuplex),
        hasBBQ: Boolean(data.hasBBQ),
        hasGlassGarden: Boolean(data.hasGlassGarden),
        
        // Campos de preço (garantindo que sejam strings com formato decimal)
        basePrice,
        duplexSurcharge,
        bbqSurcharge,
        exteriorSurcharge: "0.00",
        glassGardenSurcharge,
        additionalSurcharges: additionalPrice,
        totalPrice,
        
        // Campos opcionais
        notes: data.notes || "",
        internalNotes: "",
        validUntil: data.validUntil,
        status: data.status || "draft",
      };
      
      console.log("Enviando dados de orçamento:", JSON.stringify(submissionData, null, 2));
      
      // Enviar ao servidor
      if (isEditing && defaultValues?.id) {
        await apiRequest(`/api/quotations/${defaultValues.id}`, {
          method: "PATCH",
          data: submissionData,
        });
      } else {
        await apiRequest("/api/quotations", {
          method: "POST",
          data: submissionData,
        });
      }
      
      // Mostrar mensagem de sucesso
      toast({
        title: isEditing ? t("quotation.updated") : t("quotation.created"),
        description: isEditing ? t("quotation.updateSuccess") : t("quotation.createSuccess"),
      });
      
      // Chamar callback se fornecido
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Verificar se temos dados básicos para diagnóstico
      if (Object.keys(submissionData).length === 0) {
        // Obter o preço base conforme o tipo de propriedade escolhido
        const basePriceValue = BASE_PRICES[data.propertyType] || 47;
        
        // Calcular o valor adicional total
        const hasExteriorSurcharge = data.exteriorArea > EXTERIOR_AREA_THRESHOLD;
        const additionalValue = (
          (data.isDuplex ? EXTRA_PRICES.DUPLEX : 0) +
          (data.hasBBQ ? EXTRA_PRICES.BBQ : 0) + 
          (hasExteriorSurcharge ? EXTRA_PRICES.EXTERIOR_AREA : 0) +
          (data.hasGlassGarden ? EXTRA_PRICES.GLASS_GARDEN : 0)
        );
        
        // Calcular preço total
        const totalValue = basePriceValue + additionalValue;
        
        // Se não temos dados de envio, criamos um objeto de diagnóstico com dados básicos
        submissionData = {
          ...data,
          basePrice: basePriceValue.toString(),
          totalPrice: totalValue.toString()
        };
      }
      
      console.error("Erro ao enviar orçamento:", error);
      console.error("Dados de formulário:", JSON.stringify(submissionData, null, 2));
      
      // Extrair detalhes do erro para diagnóstico
      let errorMessage = t("quotation.errorCreate");
      const err = error as any; // Type assertion para evitar erros de tipagem
      
      if (err.response?.data?.message) {
        console.error("Detalhes do erro:", err.response.data);
        
        // Mensagem de erro amigável para o usuário
        errorMessage = t("quotation.errorCreate");
        
        // Caso tenha erros de validação, exibir listagem simples
        if (err.response?.data?.errors) {
          const errorFields = Object.keys(err.response.data.errors)
            .filter(k => k !== '_errors')
            .join(', ');
            
          if (errorFields) {
            errorMessage += ` ${t("quotation.fieldsWithErrors")}: ${errorFields}`;
          }
        }
      }

      // Mostrar mensagem de erro detalhada
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações do cliente */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">{t("quotation.clientInfo")}</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quotation.clientName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("quotation.clientNamePlaceholder")} {...field} />
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
                      <FormLabel>{t("quotation.clientEmail")}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder={t("quotation.clientEmailPlaceholder")}
                          {...field} 
                          value={field.value || ""}
                        />
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
                      <FormLabel>{t("quotation.clientPhone")}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("quotation.clientPhonePlaceholder")}
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Informações da propriedade */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">{t("quotation.propertyDetails")}</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quotation.propertyType")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("quotation.selectPropertyType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartment_t0t1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span>{t("quotation.propertyTypeApartmentT0T1")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="apartment_t2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span>{t("quotation.propertyTypeApartmentT2")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="apartment_t3">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span>{t("quotation.propertyTypeApartmentT3")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="apartment_t4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span>{t("quotation.propertyTypeApartmentT4")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="apartment_t5">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span>{t("quotation.propertyTypeApartmentT5") || "T5"}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="house_v1">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-500" />
                              <span>{t("quotation.propertyTypeHouseV1")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="house_v2">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-500" />
                              <span>{t("quotation.propertyTypeHouseV2")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="house_v3">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-500" />
                              <span>{t("quotation.propertyTypeHouseV3")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="house_v4">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-500" />
                              <span>{t("quotation.propertyTypeHouseV4") || "V4"}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="house_v5">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-500" />
                              <span>{t("quotation.propertyTypeHouseV5") || "V5"}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quotation.propertyArea")} (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="exteriorArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quotation.exteriorArea")} (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quartos</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
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
                        <FormLabel>Banheiros</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="propertyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quotation.propertyAddress")}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("quotation.propertyAddressPlaceholder")}
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Características adicionais */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{t("quotation.additionalFeatures")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <FormLabel>{t("quotation.isDuplex")}</FormLabel>
                      <FormDescription>
                        {t("quotation.isDuplexDescription")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
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
                      <FormLabel>{t("quotation.hasBBQ")}</FormLabel>
                      <FormDescription>
                        {t("quotation.hasBBQDescription")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasGlassGarden"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("quotation.hasGlassGarden")}</FormLabel>
                      <FormDescription>
                        {t("quotation.hasGlassGardenDescription")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Detalhes adicionais */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{t("quotation.additionalDetails")}</h3>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quotation.validUntil")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t("quotation.validUntilDescription")}
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
                    <FormLabel>{t("quotation.notes")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("quotation.notesPlaceholder")}
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onSuccess}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") : isEditing ? t("common.update") : t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}