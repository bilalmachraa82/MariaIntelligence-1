import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useOwners } from "@/hooks/use-owners";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Definir o schema para o formulário de documento financeiro
const documentFormSchema = z.object({
  type: z.enum(["incoming", "outgoing"], {
    required_error: "Selecione o tipo de documento",
  }),
  status: z.enum(["pending", "invoiced", "paid", "cancelled"], {
    required_error: "Selecione o status do documento",
  }),
  entityType: z.enum(["owner", "supplier"], {
    required_error: "Selecione o tipo de entidade",
  }),
  entityId: z.string({
    required_error: "Selecione a entidade",
  }),
  referenceMonth: z.string({
    required_error: "Informe o mês de referência",
  }),
  issueDate: z.date({
    required_error: "Selecione a data de emissão",
  }),
  dueDate: z.date({
    required_error: "Selecione a data de vencimento",
  }),
  totalAmount: z.string({
    required_error: "Informe o valor total",
  }),
  description: z.string().nullable().optional(),
  externalReference: z.string().nullable().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

// Propriedades do componente
interface DocumentFormProps {
  defaultValues?: Partial<DocumentFormValues>;
  isSubmitting?: boolean;
  onSubmit: (values: DocumentFormValues) => void;
}

export function DocumentForm({ defaultValues, isSubmitting = false, onSubmit }: DocumentFormProps) {
  const { t } = useTranslation();
  const [owner, setOwner] = useState<boolean>(true);
  const { data: ownersData, isLoading: isLoadingOwners } = useOwners();
  const owners = ownersData?.data || [];

  // Inicializar o formulário com valores padrão
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      type: "incoming",
      status: "pending",
      entityType: "owner",
      entityId: "",
      referenceMonth: format(new Date(), "yyyy-MM"),
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias à frente
      totalAmount: "",
      description: "",
      externalReference: "",
      ...defaultValues,
    },
  });

  // Atualizar o campo entityType quando o formulário é inicializado com valores padrão
  useEffect(() => {
    if (defaultValues?.entityType) {
      setOwner(defaultValues.entityType === "owner");
    }
  }, [defaultValues]);

  // Lidar com a mudança no tipo de entidade
  const handleEntityTypeChange = (value: string) => {
    setOwner(value === "owner");
    form.setValue("entityId", ""); // Limpar a seleção de entidade ao mudar o tipo
  };

  // Formatar um número para exibição no campo de entrada
  const formatCurrency = (value: string) => {
    if (!value) return "";
    // Remover tudo que não for dígito ou ponto
    value = value.replace(/[^\d.]/g, "");
    
    // Garantir que há apenas um ponto decimal
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
    
    // Formatar com duas casas decimais
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num.toFixed(2);
    }
    return value;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo e Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Documento */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Tipo de Documento')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Selecione o tipo')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="incoming">{t('A Receber')}</SelectItem>
                    <SelectItem value="outgoing">{t('A Pagar')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('Selecione se é um documento a receber ou a pagar')}
                </FormDescription>
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
                <FormLabel>{t('Status')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Selecione o status')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">{t('A Cobrar')}</SelectItem>
                    <SelectItem value="invoiced">{t('Faturado')}</SelectItem>
                    <SelectItem value="paid">{t('Pago')}</SelectItem>
                    <SelectItem value="cancelled">{t('Cancelado')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('Indique o status atual do documento')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Entidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Entidade */}
          <FormField
            control={form.control}
            name="entityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Tipo de Entidade')}</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleEntityTypeChange(value);
                  }}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Selecione o tipo de entidade')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="owner">{t('Proprietário')}</SelectItem>
                    <SelectItem value="supplier">{t('Fornecedor')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t('Selecione se é um proprietário ou fornecedor')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Entidade */}
          <FormField
            control={form.control}
            name="entityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{owner ? t('Proprietário') : t('Fornecedor')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={owner ? t('Selecione o proprietário') : t('Selecione o fornecedor')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {owner ? (
                      isLoadingOwners ? (
                        <div className="p-2 text-center">
                          <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                          {t('Carregando...')}
                        </div>
                      ) : owners.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">
                          {t('Nenhum proprietário encontrado')}
                        </div>
                      ) : (
                        owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id.toString()}>
                            {owner.name}
                          </SelectItem>
                        ))
                      )
                    ) : (
                      <div className="p-2 text-center text-muted-foreground">
                        {t('Função de fornecedores será implementada em breve')}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {owner 
                    ? t('Selecione o proprietário relacionado a este documento')
                    : t('Selecione o fornecedor relacionado a este documento')
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Mês de Referência, Data de Emissão e Vencimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mês de Referência */}
          <FormField
            control={form.control}
            name="referenceMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Mês de Referência')}</FormLabel>
                <FormControl>
                  <Input
                    type="month"
                    placeholder="YYYY-MM"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  {t('Mês e ano a que se refere este documento')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Emissão */}
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('Data de Emissão')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={
                          "pl-3 text-left font-normal " +
                          (!field.value && "text-muted-foreground")
                        }
                        disabled={isSubmitting}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>{t('Selecione uma data')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={isSubmitting}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {t('Data em que o documento foi emitido')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Vencimento */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('Data de Vencimento')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={
                          "pl-3 text-left font-normal " +
                          (!field.value && "text-muted-foreground")
                        }
                        disabled={isSubmitting}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>{t('Selecione uma data')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={isSubmitting || (form.watch('status') === 'paid')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {t('Data de vencimento do pagamento')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Valor Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Valor Total */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Valor Total')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">€</span>
                    <Input
                      type="text"
                      placeholder="0.00"
                      className="pl-8"
                      {...field}
                      onChange={(e) => {
                        const formattedValue = formatCurrency(e.target.value);
                        e.target.value = formattedValue;
                        field.onChange(formattedValue);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {t('Valor total do documento')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Referência Externa */}
          <FormField
            control={form.control}
            name="externalReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Referência Externa')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('Número da fatura, referência, etc.')}
                    {...field}
                    value={field.value || ""}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  {t('Número da fatura ou referência externa (opcional)')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Descrição')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('Descreva detalhes adicionais sobre este documento')}
                  className="resize-none min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                {t('Informações adicionais sobre o documento (opcional)')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botão de Submissão */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('Salvando...')}
            </>
          ) : (
            t('Salvar Documento')
          )}
        </Button>
      </form>
    </Form>
  );
}