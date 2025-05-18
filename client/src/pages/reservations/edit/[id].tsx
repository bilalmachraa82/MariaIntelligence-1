import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useProperties } from "@/hooks/use-properties";
import { useReservationEnums } from "@/hooks/use-reservations";
import { useReservation, useUpdateReservation } from "@/hooks/use-reservations";
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
  FileText
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
import { useTranslation } from "react-i18next";

export default function ReservationEditPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { t } = useTranslation();
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>();
  const [calculatedCosts, setCalculatedCosts] = useState({
    cleaningFee: 0,
    checkInFee: 0,
    commissionFee: 0,
    teamPayment: 0,
    platformFee: 0,
    netAmount: 0
  });
  
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: enums, isLoading: isLoadingEnums } = useReservationEnums();
  const { data: reservation, isLoading: isLoadingReservation } = useReservation(Number(id));
  const updateReservation = useUpdateReservation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(extendedReservationSchema),
    defaultValues: {
      propertyId: 0,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      country: "",
      reference: "",
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 86400000), // tomorrow
      numAdults: 1,
      numChildren: 0,
      numGuests: 1,
      totalAmount: "0",
      status: "pending",
      platform: "direct",
      platformFee: "0",
      cleaningFee: "0",
      checkInFee: "0",
      commission: "0",
      teamPayment: "0",
      netAmount: "0",
      notes: "",
    },
  });
  
  // Preencher o formulário com os dados da reserva quando disponíveis
  useEffect(() => {
    if (reservation) {
      // Parse dates
      let checkInDate: Date;
      let checkOutDate: Date;
      
      try {
        checkInDate = new Date(reservation.checkInDate);
        checkOutDate = new Date(reservation.checkOutDate);
        
        // Verificar se as datas são válidas
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
          throw new Error("Data inválida");
        }
      } catch (error) {
        console.error("Erro ao converter datas:", error);
        checkInDate = new Date();
        checkOutDate = new Date(Date.now() + 86400000);
      }
      
      setSelectedPropertyId(reservation.propertyId);
      
      // Valores para numAdults e numChildren (com fallbacks)
      const numAdults = reservation.numAdults || 1;
      const numChildren = reservation.numChildren || 0;
      
      form.reset({
        propertyId: reservation.propertyId,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail || "",
        guestPhone: reservation.guestPhone || "",
        country: reservation.country || "",
        reference: reservation.reference || "",
        checkInDate,
        checkOutDate,
        numAdults,
        numChildren,
        numGuests: reservation.numGuests,
        totalAmount: reservation.totalAmount,
        status: reservation.status,
        platform: reservation.platform,
        platformFee: reservation.platformFee || "0",
        cleaningFee: reservation.cleaningFee || "0",
        checkInFee: reservation.checkInFee || "0",
        commission: reservation.commissionFee || "0",
        teamPayment: reservation.teamPayment || "0",
        netAmount: reservation.netAmount || "0",
        notes: reservation.notes || "",
      });
      
      // Atualizar os valores calculados
      const netAmount = calculateNetAmount(
        Number(reservation.totalAmount),
        Number(reservation.cleaningFee),
        Number(reservation.checkInFee),
        Number(reservation.commissionFee),
        Number(reservation.teamPayment),
        Number(reservation.platformFee)
      );
      
      setCalculatedCosts({
        cleaningFee: Number(reservation.cleaningFee) || 0,
        checkInFee: Number(reservation.checkInFee) || 0,
        commissionFee: Number(reservation.commissionFee) || 0,
        teamPayment: Number(reservation.teamPayment) || 0,
        platformFee: Number(reservation.platformFee) || 0,
        netAmount
      });
    }
  }, [reservation, form]);

  const onSubmit = async (data: any) => {
    try {
      // Calcular valor líquido final
      const netAmount = calculateNetAmount(
        Number(data.totalAmount),
        Number(data.cleaningFee),
        Number(data.checkInFee),
        Number(data.commission),
        Number(data.teamPayment),
        Number(data.platformFee)
      );
      
      data.netAmount = netAmount.toString();
      
      await updateReservation.mutateAsync({ id: Number(id), reservation: data });
      
      toast({
        title: "Reserva atualizada",
        description: "A reserva foi atualizada com sucesso.",
      });
      
      navigate("/reservations");
    } catch (error) {
      console.error("Error updating reservation:", error);
      toast({
        title: "Erro ao atualizar reserva",
        description: "Ocorreu um erro ao atualizar a reserva. Por favor, tente novamente.",
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
    
    setCalculatedCosts({
      cleaningFee,
      checkInFee,
      commissionFee,
      teamPayment,
      platformFee,
      netAmount
    });
    
    form.setValue("cleaningFee", cleaningFee.toString());
    form.setValue("checkInFee", checkInFee.toString());
    form.setValue("commission", commissionFee.toString());
    form.setValue("teamPayment", teamPayment.toString());
    form.setValue("netAmount", netAmount.toString());
  };
  
  // Calcular custos quando muda o valor total
  const updateTotalAmount = (totalAmount: string) => {
    const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
    if (!selectedProperty) return;
    
    const totalAmountNum = Number(totalAmount);
    const platformFee = Number(form.getValues("platformFee"));
    const cleaningFee = Number(form.getValues("cleaningFee"));
    const checkInFee = Number(form.getValues("checkInFee"));
    const commissionFee = (totalAmountNum * Number(selectedProperty.commission)) / 100;
    const teamPayment = Number(selectedProperty.teamPayment);
    
    const netAmount = calculateNetAmount(
      totalAmountNum,
      cleaningFee,
      checkInFee,
      commissionFee,
      teamPayment,
      platformFee
    );
    
    setCalculatedCosts({
      cleaningFee,
      checkInFee,
      commissionFee,
      teamPayment,
      platformFee,
      netAmount
    });
    
    form.setValue("commission", commissionFee.toString());
    form.setValue("netAmount", netAmount.toString());
  };
  
  // Update platform fee
  const updatePlatformFee = (platformFee: string) => {
    const platformFeeNum = Number(platformFee);
    const totalAmount = Number(form.getValues("totalAmount"));
    
    const netAmount = calculateNetAmount(
      totalAmount,
      calculatedCosts.cleaningFee,
      calculatedCosts.checkInFee,
      calculatedCosts.commissionFee,
      calculatedCosts.teamPayment,
      platformFeeNum
    );
    
    setCalculatedCosts(prev => ({
      ...prev,
      platformFee: platformFeeNum,
      netAmount
    }));
    
    form.setValue("netAmount", netAmount.toString());
  };
  
  // Função para definir a plataforma e atualizar a taxa da plataforma
  const setPlatform = (platform: string) => {
    form.setValue("platform", platform);
    
    // Definir taxa padrão baseada na plataforma
    let platformFee = "0";
    const totalAmount = Number(form.getValues("totalAmount"));
    
    if (platform === "airbnb") {
      platformFee = (totalAmount * 0.15).toString(); // 15% para Airbnb
    } else if (platform === "booking") {
      platformFee = (totalAmount * 0.12).toString(); // 12% para Booking
    } else if (platform === "expedia") {
      platformFee = (totalAmount * 0.1).toString(); // 10% para Expedia
    }
    
    form.setValue("platformFee", platformFee);
    updatePlatformFee(platformFee);
  };

  // Loading state
  if (isLoadingProperties || isLoadingEnums || isLoadingReservation) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/reservations")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Reserva não encontrada</CardTitle>
            <CardDescription>
              A reserva com o ID {id} não foi encontrada.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/reservations")}>
              Ver todas as reservas
            </Button>
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
          Editar Reserva
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Reserva</CardTitle>
              <CardDescription>
                Preencha os dados da reserva.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propriedade</FormLabel>
                      <Select
                        disabled={updateReservation.isPending}
                        value={field.value.toString()}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          updatePropertyCosts(Number(value));
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma propriedade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties?.map((property) => (
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        disabled={updateReservation.isPending}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="completed">Completada</SelectItem>
                          <SelectItem value="no-show">No-show</SelectItem>
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
                          disabled={updateReservation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referência</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Referência ou código da reserva"
                          {...field}
                          disabled={updateReservation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="numAdults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adultos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Número de adultos"
                          {...field}
                          disabled={updateReservation.isPending}
                          onChange={(e) => {
                            const adults = parseInt(e.target.value) || 1;
                            field.onChange(adults);
                            // Atualizar o total de hóspedes
                            const children = form.getValues("numChildren") || 0;
                            form.setValue("numGuests", adults + children);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="numChildren"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crianças</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Número de crianças"
                          {...field}
                          disabled={updateReservation.isPending}
                          onChange={(e) => {
                            const children = parseInt(e.target.value) || 0;
                            field.onChange(children);
                            // Atualizar o total de hóspedes
                            const adults = form.getValues("numAdults") || 1;
                            form.setValue("numGuests", adults + children);
                          }}
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
                      <FormLabel>Total Hóspedes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          disabled={true}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          disabled={updateReservation.isPending}
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
                          disabled={updateReservation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País de Origem</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="País do hóspede (opcional)"
                          {...field}
                          disabled={updateReservation.isPending}
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
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={updateReservation.isPending}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
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
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={updateReservation.isPending}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
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
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plataforma</FormLabel>
                      <Select
                        disabled={updateReservation.isPending}
                        value={field.value}
                        onValueChange={(value) => {
                          setPlatform(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma plataforma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="airbnb">Airbnb</SelectItem>
                          <SelectItem value="booking">Booking</SelectItem>
                          <SelectItem value="expedia">Expedia</SelectItem>
                          <SelectItem value="direct">Direto</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          disabled={updateReservation.isPending}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            updateTotalAmount(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Taxas e Custos</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cleaningFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa de Limpeza (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              disabled={updateReservation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="checkInFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa de Check-in (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              disabled={updateReservation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teamPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pagamento da Equipe (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              disabled={updateReservation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Taxas de Plataforma</h3>
                  <div className="space-y-4">
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
                              disabled={updateReservation.isPending}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                updatePlatformFee(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="commission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comissão (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              disabled={updateReservation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="netAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Líquido (€)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              disabled={true}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre a reserva (opcional)"
                        className="h-24"
                        disabled={updateReservation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/reservations")}
                disabled={updateReservation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={updateReservation.isPending}
              >
                {updateReservation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}