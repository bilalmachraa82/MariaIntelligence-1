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

// Quotation form schema using zod
const formSchema = z.object({
  clientName: z.string().min(2, {
    message: "Client name must be at least 2 characters."
  }),
  clientEmail: z.string().email({
    message: "Please enter a valid email address."
  }).optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  propertyType: z.enum(["apartment", "house", "villa", "studio"]),
  totalArea: z.coerce.number().min(1, {
    message: "Total area must be at least 1 square meter."
  }),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(0),
  isDuplex: z.boolean().default(false),
  hasExteriorSpace: z.boolean().default(false),
  exteriorArea: z.coerce.number().min(0).default(0),
  hasBBQ: z.boolean().default(false),
  hasGarden: z.boolean().default(false),
  hasGlassSurfaces: z.boolean().default(false),
  validUntil: z.string(),
  notes: z.string().optional(),
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
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      propertyType: "apartment",
      totalArea: 50,
      bedrooms: 1,
      bathrooms: 1,
      isDuplex: false,
      hasExteriorSpace: false,
      exteriorArea: 0,
      hasBBQ: false,
      hasGarden: false,
      hasGlassSurfaces: false,
      validUntil: defaultExpirationDate,
      notes: "",
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
    if (watchedValues.propertyType === "apartment" && watchedValues.hasBBQ) {
      calculatedAdditionalPrice += 10;
    }
    
    // Garden with glass to clean: +€10
    if (watchedValues.hasGarden && watchedValues.hasGlassSurfaces) {
      calculatedAdditionalPrice += 10;
    }
    
    setAdditionalPrice(calculatedAdditionalPrice);
    setTotalPrice(calculatedBasePrice + calculatedAdditionalPrice);
    
  }, [watchedValues]);
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Add pricing data to the submission
      const submissionData = {
        ...data,
        basePrice,
        additionalPrice,
        totalPrice,
      };
      
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
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting quotation:", error);
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
                                  {watchedValues.propertyType === "apartment" && <Building2 className="h-4 w-4 text-blue-500" />}
                                  {watchedValues.propertyType === "house" && <Home className="h-4 w-4 text-green-500" />}
                                  {watchedValues.propertyType === "villa" && <Castle className="h-4 w-4 text-amber-500" />}
                                  {watchedValues.propertyType === "studio" && <Hotel className="h-4 w-4 text-purple-500" />}
                                  <span>{t(`quotation.propertyType${watchedValues.propertyType.charAt(0).toUpperCase() + watchedValues.propertyType.slice(1)}`)}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartment">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span>{t("quotation.propertyTypeApartment")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="house">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-500" />
                              <span>{t("quotation.propertyTypeHouse")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="villa">
                            <div className="flex items-center gap-2">
                              <Castle className="h-4 w-4 text-amber-500" />
                              <span>{t("quotation.propertyTypeVilla")}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="studio">
                            <div className="flex items-center gap-2">
                              <Hotel className="h-4 w-4 text-purple-500" />
                              <span>{t("quotation.propertyTypeStudio")}</span>
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