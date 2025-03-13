import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useProperties } from "@/hooks/use-properties";
import { useReservationEnums } from "@/hooks/use-reservations";
import { useCreateReservation } from "@/hooks/use-reservations";
import { extendedReservationSchema } from "@shared/schema";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar, 
  Users, 
  Building, 
  CircleDollarSign, 
  BadgePercent, 
  Mail, 
  Phone,
  FileText,
  Upload,
  Camera,
  FileUp,
  ImageIcon,
  FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn, calculateNetAmount, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePdfUpload } from "@/hooks/use-pdf-upload";
import { processReservationFile } from "@/lib/ocr";

export default function ReservationNewPage() {
  const [_, navigate] = useLocation();
  const { extractedData, clearExtractedData } = usePdfUpload();
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>();
  const [calculatedCosts, setCalculatedCosts] = useState({
    cleaningFee: 0,
    checkInFee: 0,
    commissionFee: 0,
    teamPayment: 0,
    platformFee: 0,
    netAmount: 0
  });
  
  // Estado para acompanhar os arquivos selecionados para upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: enums, isLoading: isLoadingEnums } = useReservationEnums();
  const createReservation = useCreateReservation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(extendedReservationSchema),
    defaultValues: {
      propertyId: 0,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 86400000), // tomorrow
      numGuests: 1,
      totalAmount: "0",
      status: "pending",
      platform: "direct",
      platformFee: "0",
      cleaningFee: "0",
      checkInFee: "0",
      commissionFee: "0",
      teamPayment: "0",
      netAmount: "0",
      notes: "",
    },
  });

  // Fill form with extracted OCR data if available
  useEffect(() => {
    if (extractedData) {
      form.reset({
        propertyId: extractedData.propertyId,
        guestName: extractedData.guestName,
        guestEmail: extractedData.guestEmail || "",
        guestPhone: extractedData.guestPhone || "",
        checkInDate: new Date(extractedData.checkInDate),
        checkOutDate: new Date(extractedData.checkOutDate),
        numGuests: extractedData.numGuests,
        totalAmount: extractedData.totalAmount.toString(),
        status: "confirmed",
        platform: extractedData.platform,
        platformFee: extractedData.platformFee.toString(),
        cleaningFee: extractedData.cleaningFee.toString(),
        checkInFee: extractedData.checkInFee.toString(),
        commissionFee: extractedData.commissionFee.toString(),
        teamPayment: extractedData.teamPayment.toString(),
        netAmount: calculateNetAmount(
          extractedData.totalAmount,
          extractedData.cleaningFee,
          extractedData.checkInFee,
          extractedData.commissionFee,
          extractedData.teamPayment,
          extractedData.platformFee
        ).toString(),
        notes: "Criado via extração de PDF",
      });
      
      setSelectedPropertyId(extractedData.propertyId);
      
      // Update calculated costs
      setCalculatedCosts({
        cleaningFee: extractedData.cleaningFee,
        checkInFee: extractedData.checkInFee,
        commissionFee: extractedData.commissionFee,
        teamPayment: extractedData.teamPayment,
        platformFee: extractedData.platformFee,
        netAmount: calculateNetAmount(
          extractedData.totalAmount,
          extractedData.cleaningFee,
          extractedData.checkInFee,
          extractedData.commissionFee,
          extractedData.teamPayment,
          extractedData.platformFee
        )
      });
      
      if (typeof clearExtractedData === 'function') {
        clearExtractedData();
      }
    }
  }, [extractedData, form, clearExtractedData]);

  const onSubmit = async (data: any) => {
    try {
      // Calculate net amount before submission
      const netAmount = calculateNetAmount(
        Number(data.totalAmount),
        Number(data.cleaningFee),
        Number(data.checkInFee),
        Number(data.commissionFee),
        Number(data.teamPayment),
        Number(data.platformFee)
      );
      
      data.netAmount = netAmount.toString();
      
      await createReservation.mutateAsync(data);
      
      toast({
        title: "Reserva criada",
        description: "A reserva foi criada com sucesso.",
      });
      
      navigate("/reservations");
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Erro ao criar reserva",
        description: "Ocorreu um erro ao criar a reserva. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Update costs when property changes
  const updatePropertyCosts = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
    
    const selectedProperty = properties?.find(p => p.id === propertyId);
    if (!selectedProperty) return;
    
    const totalAmount = Number(form.getValues("totalAmount"));
    const platformFee = Number(form.getValues("platformFee"));
    
    const cleaningFee = Number(selectedProperty.cleaningCost);
    const checkInFee = Number(selectedProperty.checkInFee);
    const commissionFee = (totalAmount * Number(selectedProperty.commission)) / 100;
    const teamPayment = Number(selectedProperty.teamPayment);
    
    const netAmount = calculateNetAmount(
      totalAmount,
      cleaningFee,
      checkInFee,
      commissionFee,
      teamPayment,
      platformFee
    );
    
    // Update form values
    form.setValue("cleaningFee", cleaningFee.toString());
    form.setValue("checkInFee", checkInFee.toString());
    form.setValue("commissionFee", commissionFee.toString());
    form.setValue("teamPayment", teamPayment.toString());
    form.setValue("netAmount", netAmount.toString());
    
    // Update calculated costs
    setCalculatedCosts({
      cleaningFee,
      checkInFee,
      commissionFee,
      teamPayment,
      platformFee,
      netAmount
    });
  };

  // Recalculate when amount or platformFee changes
  const recalculateNetAmount = () => {
    const totalAmount = Number(form.getValues("totalAmount"));
    const platformFee = Number(form.getValues("platformFee"));
    const cleaningFee = Number(form.getValues("cleaningFee"));
    const checkInFee = Number(form.getValues("checkInFee"));
    const commissionFee = Number(form.getValues("commissionFee"));
    const teamPayment = Number(form.getValues("teamPayment"));
    
    const netAmount = calculateNetAmount(
      totalAmount,
      cleaningFee,
      checkInFee,
      commissionFee,
      teamPayment,
      platformFee
    );
    
    form.setValue("netAmount", netAmount.toString());
    
    setCalculatedCosts(prev => ({
      ...prev,
      platformFee,
      netAmount
    }));
  };
  
  // Função para processar um arquivo (PDF ou imagem)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setSelectedFile(file);
    setIsProcessingFile(true);
    setProcessingError(null);
    
    try {
      const result = await processReservationFile(file);
      
      if (result?.extractedData) {
        // Preencher o formulário com os dados extraídos
        form.reset({
          propertyId: result.extractedData.propertyId,
          guestName: result.extractedData.guestName,
          guestEmail: result.extractedData.guestEmail || "",
          guestPhone: result.extractedData.guestPhone || "",
          checkInDate: new Date(result.extractedData.checkInDate),
          checkOutDate: new Date(result.extractedData.checkOutDate),
          numGuests: result.extractedData.numGuests,
          totalAmount: result.extractedData.totalAmount.toString(),
          status: "confirmed",
          platform: result.extractedData.platform,
          platformFee: result.extractedData.platformFee.toString(),
          cleaningFee: result.extractedData.cleaningFee.toString(),
          checkInFee: result.extractedData.checkInFee.toString(),
          commissionFee: result.extractedData.commissionFee.toString(),
          teamPayment: result.extractedData.teamPayment.toString(),
          netAmount: calculateNetAmount(
            result.extractedData.totalAmount,
            result.extractedData.cleaningFee,
            result.extractedData.checkInFee,
            result.extractedData.commissionFee,
            result.extractedData.teamPayment,
            result.extractedData.platformFee
          ).toString(),
          notes: `Criado via extração de ${file.type.includes('pdf') ? 'PDF' : 'imagem'}`,
        });
        
        setSelectedPropertyId(result.extractedData.propertyId);
        
        toast({
          title: "Dados extraídos com sucesso",
          description: `Os dados foram extraídos do ${file.type.includes('pdf') ? 'PDF' : 'imagem'} com sucesso.`,
        });
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      setProcessingError(error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo");
      
      toast({
        title: "Erro ao processar arquivo",
        description: "Não foi possível extrair os dados do arquivo. Tente novamente ou preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };
  
  // Função para lidar com a seleção de um arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };
  
  // Função para lidar com o drop de arquivo
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const isPending = createReservation.isPending;
  const isLoading = isLoadingProperties || isLoadingEnums;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/reservations")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <Skeleton className="h-8 w-48 ml-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/reservations")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold text-secondary-900 ml-2">
          Nova Reserva
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Nova Reserva</CardTitle>
          <CardDescription>
            Preencha os dados para cadastrar uma nova reserva ou importe de um documento
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">Formulário Manual</TabsTrigger>
              <TabsTrigger value="pdf">Processar PDF</TabsTrigger>
              <TabsTrigger value="image">Processar Imagem</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propriedade</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          updatePropertyCosts(Number(value));
                        }}
                        defaultValue={field.value.toString()}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma propriedade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties?.map(property => (
                            <SelectItem 
                              key={property.id} 
                              value={property.id.toString()}
                            >
                              {property.name}
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
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plataforma</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a plataforma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {enums?.reservationPlatform?.map(platform => (
                            <SelectItem key={platform} value={platform}>
                              {platform === "airbnb" && "Airbnb"}
                              {platform === "booking" && "Booking"}
                              {platform === "expedia" && "Expedia"}
                              {platform === "direct" && "Direto"}
                              {platform === "other" && "Outro"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="guestName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Hóspede</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome completo do hóspede"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Hóspedes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="guestEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Hóspede</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Email para contato (opcional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Hóspede</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Telefone para contato (opcional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="checkInDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Check-in</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
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
                  name="checkOutDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Check-out</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < new Date("1900-01-01") || 
                              date <= form.getValues("checkInDate")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            
                            // If a property is selected, recalculate commission
                            if (selectedPropertyId) {
                              const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
                              if (selectedProperty) {
                                const totalAmount = Number(e.target.value);
                                const commissionFee = (totalAmount * Number(selectedProperty.commission)) / 100;
                                form.setValue("commissionFee", commissionFee.toString());
                                
                                setCalculatedCosts(prev => ({
                                  ...prev,
                                  commissionFee
                                }));
                              }
                            }
                            
                            // Recalculate net amount
                            setTimeout(recalculateNetAmount, 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platformFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa da Plataforma (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            
                            // Recalculate net amount
                            setTimeout(recalculateNetAmount, 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status da Reserva</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {enums?.reservationStatus?.map(status => (
                          <SelectItem key={status} value={status}>
                            {status === "pending" && "Pendente"}
                            {status === "confirmed" && "Confirmada"}
                            {status === "cancelled" && "Cancelada"}
                            {status === "completed" && "Completada"}
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre a reserva"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
                <h3 className="text-sm font-medium text-secondary-700 mb-2">Resumo dos Custos</h3>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-secondary-500">Valor Total</p>
                      <p className="font-medium">{formatCurrency(Number(form.getValues("totalAmount")))}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Taxa da Plataforma</p>
                      <p className="font-medium text-red-600">-{formatCurrency(calculatedCosts.platformFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Custo de Limpeza</p>
                      <p className="font-medium text-red-600">-{formatCurrency(calculatedCosts.cleaningFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Taxa de Check-in</p>
                      <p className="font-medium text-red-600">-{formatCurrency(calculatedCosts.checkInFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Comissão</p>
                      <p className="font-medium text-red-600">-{formatCurrency(calculatedCosts.commissionFee)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Pagamento Equipe</p>
                      <p className="font-medium text-red-600">-{formatCurrency(calculatedCosts.teamPayment)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-secondary-200 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-secondary-700">Valor Líquido</p>
                      <p className="font-medium text-green-600">{formatCurrency(calculatedCosts.netAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => navigate("/reservations")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Reserva
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
        </TabsContent>

        <TabsContent value="pdf">
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-secondary-200 rounded-lg">
              <FileText className="h-12 w-12 text-secondary-400 mb-4" />
              <h3 className="text-xl font-medium text-secondary-900 mb-2">Upload de PDF</h3>
              <p className="text-secondary-500 text-center mb-4">
                Arraste e solte um arquivo PDF ou clique para selecionar
              </p>
              <Input 
                type="file" 
                accept=".pdf" 
                className="max-w-sm" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="image">
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-secondary-200 rounded-lg">
              <ImageIcon className="h-12 w-12 text-secondary-400 mb-4" />
              <h3 className="text-xl font-medium text-secondary-900 mb-2">Upload de Imagem</h3>
              <p className="text-secondary-500 text-center mb-4">
                Arraste e solte uma imagem ou clique para selecionar
              </p>
              <Input 
                type="file" 
                accept="image/*" 
                className="max-w-sm" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      </Card>
    </div>
  );
}
