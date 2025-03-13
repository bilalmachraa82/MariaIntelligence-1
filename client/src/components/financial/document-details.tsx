import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Clock, 
  Receipt, 
  CheckCircle, 
  AlertCircle,
  FileText,
  CreditCard
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
} from "@/lib/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Interface para o documento financeiro
interface FinancialDocument {
  id: number;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  entityId: number;
  entityType: 'owner' | 'supplier';
  entityName: string; // Campo adicionado no front-end
  referenceMonth: string;
  issueDate: string;
  dueDate: string;
  totalAmount: string;
  paidAmount: string | null;
  description: string | null;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Interface para um item do documento
interface DocumentItem {
  id: number;
  documentId: number;
  description: string;
  amount: string;
  quantity: number | null;
  unitValue: string | null;
  notes: string | null;
  propertyId: number | null;
  propertyName?: string; // Campo adicionado no front-end
  reservationId: number | null;
  taxRate: string | null;
  createdAt: string;
}

// Interface para um registro de pagamento
interface PaymentRecord {
  id: number;
  documentId: number;
  paymentDate: string;
  amount: string;
  method: string;
  notes: string | null;
  attachment: string | null;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface DocumentDetailsProps {
  document?: FinancialDocument;
  items?: DocumentItem[];
  payments?: PaymentRecord[];
  isLoading: boolean;
  onAddItem?: () => void;
  onEditItem?: (id: number) => void;
  onDeleteItem?: (id: number) => void;
  onAddPayment?: () => void;
  onEditPayment?: (id: number) => void;
  onDeletePayment?: (id: number) => void;
  onUpdateStatus?: (status: string) => void;
}

export function DocumentDetails({
  document,
  items = [],
  payments = [],
  isLoading,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onUpdateStatus
}: DocumentDetailsProps) {
  const { t } = useTranslation();
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);

  // Mapear status para cores e ícones
  const statusColors = {
    pending: "yellow",
    invoiced: "blue",
    paid: "green",
    cancelled: "red"
  };

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

  // Mapear tipos para cores e textos
  const typeColors = {
    incoming: "green",
    outgoing: "blue"
  };

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

  // Calcular totais
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balance = document ? Number(document.totalAmount) - totalPaid : 0;

  // Verificar se o documento está completamente pago
  const isFullyPaid = document && totalPaid >= Number(document.totalAmount);

