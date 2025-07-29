import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useOwner, useCreateOwner, useUpdateOwner } from "@/hooks/use-owners";
import { extendedOwnerSchema } from "@shared/schema";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Building, 
  Phone, 
  Mail, 
  FileText, 
  MapPin 
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
import { useToast } from "@/hooks/use-toast";

export default function OwnerEditPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const ownerId = id ? parseInt(id) : undefined;
  const isEditMode = ownerId !== undefined;

  const { data: owner, isLoading: isLoadingOwner } = useOwner(ownerId);
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(extendedOwnerSchema),
    defaultValues: {
      name: "",
      company: "",
      address: "",
      taxId: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (owner && isEditMode) {
      form.reset({
        name: owner.name,
        company: owner.company || "",
        address: owner.address || "",
        taxId: owner.taxId || "",
        email: owner.email || "",
        phone: owner.phone || "",
      });
    }
  }, [owner, form, isEditMode]);

  const onSubmit = async (data: any) => {
    try {
      console.log("Submitting owner data:", data);
      
      if (isEditMode) {
        console.log("Updating existing owner with ID:", ownerId);
        const result = await updateOwner.mutateAsync({
          id: ownerId,
          data: data,
        });
        console.log("Update result:", result);
        
        toast({
          title: "Proprietário atualizado",
          description: "O proprietário foi atualizado com sucesso.",
        });
      } else {
        console.log("Creating new owner with data:", data);
        const result = await createOwner.mutateAsync(data);
        console.log("Creation result:", result);
        
        toast({
          title: "Proprietário criado",
          description: "O proprietário foi criado com sucesso.",
        });
      }
      
      navigate("/owners");
    } catch (error) {
      console.error("Error saving owner:", error);
      
      // Log detailed information about the error
      if (error.response) {
        console.error("Server response:", error.response.data);
        console.error("Status code:", error.response.status);
      }
      
      toast({
        title: "Erro ao salvar proprietário",
        description: "Ocorreu um erro ao salvar o proprietário. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingOwner && isEditMode;
  const isPending = createOwner.isPending || updateOwner.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/owners")}
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
          onClick={() => navigate("/owners")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold text-secondary-900 ml-2">
          {isEditMode ? "Editar Proprietário" : "Novo Proprietário"}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode 
              ? `Editar ${owner?.name || "Proprietário"}` 
              : "Cadastrar Novo Proprietário"
            }
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Atualize as informações do proprietário conforme necessário."
              : "Preencha os dados para cadastrar um novo proprietário."
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Proprietário</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome do proprietário"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Empresa ou negócio (opcional)"
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
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribuinte</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Número de contribuinte (opcional)"
                          {...field}
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Email para contato (opcional)"
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Telefone para contato (opcional)"
                          {...field}
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Morada</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Endereço completo (opcional)"
                        className="min-h-[100px]"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => navigate("/owners")}
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
                    Salvar Proprietário
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
