import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { 
  Building2, 
  Home, 
  Castle, 
  Hotel, 
  Euro, 
  CalendarRange
} from "lucide-react";

// Importar constantes para preços e tipos de propriedade
import { BASE_PRICES, EXTRA_PRICES, EXTERIOR_AREA_THRESHOLD, PROPERTY_TYPES } from "@/api/constants";

// Quotation form schema using zod - alinhado com o schema do servidor
const formSchema = z.object({
  // Informações do cliente
  clientName: z.string().min(2, {
    message: "Client name must be at least 2 characters."
  }),
  clientEmail: z.string().email({
    message: "Please enter a valid email address."
  }).optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  
  // Informações da propriedade - usando os mesmos valores do enum do banco de dados
  propertyType: z.enum(["apartment_t0t1", "apartment_t2", "apartment_t3", "apartment_t4", "apartment_t5", "house_v1", "house_v2", "house_v3", "house_v4", "house_v5"]),
  propertyAddress: z.string().default(""),
  propertyArea: z.coerce.number().min(1, {
    message: "Total area must be at least 1 square meter."
  }),
  exteriorArea: z.coerce.number().min(0).default(0),
  
  // Características da propriedade
  isDuplex: z.boolean().default(false),
  hasBBQ: z.boolean().default(false),
  hasGlassGarden: z.boolean().default(false), // No banco é hasGlassGarden, não hasGlassSurfaces
  
  // Preços - coercing para garantir compatibilidade com o schema no servidor
  basePrice: z.union([z.string(), z.number()]).transform(val => val.toString()),
  duplexSurcharge: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  bbqSurcharge: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  exteriorSurcharge: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  glassGardenSurcharge: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  additionalSurcharges: z.union([z.string(), z.number()]).transform(val => val.toString()).optional(),
  totalPrice: z.union([z.string(), z.number()]).transform(val => val.toString()),
  
  // Detalhes do orçamento
  validUntil: z.string(),
  notes: z.string().optional().or(z.literal('')),
  internalNotes: z.string().optional().or(z.literal('')),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
});

type FormValues = z.infer<typeof formSchema>;

interface QuotationFormProps {
  defaultValues?: any;
  onSuccess?: () => void;
  isEditing?: boolean;
}

