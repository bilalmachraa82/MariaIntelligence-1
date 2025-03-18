import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

export default function ReservationApprovalPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Query para buscar reservas que precisam de revisão
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['/api/reservations', { status: 'needs_review' }],
    queryFn: () => apiRequest('/api/reservations?status=needs_review'),
  });

  // Mutation para aprovar reserva
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'confirmed' }),
      });
    },
    onSuccess: () => {
      toast({
        title: t('Reserva aprovada'),
        description: t('A reserva foi aprovada com sucesso.'),
      });
    },
  });

  // Mutation para rejeitar reserva
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
    },
    onSuccess: () => {
      toast({
        title: t('Reserva rejeitada'),
        description: t('A reserva foi rejeitada.'),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">{t('Aprovação de Reservas')}</h1>
      
      {reservations?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('Não há reservas aguardando aprovação.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reservations?.map((reservation: any) => (
            <Card key={reservation.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{reservation.guestName}</span>
                  <Badge variant="secondary">{t('Aguardando Revisão')}</Badge>
                </CardTitle>
                <CardDescription>
                  ID: {reservation.id} | {t('Propriedade')}: {reservation.propertyId}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Check-in')}</Label>
                    <Input 
                      type="date" 
                      value={reservation.checkInDate}
                      readOnly 
                    />
                  </div>
                  <div>
                    <Label>{t('Check-out')}</Label>
                    <Input 
                      type="date" 
                      value={reservation.checkOutDate}
                      readOnly 
                    />
                  </div>
                  <div>
                    <Label>{t('Valor Total')}</Label>
                    <Input 
                      type="text" 
                      value={`R$ ${Number(reservation.totalAmount).toFixed(2)}`}
                      readOnly 
                    />
                  </div>
                  <div>
                    <Label>{t('Hóspedes')}</Label>
                    <Input 
                      type="number" 
                      value={reservation.numGuests}
                      readOnly 
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label>{t('Observações')}</Label>
                  <Input 
                    type="text" 
                    value={reservation.notes || t('Sem observações')}
                    readOnly 
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => rejectMutation.mutate(reservation.id)}
                  disabled={rejectMutation.isPending}
                >
                  {t('Rejeitar')}
                </Button>
                <Button
                  onClick={() => approveMutation.mutate(reservation.id)}
                  disabled={approveMutation.isPending}
                >
                  {t('Aprovar')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}