  return (
    <div className="space-y-6">
      {/* Detalhes do documento */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{t('Documento Financeiro')}</CardTitle>
              <CardDescription>
                {t('Detalhes completos do documento financeiro')}
              </CardDescription>
            </div>
            {document && (
              <Badge variant="outline" className={`bg-${typeColors[document.type]}-50 text-${typeColors[document.type]}-700 border-${typeColors[document.type]}-200 flex items-center`}>
                {getTypeIcon(document.type)}
                {document.type === 'incoming' ? t('A Receber') : t('A Pagar')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-64" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-64" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-64" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-64" />
              </div>
            </>
          ) : document ? (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('Status')}
                </h3>
                <div className="flex items-center">
                  <Badge variant="outline" className={`bg-${statusColors[document.status]}-50 text-${statusColors[document.status]}-700 border-${statusColors[document.status]}-200 flex items-center`}>
                    {getStatusIcon(document.status)}
                    {document.status === 'pending' ? t('A Cobrar') :
                    document.status === 'invoiced' ? t('Faturado') :
                    document.status === 'paid' ? t('Pago') :
                    t('Cancelado')}
                  </Badge>
                  
                  {onUpdateStatus && document.status !== 'paid' && document.status !== 'cancelled' && (
                    <div className="ml-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            {t('Atualizar Status')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('Atualizar Status do Documento')}</DialogTitle>
                            <DialogDescription>
                              {t('Selecione o novo status para este documento.')}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-2 gap-3 py-4">
                            <Button 
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 border-2 border-yellow-300"
                              onClick={() => onUpdateStatus('pending')}
                              disabled={document.status === 'pending'}
                            >
                              <Clock className="h-8 w-8 mb-2 text-yellow-500" />
                              <span>{t('A Cobrar')}</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 border-2 border-blue-300"
                              onClick={() => onUpdateStatus('invoiced')}
                              disabled={document.status === 'invoiced'}
                            >
                              <Receipt className="h-8 w-8 mb-2 text-blue-500" />
                              <span>{t('Faturado')}</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 border-2 border-green-300"
                              onClick={() => onUpdateStatus('paid')}
                              disabled={document.status === 'paid'}
                            >
                              <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                              <span>{t('Pago')}</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="flex flex-col items-center justify-center h-24 border-2 border-red-300"
                              onClick={() => onUpdateStatus('cancelled')}
                              disabled={document.status === 'cancelled'}
                            >
                              <AlertCircle className="h-8 w-8 mb-2 text-red-500" />
                              <span>{t('Cancelado')}</span>
                            </Button>
                          </div>
                          
                          <DialogFooter>
                            <DialogTrigger asChild>
                              <Button variant="outline">{t('Cancelar')}</Button>
                            </DialogTrigger>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('Entidade')}
                </h3>
                <p className="text-lg font-semibold">{document.entityName}</p>
                <p className="text-sm text-muted-foreground">
                  {document.entityType === 'owner' ? t('Proprietário') : t('Fornecedor')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('Mês de Referência')}
                </h3>
                <p className="text-lg font-semibold">{document.referenceMonth}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('Datas')}
                </h3>
                <div className="flex flex-col">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('Emissão')}:</span>
                    <span className="text-sm font-medium">{formatDate(document.issueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('Vencimento')}:</span>
                    <span className="text-sm font-medium">{formatDate(document.dueDate)}</span>
                  </div>
                </div>
              </div>
              
              {document.externalReference && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('Referência Externa')}
                  </h3>
                  <p className="text-lg font-semibold">{document.externalReference}</p>
                </div>
              )}
              
              {document.description && (
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('Descrição')}
                  </h3>
                  <p className="text-base">{document.description}</p>
                </div>
              )}
              
              <div className="col-span-1 md:col-span-2">
                <div className="bg-muted p-4 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t('Valor Total')}
                      </h3>
                      <p className="text-xl font-bold">{formatCurrency(Number(document.totalAmount))}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t('Valor Pago')}
                      </h3>
                      <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {t('Saldo Restante')}
                      </h3>
                      <p className={`text-xl font-bold ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-amber-500' : 'text-green-500'}`}>
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              {t('Nenhum documento encontrado.')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itens do documento */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('Itens')}</CardTitle>
              <CardDescription>
                {t('Itens incluídos neste documento financeiro')}
              </CardDescription>
            </div>
            {onAddItem && document && (
              <Button onClick={onAddItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('Adicionar Item')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Descrição')}</TableHead>
                  <TableHead>{t('Propriedade')}</TableHead>
                  <TableHead className="text-center">{t('Quantidade')}</TableHead>
                  <TableHead className="text-right">{t('Valor Unitário')}</TableHead>
                  <TableHead className="text-right">{t('Valor Total')}</TableHead>
                  {(onEditItem || onDeleteItem) && (
                    <TableHead className="text-right">{t('Ações')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`loading-item-${index}`}>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                      {(onEditItem || onDeleteItem) && (
                        <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                      )}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {t('Nenhum item adicionado a este documento.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.description}</div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.propertyName || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity || 1}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unitValue ? formatCurrency(Number(item.unitValue)) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.amount))}
                      </TableCell>
                      {(onEditItem || onDeleteItem) && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {onEditItem && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => onEditItem(item.id)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('Editar')}</span>
                              </Button>
                            )}
                            {onDeleteItem && (
                              <AlertDialog open={itemToDelete === item.id} onOpenChange={(open) => !open && setItemToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => setItemToDelete(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{t('Excluir')}</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('Confirmar exclusão')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                                      {t('Cancelar')}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground"
                                      onClick={() => {
                                        if (itemToDelete !== null) {
                                          onDeleteItem(itemToDelete);
                                          setItemToDelete(null);
                                        }
                                      }}
                                    >
                                      {t('Excluir')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagamentos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('Pagamentos')}</CardTitle>
              <CardDescription>
                {t('Registros de pagamentos realizados para este documento')}
              </CardDescription>
            </div>
            {onAddPayment && document && document.status !== 'cancelled' && !isFullyPaid && (
              <Button onClick={onAddPayment} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('Registrar Pagamento')}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Data')}</TableHead>
                  <TableHead>{t('Método')}</TableHead>
                  <TableHead>{t('Referência')}</TableHead>
                  <TableHead>{t('Notas')}</TableHead>
                  <TableHead className="text-right">{t('Valor')}</TableHead>
                  {(onEditPayment || onDeletePayment) && (
                    <TableHead className="text-right">{t('Ações')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <TableRow key={`loading-payment-${index}`}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                      {(onEditPayment || onDeletePayment) && (
                        <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                      )}
                    </TableRow>
                  ))
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {t('Nenhum pagamento registrado para este documento.')}
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                          {payment.method}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.externalReference || '-'}
                      </TableCell>
                      <TableCell>
                        {payment.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(payment.amount))}
                      </TableCell>
                      {(onEditPayment || onDeletePayment) && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {onEditPayment && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => onEditPayment(payment.id)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('Editar')}</span>
                              </Button>
                            )}
                            {onDeletePayment && (
                              <AlertDialog open={paymentToDelete === payment.id} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => setPaymentToDelete(payment.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">{t('Excluir')}</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('Confirmar exclusão')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('Tem certeza que deseja excluir este registro de pagamento? Esta ação não pode ser desfeita.')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>
                                      {t('Cancelar')}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground"
                                      onClick={() => {
                                        if (paymentToDelete !== null) {
                                          onDeletePayment(paymentToDelete);
                                          setPaymentToDelete(null);
                                        }
                                      }}
                                    >
                                      {t('Excluir')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}