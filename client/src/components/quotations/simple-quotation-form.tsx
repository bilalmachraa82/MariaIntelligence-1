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
    
    try {
      // Calcular preços fixos
      const duplexSurcharge = data.isDuplex ? "50" : "0";
      const bbqSurcharge = data.hasBBQ ? "30" : "0";
      const glassGardenSurcharge = data.hasGlassGarden ? "60" : "0";
      
      // Calcular preço base (€20 por 50m²)
      const basePrice = (Math.ceil(data.propertyArea / 50) * 20).toString();
      
      // Calcular preço adicional total
      const additionalPrice = (
        (data.isDuplex ? 50 : 0) +
        (data.hasBBQ ? 30 : 0) + 
        (data.hasGlassGarden ? 60 : 0)
      ).toString();
      
      // Calcular preço total
      const totalPrice = (
        parseInt(basePrice) + 
        parseInt(additionalPrice || "0")
      ).toString();
      
      // Objeto completo para envio ao servidor
      const submissionData = {
        ...data,
        basePrice,
        duplexSurcharge,
        bbqSurcharge,
        exteriorSurcharge: "0",
        glassGardenSurcharge,
        additionalSurcharges: additionalPrice,
        totalPrice,
        internalNotes: "",
      };
      
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
      console.error("Erro ao enviar orçamento:", error);
      console.error("Dados enviados:", data);
      
      // Extrair detalhes do erro para diagnóstico
      let errorMessage = t("quotation.saveError");
      const err = error as any; // Type assertion para evitar erros de tipagem
      if (err.response?.data?.message) {
        errorMessage = `${err.response.data.message}: ${JSON.stringify(err.response.data.errors || {})}`;
        console.error("Detalhes do erro:", err.response.data);
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