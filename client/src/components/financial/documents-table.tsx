import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { MoreVertical, Edit, Trash2, Eye, Plus, FileText, Receipt, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  truncate
} from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

// Interface para representar um documento financeiro na tabela
interface FinancialDocumentTableItem {
  id: number;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  entityName: string;
  entityType: 'owner' | 'supplier';
  referenceMonth: string;
  issueDate: string;
  dueDate: string;
  totalAmount: string;
  paidAmount: string | null;
  description: string | null;
}

interface FinancialDocumentsTableProps {
  documents?: FinancialDocumentTableItem[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
}

export function FinancialDocumentsTable({ documents = [], isLoading, onDelete }: FinancialDocumentsTableProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'invoiced' | 'paid' | 'cancelled'>('all');

  // Filtrar documentos baseado nos filtros selecionados
  const filteredDocuments = documents.filter(doc => {
    if (filter !== 'all' && doc.type !== filter) {
      return false;
    }
    if (statusFilter !== 'all' && doc.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Definir cores dos status
  const statusColors = {
    pending: "yellow",
    invoiced: "blue",
    paid: "green",
    cancelled: "red"
  };

  // Definir cores dos tipos
  const typeColors = {
    incoming: "green",
    outgoing: "blue"
  };

  // Obter o ícone apropriado para o status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'invoiced':
        return <Receipt className="h-4 w-4 mr-1" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  // Obter o ícone apropriado para o tipo de documento
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <FileText className="h-4 w-4 mr-1" />;
      case 'outgoing':
        return <FileText className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('all')}
          >
            {t('Todos')}
          </Button>
          <Button
            variant={filter === 'incoming' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('incoming')}
          >
            {t('A Receber')}
          </Button>
          <Button
            variant={filter === 'outgoing' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('outgoing')}
          >
            {t('A Pagar')}
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={statusFilter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            {t('Todos Status')}
          </Button>
          <Button
            variant={statusFilter === 'pending' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            {t('A Cobrar')}
          </Button>
          <Button
            variant={statusFilter === 'invoiced' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('invoiced')}
          >
            {t('Faturado')}
          </Button>
          <Button
            variant={statusFilter === 'paid' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('paid')}
          >
            {t('Pago')}
          </Button>
        </div>

        <Button asChild>
          <Link href="/payments/new">
            <Plus className="h-4 w-4 mr-2" />
            {t('Novo Documento')}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Tipo')}</TableHead>
              <TableHead>{t('Status')}</TableHead>
              <TableHead>{t('Entidade')}</TableHead>
              <TableHead>{t('Mês Ref.')}</TableHead>
              <TableHead>{t('Data Emissão')}</TableHead>
              <TableHead>{t('Data Vencimento')}</TableHead>
              <TableHead className="text-right">{t('Valor Total')}</TableHead>
              <TableHead className="text-right">{t('Valor Pago')}</TableHead>
              <TableHead className="text-right">{t('Ações')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                </TableRow>
              ))
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  {t('Nenhum documento financeiro encontrado.')}
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <Badge variant="outline" className={`bg-${typeColors[document.type]}-50 text-${typeColors[document.type]}-700 border-${typeColors[document.type]}-200 flex items-center`}>
                      {getTypeIcon(document.type)}
                      {document.type === 'incoming' ? t('A Receber') : t('A Pagar')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`bg-${statusColors[document.status]}-50 text-${statusColors[document.status]}-700 border-${statusColors[document.status]}-200 flex items-center`}>
                      {getStatusIcon(document.status)}
                      {document.status === 'pending' ? t('A Cobrar') :
                       document.status === 'invoiced' ? t('Faturado') :
                       document.status === 'paid' ? t('Pago') :
                       t('Cancelado')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{document.entityName}</div>
                    <div className="text-xs text-muted-foreground">
                      {document.entityType === 'owner' ? t('Proprietário') : t('Fornecedor')}
                    </div>
                  </TableCell>
                  <TableCell>{document.referenceMonth}</TableCell>
                  <TableCell>{formatDate(document.issueDate)}</TableCell>
                  <TableCell>{formatDate(document.dueDate)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(document.totalAmount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {document.paidAmount ? formatCurrency(Number(document.paidAmount)) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('Ações')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/payments/${document.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('Ver detalhes')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/payments/edit/${document.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('Editar')}
                            </Link>
                          </DropdownMenuItem>
                          {onDelete && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => onDelete(document.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('Excluir')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}