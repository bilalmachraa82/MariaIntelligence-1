import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Building2, ClipboardList, Wrench, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProperties } from "@/hooks/use-properties";

// Esquema de validação do formulário
const maintenanceRequestSchema = z.object({
  propertyId: z.string().min(1, { message: "Selecione uma propriedade" }),
  title: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }).max(100),
  description: z.string().min(10, { message: "Descrição deve ter pelo menos 10 caracteres" }).max(500),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Selecione a prioridade",
  }),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
  dueDate: z.string().min(1, { message: "Selecione uma data limite" }),
  needsPropertyAccess: z.boolean().default(false),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  budget: z.string().optional(),
});

// Tipo do formulário
type MaintenanceRequestForm = z.infer<typeof maintenanceRequestSchema>;

export default function MaintenanceRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  const { data: properties, isLoading: propertiesLoading } = useProperties();

  // Configuração do formulário
  const form = useForm<MaintenanceRequestForm>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      propertyId: "",
      title: "",
      description: "",
      priority: "medium",
      category: "",
      dueDate: "",
      needsPropertyAccess: false,
      contactPerson: "",
      contactPhone: "",
      budget: "",
    },
  });

  // Função para enviar o formulário
  const onSubmit = async (values: MaintenanceRequestForm) => {
    setIsSubmitting(true);
    
    try {
      // Em produção, enviaria para a API
      console.log("Solicitação de manutenção:", values);
      
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Solicitação enviada",
        description: "A solicitação de manutenção foi registrada com sucesso.",
      });
      
      // Navega para a lista de manutenções pendentes
      navigate("/manutencao/pendentes");
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar a solicitação. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categorias de manutenção
  const maintenanceCategories = [
    { value: "plumbing", label: "Encanamento" },
    { value: "electrical", label: "Elétrico" },
    { value: "appliance", label: "Eletrodomésticos" },
    { value: "structural", label: "Estrutural" },
    { value: "furniture", label: "Mobiliário" },
    { value: "cleaning", label: "Limpeza Especial" },
    { value: "other", label: "Outro" },
  ];

  return (
    <div className="container max-w-3xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/manutencao/pendentes")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Lista
        </Button>
        
        <h1 className="text-2xl font-bold tracking-tight">Nova Solicitação de Manutenção</h1>
        <p className="text-maria-gray">Solicite a manutenção de uma propriedade</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-maria-primary" />
                Detalhes da Propriedade
              </CardTitle>
              <CardDescription>Selecione a propriedade que necessita de manutenção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Propriedade*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={propertiesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma propriedade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties?.map((property) => (
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
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-yellow-500" />
                Detalhes da Manutenção
              </CardTitle>
              <CardDescription>Informe os detalhes do problema ou serviço necessário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Torneira vazando na cozinha" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um título breve e descritivo para a solicitação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maintenanceCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
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
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Prioridade*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="low" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Baixa
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="medium" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Média
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="high" />
                            </FormControl>
                            <FormLabel className="font-normal text-red-600">
                              Alta (Urgente)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição detalhada*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o problema ou serviço necessário em detalhes..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data limite*</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormDescription>
                      Data em que a manutenção deve ser finalizada
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento máximo (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 150" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor máximo a ser gasto (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="needsPropertyAccess"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Necessita acesso à propriedade</FormLabel>
                      <FormDescription>
                        Ative caso seja necessário entrar na propriedade para realizar o serviço
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {form.watch("needsPropertyAccess") && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">Informações de contacto para acesso</h4>
                      <p className="text-xs text-yellow-700 dark:text-yellow-500 mb-3">
                        Como será necessário acesso à propriedade, forneça um contato para agendamento.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pessoa de contato</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone de contato</FormLabel>
                              <FormControl>
                                <Input placeholder="+351 123 456 789" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/manutencao/pendentes")}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Criar Solicitação
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}