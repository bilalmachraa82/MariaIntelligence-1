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
    // Base price calculation (€20 per 50m²)
    const basePriceRate = 20;
    const calculatedBasePrice = Math.ceil(watchedValues.totalArea / 50) * basePriceRate;
    setBasePrice(calculatedBasePrice);
    
    // Additional price calculation
    let calculatedAdditionalPrice = 0;
    
    // Exterior space > 15m²: +€10
    if (watchedValues.hasExteriorSpace && watchedValues.exteriorArea > 15) {
      calculatedAdditionalPrice += 10;
    }
    
    // Duplex: +€10
    if (watchedValues.isDuplex) {
      calculatedAdditionalPrice += 10;
    }
    
    // Apartment with BBQ: +€10
    if (watchedValues.propertyType.startsWith("apartment_") && watchedValues.hasBBQ) {
      calculatedAdditionalPrice += 10;
    }
    
    // Garden with glass to clean: +€10
    if (watchedValues.hasGarden && watchedValues.hasGlassSurfaces) {
      calculatedAdditionalPrice += 10;
    }
    
    setAdditionalPrice(calculatedAdditionalPrice);
    setTotalPrice(calculatedBasePrice + calculatedAdditionalPrice);
    
  }, [watchedValues]);
  
  // Handle form submission - método simplificado
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    // Criamos um objeto simples com dados básicos do orçamento
    const submissionData = {
      // Dados do cliente
      clientName: data.clientName,
      clientEmail: data.clientEmail || "",
      clientPhone: data.clientPhone || "",
      
      // Dados da propriedade
      propertyType: data.propertyType || "apartment_t0t1",
      propertyAddress: data.propertyAddress || "",
      propertyArea: data.propertyArea || data.totalArea || 50,
      exteriorArea: data.exteriorArea || 0,
      
      // Características
      isDuplex: Boolean(data.isDuplex),
      hasBBQ: Boolean(data.hasBBQ),
      hasGlassGarden: Boolean(data.hasGlassGarden || data.hasGlassSurfaces),
      
      // Preços - sempre usando string conforme esperado pelo schema
      basePrice: (basePrice || 20).toString(),
      duplexSurcharge: data.isDuplex ? "50" : "0",
      bbqSurcharge: data.hasBBQ ? "30" : "0",
      exteriorSurcharge: "0",
      glassGardenSurcharge: (data.hasGlassGarden || data.hasGlassSurfaces) ? "60" : "0",
      additionalSurcharges: additionalPrice.toString(),
      totalPrice: totalPrice.toString(),
      
      // Detalhes adicionais
      status: data.status || "draft",
      notes: data.notes || "",
      internalNotes: data.internalNotes || "",
      validUntil: data.validUntil || format(addDays(new Date(), 30), "yyyy-MM-dd"),
    };
    
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
                                  {watchedValues.propertyType === "house_v1" && <span>{t("quotation.propertyTypeHouseV1")}</span>}
                                  {watchedValues.propertyType === "house_v2" && <span>{t("quotation.propertyTypeHouseV2")}</span>}
                                  {watchedValues.propertyType === "house_v3" && <span>{t("quotation.propertyTypeHouseV3")}</span>}
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalArea"
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quotation.bedrooms")}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
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
                        <FormLabel>{t("quotation.bathrooms")}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                        <FormLabel>{t("quotation.hasGarden")}</FormLabel>
                        <FormDescription>
                          {t("quotation.hasGardenDescription")}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
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
                        <FormLabel>{t("quotation.hasExteriorSpace")}</FormLabel>
                        <FormDescription>
                          {t("quotation.hasExteriorSpaceDescription")}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {watchedValues.hasExteriorSpace && (
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
                )}
                
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
                        <FormLabel>{t("quotation.hasGlassSurfaces")}</FormLabel>
                        <FormDescription>
                          {t("quotation.hasGlassSurfacesDescription")}
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