export function QuotationForm({ defaultValues, onSuccess, isEditing = false }: QuotationFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate pricing
  const [basePrice, setBasePrice] = useState(0);
  const [additionalPrice, setAdditionalPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Default expiration date (30 days from now)
  const defaultExpirationDate = format(addDays(new Date(), 30), "yyyy-MM-dd");
  
  // Initialize form com valores compatíveis com o schema do servidor
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      // Informações do cliente
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      
      // Informações da propriedade
      propertyType: "apartment_t0t1",
      propertyAddress: "",
      propertyArea: 50, // Antes era totalArea
      exteriorArea: 0,
      
      // Características
      isDuplex: false,
      hasBBQ: false,
      hasGlassGarden: false, // Antes era hasGlassSurfaces
      
      // Preços
      basePrice: "20",
      duplexSurcharge: "0",
      bbqSurcharge: "0",
      exteriorSurcharge: "0",
      glassGardenSurcharge: "0",
      additionalSurcharges: "0",
      totalPrice: "20",
      
      // Detalhes do orçamento
      validUntil: defaultExpirationDate,
      notes: "",
      internalNotes: "",
      status: "draft",
    },
  });
  
  // Watch form values for price calculation
  const watchedValues = form.watch();
  
  // Calculate pricing based on form values
  useEffect(() => {
    // Obter o preço base a partir da constante BASE_PRICES
    const propertyType = watchedValues.propertyType;
    const calculatedBasePrice = BASE_PRICES[propertyType] || 47; // Valor padrão para T0/T1
    
    // Extrair parte do tipo de propriedade para exibição nos logs
    const baseTypeParts = propertyType.split('_');
    const baseType = baseTypeParts.length > 1 ? 
      baseTypeParts[1].toUpperCase().replace('T', 'T').replace('V', 'V') : 'Desconhecido';
    
    // Registra o tipo de propriedade para referência
    console.log(`Tipo de propriedade: ${baseType}, Preço Base: ${calculatedBasePrice}€`);
    setBasePrice(calculatedBasePrice);
    
    // Cálculo dos preços adicionais usando as constantes
    let calculatedAdditionalPrice = 0;
    
    // Exterior area > EXTERIOR_AREA_THRESHOLD: +EXTRA_PRICES.EXTERIOR_AREA
    if (watchedValues.exteriorArea > EXTERIOR_AREA_THRESHOLD) {
      calculatedAdditionalPrice += EXTRA_PRICES.EXTERIOR_AREA;
    }
    
    // Duplex: +EXTRA_PRICES.DUPLEX
    if (watchedValues.isDuplex) {
      calculatedAdditionalPrice += EXTRA_PRICES.DUPLEX;
    }
    
    // BBQ: +EXTRA_PRICES.BBQ
    if (watchedValues.hasBBQ) {
      calculatedAdditionalPrice += EXTRA_PRICES.BBQ;
    }
    
    // Glass garden: +EXTRA_PRICES.GLASS_GARDEN
    if (watchedValues.hasGlassGarden) {
      calculatedAdditionalPrice += EXTRA_PRICES.GLASS_GARDEN;
    }
    
    setAdditionalPrice(calculatedAdditionalPrice);
    setTotalPrice(calculatedBasePrice + calculatedAdditionalPrice);
    
  }, [watchedValues]);
  
  // Handle form submission - método simplificado
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    // Log do objeto recebido do formulário para diagnóstico
    console.log("Dados do formulário:", data);
    
    // Criamos um objeto completo para corresponder exatamente ao schema
    const submissionData = {
      // Campos obrigatórios
      clientName: data.clientName,
      status: data.status || "draft",
      propertyType: data.propertyType || "apartment_t0t1",
      totalPrice: totalPrice.toString(),
      basePrice: (basePrice || 20).toString(),
      
      // Campos com valores padrão
      clientEmail: data.clientEmail || "",
      clientPhone: data.clientPhone || "",
      propertyAddress: data.propertyAddress || "",
      propertyArea: data.propertyArea || 50,
      exteriorArea: data.exteriorArea || 0,
      
      // Características boolean
      isDuplex: Boolean(data.isDuplex),
      hasBBQ: Boolean(data.hasBBQ),
      hasGlassGarden: Boolean(data.hasGlassGarden),
      
      // Campos de preço - todos os valores de sobretaxas vêm das constantes
      duplexSurcharge: data.isDuplex ? EXTRA_PRICES.DUPLEX.toString() : "0",
      bbqSurcharge: data.hasBBQ ? EXTRA_PRICES.BBQ.toString() : "0",
      exteriorSurcharge: data.exteriorArea > EXTERIOR_AREA_THRESHOLD ? EXTRA_PRICES.EXTERIOR_AREA.toString() : "0",
      glassGardenSurcharge: data.hasGlassGarden ? EXTRA_PRICES.GLASS_GARDEN.toString() : "0",
      // O additionalSurcharges deve representar valores extras, não a soma dos outros adicionais
      additionalSurcharges: "0",
      
      // Campos opcionais
      notes: data.notes || "",
      internalNotes: data.internalNotes || "",
      validUntil: data.validUntil || format(addDays(new Date(), 30), "yyyy-MM-dd"),
      pdfPath: "",
    };
    
    // Log do objeto que será enviado para a API para diagnóstico
    console.log("Objeto de submissão:", submissionData);
    
    try {
      if (isEditing && defaultValues?.id) {
        // Update existing quotation
        await apiRequest(`/api/quotations/${defaultValues.id}`, {
          method: "PATCH",
          data: submissionData,
        });
      } else {
        // Create new quotation
        await apiRequest("/api/quotations", {
          method: "POST",
          data: submissionData,
        });
      }
      
      // Show success message
      toast({
        title: isEditing ? t("quotation.saved") : t("quotation.created"),
        description: isEditing ? t("quotation.saved") : t("quotation.createSuccess"),
        variant: "default",
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting quotation:", error);
      
      // Enhanced error logging
      if (typeof error === 'object' && error !== null) {
        try {
          console.error("Error details:", JSON.stringify(error, null, 2));
        } catch (jsonError) {
          console.error("Error details (non-stringifiable):", error);
        }
      } else {
        console.error("Error details:", error);
      }
      
      // Log submission data for debugging
      console.error("Submission data:", submissionData);
      
      // Show error message
      toast({
        title: t("common.error"),
        description: t("quotation.saveError"),
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
          {/* Client Information */}
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
                        <Input placeholder="John Doe" {...field} />
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
                          placeholder="john.doe@example.com" 
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
                          placeholder="+351 123 456 789" 
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
          
          {/* Property Information */}
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
                            <SelectValue placeholder={t("quotation.selectPropertyType")}>
                              {watchedValues.propertyType && (
                                <div className="flex items-center gap-2">
                                  {watchedValues.propertyType.startsWith("apartment_") && <Building2 className="h-4 w-4 text-blue-500" />}
                                  {watchedValues.propertyType.startsWith("house_") && <Home className="h-4 w-4 text-green-500" />}
                                  {watchedValues.propertyType === "apartment_t0t1" && <span>{t("quotation.propertyTypeApartmentT0T1")}</span>}
                                  {watchedValues.propertyType === "apartment_t2" && <span>{t("quotation.propertyTypeApartmentT2")}</span>}
                                  {watchedValues.propertyType === "apartment_t3" && <span>{t("quotation.propertyTypeApartmentT3")}</span>}
                                  {watchedValues.propertyType === "apartment_t4" && <span>{t("quotation.propertyTypeApartmentT4")}</span>}
                                  {watchedValues.propertyType === "apartment_t5" && <span>{t("quotation.propertyTypeApartmentT5") || "T5"}</span>}
                                  {watchedValues.propertyType === "house_v1" && <span>{t("quotation.propertyTypeHouseV1")}</span>}
                                  {watchedValues.propertyType === "house_v2" && <span>{t("quotation.propertyTypeHouseV2")}</span>}
                                  {watchedValues.propertyType === "house_v3" && <span>{t("quotation.propertyTypeHouseV3")}</span>}
                                  {watchedValues.propertyType === "house_v4" && <span>{t("quotation.propertyTypeHouseV4") || "V4"}</span>}
                                  {watchedValues.propertyType === "house_v5" && <span>{t("quotation.propertyTypeHouseV5") || "V5"}</span>}
                                </div>
                              )}
                            </SelectValue>
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
                        <FormLabel>{t("quotation.totalArea")} (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quotation.validUntil")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Campos extra de quartos/banheiros removidos pois não existem no schema de orçamentos */}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Features */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{t("quotation.additionalFeatures")}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                
                {/* Campo hasGarden removido pois não existe no schema de orçamentos */}
              </div>
              
              <div className="space-y-4">
                {/* Campo hasExteriorSpace removido pois não existe no schema de orçamentos */}
                
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
            </div>
          </CardContent>
        </Card>
        
        {/* Notes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{t("quotation.notes")}</h3>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={t("quotation.notesPlaceholder")}
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* Price Summary */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{t("quotation.priceSummary")}</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("quotation.basePrice")}:</span>
                <span>€{basePrice.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("quotation.additionalPrice")}:</span>
                <span>€{additionalPrice.toFixed(2)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-bold">
                <span>{t("quotation.totalPrice")}:</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") : isEditing ? t("common.update") : t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}