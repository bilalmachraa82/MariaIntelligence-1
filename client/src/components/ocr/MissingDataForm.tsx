import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';

interface MissingDataFormProps {
  open: boolean;
  onClose: () => void;
  extractedData: any;
  missing: string[];
  onSubmit: (completedData: any) => void;
  isLoading?: boolean;
}

/**
 * Componente para solicitar dados ausentes na extração OCR
 * Implementação do requisito Sprint Debug Final - Formulário de validação
 */
export function MissingDataForm({ 
  open, 
  onClose, 
  extractedData, 
  missing, 
  onSubmit,
  isLoading = false 
}: MissingDataFormProps) {
  // Carregar propriedades disponíveis
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: open && missing.includes('propertyId')
  });

  const form = useForm({
    defaultValues: {
      ...extractedData,
    }
  });

  const handleSubmit = (data: any) => {
    // Combinar dados extraídos com os novos dados preenchidos
    const completedData = {
      ...extractedData,
      ...data
    };
    onSubmit(completedData);
  };

  // Mapear nomes de campos para rótulos amigáveis
  const fieldLabels: Record<string, string> = {
    propertyId: "Propriedade",
    propertyName: "Nome da Propriedade",
    guestName: "Nome do Hóspede",
    checkInDate: "Data de Check-in",
    checkOutDate: "Data de Check-out",
    numGuests: "Número de Hóspedes",
    totalAmount: "Valor Total",
    platform: "Plataforma",
    guestEmail: "Email do Hóspede",
    guestPhone: "Telefone do Hóspede"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Informações Complementares</DialogTitle>
          <DialogDescription>
            Por favor, preencha os dados ausentes para completar a reserva.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {missing.map((field) => (
              <FormField
                key={field}
                control={form.control}
                name={field}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{fieldLabels[field] || field}</FormLabel>
                    <FormControl>
                      {field === 'propertyId' ? (
                        <Select
                          onValueChange={formField.onChange}
                          defaultValue={formField.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma propriedade" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id.toString()}>
                                {property.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field === 'numGuests' ? (
                        <Input 
                          {...formField} 
                          placeholder="Número de pessoas" 
                          type="number" 
                          min={1}
                          required
                        />
                      ) : field === 'totalAmount' ? (
                        <Input 
                          {...formField} 
                          placeholder="Valor em €" 
                          type="number" 
                          step="0.01"
                          min={0}
                          required
                        />
                      ) : field === 'checkInDate' || field === 'checkOutDate' ? (
                        <Input 
                          {...formField} 
                          placeholder="YYYY-MM-DD" 
                          type="date" 
                          required
                        />
                      ) : field === 'platform' ? (
                        <Select
                          onValueChange={formField.onChange}
                          defaultValue={formField.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma plataforma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="airbnb">Airbnb</SelectItem>
                            <SelectItem value="booking">Booking.com</SelectItem>
                            <SelectItem value="expedia">Expedia</SelectItem>
                            <SelectItem value="direct">Reserva Direta</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          {...formField} 
                          placeholder={`Digite ${fieldLabels[field] || field}`} 
                          required
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Confirmar Dados"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}