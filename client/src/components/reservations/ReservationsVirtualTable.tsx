import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLocation } from 'wouter';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, reservationStatusColors, platformColors } from '@/lib/utils';
import type { Reservation } from '@/lib/types';

interface ReservationsVirtualTableProps {
  reservations: Reservation[];
  getPropertyName: (propertyId: number) => string;
  onReservationClick: (reservationId: number) => void;
  onReservationEdit: (reservationId: number) => void;
  onReservationDelete: (reservationId: number) => void;
  onPropertyClick: (propertyId: number) => void;
}

export function ReservationsVirtualTable({
  reservations,
  getPropertyName,
  onReservationClick,
  onReservationEdit,
  onReservationDelete,
  onPropertyClick,
}: ReservationsVirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const virtualizer = useVirtualizer({
    count: reservations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65, // Estimated row height in pixels (slightly taller due to badges)
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      className="rounded-md border h-[700px] overflow-auto"
    >
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Hóspede</TableHead>
            <TableHead>Propriedade</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
            <td colSpan={8} style={{ padding: 0 }}>
              <div style={{ position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const reservation = reservations[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium" style={{ width: '15%' }}>
                              <div
                                className="text-primary-600 hover:underline cursor-pointer"
                                onClick={() => onReservationClick(reservation.id)}
                              >
                                {reservation.guestName}
                              </div>
                            </TableCell>
                            <TableCell style={{ width: '15%' }}>
                              <div
                                className="text-primary-600 hover:underline cursor-pointer"
                                onClick={() => onPropertyClick(reservation.propertyId)}
                              >
                                {getPropertyName(reservation.propertyId)}
                              </div>
                            </TableCell>
                            <TableCell style={{ width: '12%' }}>
                              {formatDate(reservation.checkInDate)}
                            </TableCell>
                            <TableCell style={{ width: '12%' }}>
                              {formatDate(reservation.checkOutDate)}
                            </TableCell>
                            <TableCell style={{ width: '12%' }}>
                              {formatCurrency(Number(reservation.totalAmount))}
                            </TableCell>
                            <TableCell style={{ width: '12%' }}>
                              <Badge className={reservationStatusColors[reservation.status] || ''}>
                                {reservation.status === 'pending' && 'Pendente'}
                                {reservation.status === 'confirmed' && 'Confirmada'}
                                {reservation.status === 'cancelled' && 'Cancelada'}
                                {reservation.status === 'completed' && 'Completada'}
                              </Badge>
                            </TableCell>
                            <TableCell style={{ width: '12%' }}>
                              <Badge variant="outline" className={platformColors[reservation.platform] || ''}>
                                {reservation.platform === 'airbnb' && 'Airbnb'}
                                {reservation.platform === 'booking' && 'Booking'}
                                {reservation.platform === 'expedia' && 'Expedia'}
                                {reservation.platform === 'direct' && 'Direto'}
                                {reservation.platform === 'other' && 'Outro'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right" style={{ width: '10%' }}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <div
                                      className="cursor-pointer flex items-center px-2 py-1.5 text-sm"
                                      onClick={() => onReservationClick(reservation.id)}
                                    >
                                      Ver detalhes
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <div
                                      className="cursor-pointer flex items-center px-2 py-1.5 text-sm"
                                      onClick={() => onReservationEdit(reservation.id)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <div
                                      className="cursor-pointer flex items-center px-2 py-1.5 text-sm text-red-600"
                                      onClick={() => onReservationDelete(reservation.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            </td>
          </tr>
        </TableBody>
      </Table>
    </div>
  );
}
