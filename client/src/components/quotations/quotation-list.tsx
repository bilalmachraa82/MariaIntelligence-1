import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FilePlus, 
  FileEdit, 
  FileX, 
  Printer, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Filter
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function QuotationList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Estado para filtros
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  // Carregar lista de orçamentos
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/quotations', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const url = `/api/quotations${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest({ url });
      return response.data;
    }
  });
  
  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-PT").format(date);
  };
  
  // Função para verificar se o orçamento está expirado
  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };
  
  // Renderização do badge de status
  const renderStatusBadge = (status: string, validUntil: string) => {
    // Se estiver expirado e não estiver aceito ou rejeitado, mostrar como expirado
    if (isExpired(validUntil) && !['accepted', 'rejected'].includes(status)) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          <Clock className="h-3 w-3 mr-1" />
          {t('quotation.statusExpired')}
        </Badge>
      );
    }
    
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-800">
            <FilePlus className="h-3 w-3 mr-1" />
            {t('quotation.statusDraft')}
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Send className="h-3 w-3 mr-1" />
            {t('quotation.statusSent')}
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('quotation.statusAccepted')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t('quotation.statusRejected')}
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Função para gerar PDF
  const handleGeneratePdf = async (id: number) => {
    try {
      const response = await apiRequest({
        url: `/api/quotations/${id}/pdf`,
        method: 'GET'
      });
      
      toast({
        title: t('quotation.pdfGenerated'),
        description: t('quotation.pdfGeneratedSuccess'),
        variant: "default"
      });
      
      // Em um ambiente real, aqui poderia iniciar o download do PDF
      
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: t('quotation.error'),
        description: error.message || t('quotation.pdfGenerationError'),
        variant: "destructive"
      });
    }
  };
  
  // Função para excluir orçamento
  const handleDeleteQuotation = async (id: number) => {
    if (!window.confirm(t('quotation.confirmDelete'))) return;
    
    try {
      await apiRequest({
        url: `/api/quotations/${id}`,
        method: 'DELETE'
      });
      
      toast({
        title: t('quotation.deleted'),
        description: t('quotation.deleteSuccess'),
        variant: "default"
      });
      
      // Atualizar a lista de orçamentos
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      
    } catch (error: any) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        title: t('quotation.error'),
        description: error.message || t('quotation.deleteError'),
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('quotation.listTitle')}</CardTitle>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('quotation.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('quotation.allStatuses')}</SelectItem>
                <SelectItem value="draft">{t('quotation.statusDraft')}</SelectItem>
                <SelectItem value="sent">{t('quotation.statusSent')}</SelectItem>
                <SelectItem value="accepted">{t('quotation.statusAccepted')}</SelectItem>
                <SelectItem value="rejected">{t('quotation.statusRejected')}</SelectItem>
                <SelectItem value="expired">{t('quotation.statusExpired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="default" 
            onClick={() => navigate("/quotations/new")}
          >
            <FilePlus className="h-4 w-4 mr-2" />
            {t('quotation.createNew')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            {t('quotation.loadError')}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('quotation.noQuotations')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('quotation.clientName')}</TableHead>
                  <TableHead>{t('quotation.propertyType')}</TableHead>
                  <TableHead>{t('quotation.createdAt')}</TableHead>
                  <TableHead>{t('quotation.validUntil')}</TableHead>
                  <TableHead>{t('quotation.totalPrice')}</TableHead>
                  <TableHead>{t('quotation.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.map((quotation: any) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{quotation.clientName}</TableCell>
                    <TableCell>
                      {t(`quotation.propertyType${quotation.propertyType.charAt(0).toUpperCase() + quotation.propertyType.slice(1)}`)}
                    </TableCell>
                    <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                    <TableCell>{formatDate(quotation.validUntil)}</TableCell>
                    <TableCell>€{parseFloat(quotation.totalPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      {renderStatusBadge(quotation.status, quotation.validUntil)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {t('common.actions')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('quotation.quotationOptions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/quotations/${quotation.id}`)}>
                            <FileEdit className="h-4 w-4 mr-2" />
                            {t('common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/quotations/${quotation.id}/edit`)}>
                            <FileEdit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleGeneratePdf(quotation.id)}>
                            <Printer className="h-4 w-4 mr-2" />
                            {t('quotation.generatePdf')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/quotations/${quotation.id}/pdf`)}>
                            <Download className="h-4 w-4 mr-2" />
                            {t('quotation.download')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteQuotation(quotation.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <FileX className="h-4 w-4 mr-2" />
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
  );
}