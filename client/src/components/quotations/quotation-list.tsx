import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MoreVertical, 
  FileEdit, 
  Eye, 
  Trash2, 
  File, 
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function QuotationList() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States for filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState<{ id: number, status: string } | null>(null);
  
  // Fetch quotations - usando a instância padrão de queryClient com defaultQueryFn 
  const { data: quotations, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/quotations'],
    select: (response: any) => response.data || []
  });
  
  // Generate PDF for a quotation
  const handleGeneratePdf = async (quotationId: number) => {
    try {
      // Usando janela aberta para download direto em vez de apiRequest
      window.open(`/api/quotations/${quotationId}/pdf`, '_blank');
      
      toast({
        title: t('quotation.pdfGenerated'),
        description: t('quotation.pdfSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('quotation.pdfError'),
        variant: "destructive",
      });
    }
  };
  
  // Handle deletion of a quotation
  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/quotations/${id}`, {
        method: 'DELETE',
      });
      
      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      
      toast({
        title: t('quotation.deleted'),
        description: t('quotation.deleteSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('quotation.deleteError'),
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(null);
    }
  };
  
  // Handle status change
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await apiRequest(`/api/quotations/${id}`, {
        method: 'PATCH',
        data: { status: newStatus },
      });
      
      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      
      toast({
        title: t('quotation.statusUpdated'),
        description: t(`quotation.statusChangedTo${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('quotation.statusUpdateError'),
        variant: "destructive",
      });
    } finally {
      setShowStatusDialog(null);
    }
  };
  
  // Filter quotations based on search query and status filter
  const filteredQuotations = Array.isArray(quotations)
    ? quotations.filter((quotation: any) => {
        const matchesSearch = searchQuery === "" || 
          quotation.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = 
          statusFilter === "all" || 
          quotation.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };
  
  // Format price - com tratamento de erro para garantir conversão correta
  const formatPrice = (price: any) => {
    try {
      // Garantir que é um número, tentando várias abordagens
      const numericPrice = typeof price === 'string' 
        ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
        : Number(price);
      
      // Verificar se é um número válido
      if (isNaN(numericPrice)) {
        // Fallback para casos onde a conversão falha
        return `${price} €`;
      }
      
      // Formatar com separador de decimal como vírgula e o símbolo € no final
      return numericPrice.toLocaleString('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' €';
    } catch (e) {
      // Garantir que mesmo com erro o preço aparece
      console.warn('Erro ao formatar preço:', e);
      return `${price} €`;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">{t('quotation.statusDraft')}</Badge>;
      case 'sent':
        return <Badge variant="secondary">{t('quotation.statusSent')}</Badge>;
      case 'accepted':
        return <Badge className="bg-green-600">{t('quotation.statusAccepted')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('quotation.statusRejected')}</Badge>;
      case 'expired':
        return <Badge variant="default">{t('quotation.statusExpired')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Função para obter a descrição do tipo de propriedade
  const getPropertyTypeLabel = (propertyType: string) => {
    const propertyTypes: Record<string, string> = {
      'apartment_t0t1': 'Apartamento T0/T1',
      'apartment_t2': 'Apartamento T2',
      'apartment_t3': 'Apartamento T3',
      'apartment_t4': 'Apartamento T4',
      'apartment_t5': 'Apartamento T5+',
      'house_v1': 'Moradia V1',
      'house_v2': 'Moradia V2',
      'house_v3': 'Moradia V3',
      'house_v4': 'Moradia V4',
      'house_v5': 'Moradia V5+'
    };
    
    return propertyTypes[propertyType] || propertyType;
  };
  
  return (
    <>
      {/* List header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('quotation.searchPlaceholder')}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('quotation.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('quotation.statusAll')}</SelectItem>
              <SelectItem value="draft">{t('quotation.statusDraft')}</SelectItem>
              <SelectItem value="sent">{t('quotation.statusSent')}</SelectItem>
              <SelectItem value="accepted">{t('quotation.statusAccepted')}</SelectItem>
              <SelectItem value="rejected">{t('quotation.statusRejected')}</SelectItem>
              <SelectItem value="expired">{t('quotation.statusExpired')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={() => navigate("/quotations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t('quotation.create')}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('quotation.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('quotation.noQuotations')}</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => navigate("/quotations/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('quotation.create')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('quotation.clientName')}</TableHead>
                    <TableHead>{t('quotation.propertyType')}</TableHead>
                    <TableHead className="text-right">{t('quotation.totalPrice')}</TableHead>
                    <TableHead>{t('quotation.status')}</TableHead>
                    <TableHead>{t('quotation.validUntil')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation: any) => (
                    <TableRow key={quotation.id}>
                      <TableCell>{quotation.clientName}</TableCell>
                      <TableCell>
                        {(() => {
                          const propertyTypes: Record<string, string> = {
                            'apartment_t0t1': 'Apartamento T0/T1',
                            'apartment_t2': 'Apartamento T2',
                            'apartment_t3': 'Apartamento T3',
                            'apartment_t4': 'Apartamento T4',
                            'apartment_t5': 'Apartamento T5+',
                            'house_v1': 'Moradia V1',
                            'house_v2': 'Moradia V2',
                            'house_v3': 'Moradia V3',
                            'house_v4': 'Moradia V4',
                            'house_v5': 'Moradia V5+'
                          };
                          
                          // Usar sempre o tipo de propriedade dos dados reais do orçamento
                          if (quotation.propertyType && propertyTypes[quotation.propertyType]) {
                            return propertyTypes[quotation.propertyType];
                          }
                          
                          // Se o tipo não estiver mapeado, mostrar o valor original
                          return quotation.propertyType || 'Tipo não especificado';
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        {quotation.totalPriceFormatted || (quotation.totalPrice 
                          ? formatPrice(parseFloat(quotation.totalPrice)) 
                          : '€0,00')}
                      </TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell>{formatDate(quotation.validUntil)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              const id = quotation.id.toString();
                              console.log(`Navegando para orçamento ${id}`);
                              // Navegar diretamente com o ID como string
                              navigate(`/quotations/${id}`);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('common.view')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => navigate(`/quotations/${quotation.id}/edit`)}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleGeneratePdf(quotation.id)}>
                              <File className="mr-2 h-4 w-4" />
                              {t('quotation.generatePdf')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {quotation.status === 'draft' && (
                              <DropdownMenuItem 
                                onClick={() => setShowStatusDialog({ id: quotation.id, status: 'sent' })}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                {t('quotation.markAsSent')}
                              </DropdownMenuItem>
                            )}
                            
                            {quotation.status === 'sent' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => setShowStatusDialog({ id: quotation.id, status: 'accepted' })}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {t('quotation.markAsAccepted')}
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => setShowStatusDialog({ id: quotation.id, status: 'rejected' })}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {t('quotation.markAsRejected')}
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  onClick={() => setShowStatusDialog({ id: quotation.id, status: 'expired' })}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  {t('quotation.markAsExpired')}
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => setShowDeleteDialog(quotation.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog !== null} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('quotation.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('quotation.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDeleteDialog !== null && handleDelete(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Status change confirmation dialog */}
      <AlertDialog 
        open={showStatusDialog !== null} 
        onOpenChange={() => setShowStatusDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showStatusDialog?.status && t(`quotation.confirmStatusChange${showStatusDialog.status.charAt(0).toUpperCase() + showStatusDialog.status.slice(1)}`)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showStatusDialog?.status && t(`quotation.statusChangeWarning${showStatusDialog.status.charAt(0).toUpperCase() + showStatusDialog.status.slice(1)}`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showStatusDialog !== null && handleStatusChange(showStatusDialog.id, showStatusDialog.status)}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}