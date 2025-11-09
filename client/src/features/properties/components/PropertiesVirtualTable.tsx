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
import { formatCurrency } from '@/lib/utils';

interface Property {
  id: number;
  name: string;
  ownerId: number;
  cleaningCost: number | string;
  checkInFee: number | string;
  commission: number | string;
  cleaningTeam: string;
}

interface PropertiesVirtualTableProps {
  properties: Property[];
  getOwnerName: (ownerId: number) => string;
  onPropertyClick: (propertyId: number) => void;
  onPropertyEdit: (propertyId: number) => void;
  onPropertyDelete: (propertyId: number) => void;
}

export function PropertiesVirtualTable({
  properties,
  getOwnerName,
  onPropertyClick,
  onPropertyEdit,
  onPropertyDelete,
}: PropertiesVirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const virtualizer = useVirtualizer({
    count: properties.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      className="rounded-md border h-[600px] overflow-auto"
    >
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Proprietário</TableHead>
            <TableHead>Custo Limpeza</TableHead>
            <TableHead>Taxa Check-in</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead>Equipe Limpeza</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
            <td colSpan={7} style={{ padding: 0 }}>
              <div style={{ position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const property = properties[virtualRow.index];
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
                            <TableCell className="font-medium" style={{ width: '20%' }}>
                              <div onClick={() => onPropertyClick(property.id)}>
                                <span className="text-primary-600 hover:underline cursor-pointer">
                                  {property.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell style={{ width: '15%' }}>
                              {getOwnerName(property.ownerId)}
                            </TableCell>
                            <TableCell style={{ width: '13%' }}>
                              {formatCurrency(Number(property.cleaningCost))}
                            </TableCell>
                            <TableCell style={{ width: '13%' }}>
                              {formatCurrency(Number(property.checkInFee))}
                            </TableCell>
                            <TableCell style={{ width: '10%' }}>
                              {Number(property.commission)}%
                            </TableCell>
                            <TableCell style={{ width: '15%' }}>
                              {property.cleaningTeam}
                            </TableCell>
                            <TableCell className="text-right" style={{ width: '14%' }}>
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
                                      onClick={() => onPropertyClick(property.id)}
                                    >
                                      <span className="flex items-center w-full">
                                        Ver detalhes
                                      </span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <div
                                      className="cursor-pointer flex items-center px-2 py-1.5 text-sm"
                                      onClick={() => onPropertyEdit(property.id)}
                                    >
                                      <span className="flex items-center w-full">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </span>
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <div
                                      className="cursor-pointer flex items-center px-2 py-1.5 text-sm text-red-600"
                                      onClick={() => onPropertyDelete(property.id)}
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
