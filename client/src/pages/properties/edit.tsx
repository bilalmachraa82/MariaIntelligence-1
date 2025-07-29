import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useProperty, useCreateProperty, useUpdateProperty } from "@/hooks/use-properties";
import { useOwners } from "@/hooks/use-owners";
import { extendedPropertySchema } from "@shared/schema";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Home, 
  User, 
  Users, 
  Trash, 
  Plus, 
  CheckCircle 
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function PropertyEditPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const propertyId = id ? parseInt(id) : undefined;
  const isEditMode = propertyId !== undefined;

  const { data: property, isLoading: isLoadingProperty } = useProperty(propertyId);
  const { data: owners, isLoading: isLoadingOwners } = useOwners();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(extendedPropertySchema),
    defaultValues: {
      name: "",
      cleaningCost: 0,
      checkInFee: 0,
      commission: 0,
      teamPayment: 0,
      cleaningTeam: "",
      ownerId: 0,
      monthlyFixedCost: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (property && isEditMode) {
      form.reset({
        name: property.name,
        cleaningCost: Number(property.cleaningCost),
        checkInFee: Number(property.checkInFee),
        commission: Number(property.commission),
        teamPayment: Number(property.teamPayment),
        cleaningTeam: property.cleaningTeam,
        ownerId: property.ownerId,
        monthlyFixedCost: Number(property.monthlyFixedCost),
        active: property.active,
      });
    }
  }, [property, form, isEditMode]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditMode) {
        await updateProperty.mutateAsync({
          id: propertyId,
          data: {
            ...data,
            cleaningCost: String(data.cleaningCost),
            checkInFee: String(data.checkInFee),
            commission: String(data.commission),
            teamPayment: String(data.teamPayment),
            monthlyFixedCost: String(data.monthlyFixedCost),
          },
        });
        toast({
          title: "Propriedade atualizada",
          description: "A propriedade foi atualizada com sucesso.",
        });
      } else {
        await createProperty.mutateAsync({
          ...data,
          cleaningCost: String(data.cleaningCost),
          checkInFee: String(data.checkInFee),
          commission: String(data.commission),
          teamPayment: String(data.teamPayment),
          monthlyFixedCost: String(data.monthlyFixedCost),
        });
        toast({
          title: "Propriedade criada",
          description: "A propriedade foi criada com sucesso.",
        });
      }
      
      navigate("/properties");
    } catch (error) {
      console.error("Error saving property:", error);
      toast({
        title: "Erro ao salvar propriedade",
        description: "Ocorreu um erro ao salvar a propriedade. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingProperty || isLoadingOwners;
  const isPending = createProperty.isPending || updateProperty.isPending;

  if (isLoading && isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/properties")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <Skeleton className="h-8 w-64 ml-2" />
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
          onClick={() => navigate("/properties")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold text-secondary-900 ml-2">
          {isEditMode ? "Editar Propriedade" : "Nova Propriedade"}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode 
              ? `Editar ${property?.name || "Propriedade"}` 
              : "Cadastrar Nova Propriedade"
            }
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Atualize as informações da propriedade conforme necessário."
              : "Preencha os dados para cadastrar uma nova propriedade."
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Propriedade</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome da propriedade"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proprietário</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value.toString()}
                        disabled={isPending || isLoadingOwners}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um proprietário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {owners?.map(owner => (
                            <SelectItem 
                              key={owner.id} 
                              value={owner.id.toString()}
                            >
                              {owner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs" 
                          type="button"
                          onClick={() => navigate("/owners/edit")}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Cadastrar novo proprietário
                        </Button>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cleaningCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo de Limpeza (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isPending}
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
                          placeholder="0"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isPending}
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
                  name="commission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comissão (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isPending}
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
                          placeholder="0"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isPending}
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
                  name="cleaningTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipe de Limpeza</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome da equipe de limpeza"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyFixedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Fixo Mensal (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Propriedade Ativa</FormLabel>
                      <FormDescription>
                        Propriedades inativas não serão exibidas nos relatórios.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => navigate("/properties")}
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
                    Salvar Propriedade
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
