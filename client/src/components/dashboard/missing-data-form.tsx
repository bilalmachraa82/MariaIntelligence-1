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
 */
export function MissingDataForm({ 
  open, 
  onClose, 
  extractedData, 
  missing, 
  onSubmit,
  isLoading = false 
}: MissingDataFormProps) {
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
      <DialogContent className="sm:max-w-[425px]">
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
                      {field === 'numGuests' ? (
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
                        <select 
                          {...formField} 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="">Selecione...</option>
                          <option value="airbnb">Airbnb</option>
                          <option value="booking">Booking.com</option>
                          <option value="expedia">Expedia</option>
                          <option value="direct">Reserva Direta</option>
                          <option value="other">Outro</option>
                        </select>
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