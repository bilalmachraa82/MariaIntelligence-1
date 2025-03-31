import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Calendar as CalendarIcon, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { insertMaintenanceTaskSchema } from "@shared/schema";
import { useMaintenanceTasks } from "@/hooks/use-maintenance-tasks";
import { useProperties } from "@/hooks/use-properties";

// Estender o schema para validação do formulário
const createMaintenanceTaskSchema = insertMaintenanceTaskSchema.extend({
  propertyId: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number({
      required_error: "Selecione uma propriedade",
      invalid_type_error: "Propriedade inválida",
    })
  ),
  priority: z.enum(["high", "medium", "low"], {
    required_error: "Selecione uma prioridade",
  }),
  dueDate: z.string({
    required_error: "Selecione uma data limite",
  }),
  status: z.enum(["pending", "scheduled", "completed"], {
    required_error: "Selecione um status",
  }),
  description: z.string().min(5, {
    message: "A descrição deve ter pelo menos 5 caracteres",
  }),
});

type MaintenanceTaskForm = z.infer<typeof createMaintenanceTaskSchema>;

export default function NewMaintenanceTask() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { properties = [] } = useProperties();
  const { createTask, isPendingCreate } = useMaintenanceTasks();

  // Configurar formulário com validação zodResolver
  const form = useForm<MaintenanceTaskForm>({
    resolver: zodResolver(createMaintenanceTaskSchema),
    defaultValues: {
      propertyId: undefined,
      description: "",
      priority: "medium",
      status: "pending",
      reportedAt: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 7 dias para o futuro
      assignedTo: "",
      cost: "",
      invoiceNumber: "",
      notes: "",
    },
  });

  // Função para enviar o formulário
  const onSubmit = (data: MaintenanceTaskForm) => {
    createTask(data, {
      onSuccess: () => {
        // Redirecionar para a lista de tarefas após criar
        setLocation("/manutencao/pendente");
      },
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-maria-primary" />
              <CardTitle>{t("maintenance.newTask", "Nova Tarefa de Manutenção")}</CardTitle>
            </div>
            <CardDescription>
              {t("maintenance.newTaskDescription", "Preencha os detalhes da nova tarefa de manutenção")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Propriedade */}
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.property", "Propriedade")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("maintenance.selectProperty", "Selecione uma propriedade")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("maintenance.propertyDescription", "Selecione a propriedade que precisa de manutenção")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descrição */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.description", "Descrição")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("maintenance.descriptionPlaceholder", "Descreva o problema ou tarefa de manutenção...")}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Prioridade */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.priority", "Prioridade")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("maintenance.selectPriority", "Selecione a prioridade")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">
                            {t("maintenance.priority.high", "Alta")}
                          </SelectItem>
                          <SelectItem value="medium">
                            {t("maintenance.priority.medium", "Média")}
                          </SelectItem>
                          <SelectItem value="low">
                            {t("maintenance.priority.low", "Baixa")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data de vencimento */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("maintenance.dueDate", "Data limite")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: pt })
                              ) : (
                                <span>{t("maintenance.selectDate", "Selecione uma data")}</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => date && field.onChange(format(date, "yyyy-MM-dd"))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.status", "Status")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("maintenance.selectStatus", "Selecione o status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">
                            {t("maintenance.status.pending", "Pendente")}
                          </SelectItem>
                          <SelectItem value="scheduled">
                            {t("maintenance.status.scheduled", "Agendada")}
                          </SelectItem>
                          <SelectItem value="completed">
                            {t("maintenance.status.completed", "Concluída")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Responsável */}
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.assignedTo", "Responsável")} (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("maintenance.assignedToPlaceholder", "Nome do responsável pela tarefa")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custo estimado */}
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.cost", "Custo estimado")} (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="€ 0,00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notas */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.notes", "Notas adicionais")} (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("maintenance.notesPlaceholder", "Informações adicionais sobre a tarefa...")}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CardFooter className="flex justify-between px-0 pb-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/manutencao/pendente")}
                  >
                    {t("common.cancel", "Cancelar")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPendingCreate}
                    className="bg-maria-primary hover:bg-maria-primary/90 text-white"
                  >
                    {isPendingCreate ? t("common.saving", "Salvando...") : t("common.save", "Salvar")}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}