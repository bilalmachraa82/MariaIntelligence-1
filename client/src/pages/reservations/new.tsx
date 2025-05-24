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
  Upload,
  Camera
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
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function NewReservationPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // Estados para o formulário
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Hooks para dados
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const { data: enums, isLoading: enumsLoading } = useReservationEnums();
  const createReservation = useCreateReservation();

  // Filtrar propriedades ativas
  const activeProperties = properties.filter(p => p.active);

  // Configuração do formulário
  const form = useForm({
    resolver: zodResolver(extendedReservationSchema),
    defaultValues: {
      propertyId: 0,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      checkInDate: "",
      checkOutDate: "",
      totalAmount: "",
      platformFee: "0",
      cleaningFee: "0",
      checkInFee: "0",
      commissionFee: "0",
      teamPayment: "0",
      netAmount: "",
      numGuests: 1,
      numAdults: 1,
      numChildren: 0,
      source: "direct" as const,
      status: "pending" as const,
      notes: "",
      country: ""
    }
  });

  // Função para calcular valores automaticamente
  const calculateValues = () => {
    const totalAmount = parseFloat(form.getValues("totalAmount") || "0");
    const platformFee = parseFloat(form.getValues("platformFee") || "0");
    const cleaningFee = parseFloat(form.getValues("cleaningFee") || "0");
    const checkInFee = parseFloat(form.getValues("checkInFee") || "0");
    const commissionFee = parseFloat(form.getValues("commissionFee") || "0");
    const teamPayment = parseFloat(form.getValues("teamPayment") || "0");
    
    const netAmount = totalAmount - platformFee - cleaningFee - checkInFee - commissionFee - teamPayment;
    form.setValue("netAmount", netAmount.toFixed(2));
  };

  // Observar mudanças nos valores para recalcular
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && ["totalAmount", "platformFee", "cleaningFee", "checkInFee", "commissionFee", "teamPayment"].includes(name)) {
        calculateValues();
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Submissão do formulário
  const onSubmit = async (data: any) => {
    try {
      await createReservation.mutateAsync(data);
      toast({
        title: "Sucesso!",
        description: "Reserva criada com sucesso.",
      });
      setLocation("/reservations");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar reserva. Tente novamente.",
        variant: "destructive",
      });
    }
  };



  if (propertiesLoading || enumsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/reservations")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Reserva</h1>
          <p className="text-muted-foreground">Criar uma nova reserva no sistema</p>
        </div>
      </div>

      {/* Opção de Scanner */}
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation('/upload-pdf')}
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Usar Scanner de Documentos
        </Button>
      </div>

      {/* Formulário Manual */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informações da Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Propriedade */}
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propriedade *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma propriedade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activeProperties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nome do Hóspede */}
                <FormField
                  control={form.control}
                  name="guestName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Hóspede *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do hóspede" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email e Telefone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guestEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="email@exemplo.com" 
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
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="+351 000 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Check-in *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOutDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Check-out *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Número de Hóspedes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="numGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Hóspedes *</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="numAdults"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adultos</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5" />
                  Informações Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
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
                        <FormLabel>Valor Líquido</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field}
                            readOnly
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormDescription>
                          Calculado automaticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Taxas e Comissões */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="platformFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa da Plataforma</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cleaningFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Limpeza</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
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
                        <FormLabel>Taxa de Check-in</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commissionFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comissão</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="teamPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pagamento à Equipa</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a plataforma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="airbnb">Airbnb</SelectItem>
                            <SelectItem value="booking">Booking.com</SelectItem>
                            <SelectItem value="direct">Direto</SelectItem>
                            <SelectItem value="expedia">Expedia</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
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
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="no-show">Não compareceu</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País de Origem</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Portugal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações adicionais sobre a reserva..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <Card>
              <CardFooter className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/reservations")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createReservation.isPending}
                  className="flex items-center gap-2"
                >
                  {createReservation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Reserva
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
    </div>
  );
}