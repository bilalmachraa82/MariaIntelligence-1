import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Edit,
  File,
  FileEdit,
  Home,
  Mail,
  Phone,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
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
import { useQueryClient } from "@tanstack/react-query";

export default function QuotationDetailPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const params = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const quotationId = params.id;
  
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showStatusDialog, setShowStatusDialog] = React.useState<string | null>(null);
  
  // Fetch quotation detail
  const { data: quotation, isLoading, error } = useQuery({
    queryKey: [`/api/quotations/${quotationId}`],
    enabled: !!quotationId,
  });
  
  // Format date com tratamento de erro
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    
    try {
      // Tentar converter a string para data
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateString);
        return '-';
      }
      
      return new Intl.DateTimeFormat('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return dateString?.toString() || '-';
    }
  };
  
  // Format price - com tratamento de erro para garantir conversão correta
  const formatPrice = (price: any) => {
    try {
      // Se já temos um preço formatado, retorná-lo diretamente
      if (typeof price === 'string' && price.includes('€')) {
        return price;
      }
      
      // Garantir que é um número, tentando várias abordagens
      let numericPrice;
      
      if (typeof price === 'string') {
        // Remove caracteres não numéricos, exceto ponto e vírgula
        const cleanedPrice = price.replace(/[^\d.,]/g, '');
        // Substitui vírgula por ponto para conversão correta
        numericPrice = parseFloat(cleanedPrice.replace(',', '.'));
      } else {
        numericPrice = Number(price);
      }
      
      // Verificar se é um número válido
      if (isNaN(numericPrice)) {
        // Fallback para casos onde a conversão falha
        return `${price || '0,00'} €`;
      }
      
      // Formatar com separador de decimal como vírgula e o símbolo € no final
      return numericPrice.toLocaleString('pt-PT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' €';
    } catch (e) {
      console.error("Erro ao formatar preço:", e);
      // Garantir que mesmo com erro o preço aparece
      return typeof price === 'string' ? price : `${price || '0,00'} €`;
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
  const getPropertyTypeLabel = (propertyType: string = '') => {
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
  
  // Generate PDF
  const handleGeneratePdf = async () => {
    try {
      // Criar URL para download direto do PDF
      const downloadUrl = `/api/quotations/${quotationId}/pdf?mode=download`;
      
      // Abrir em nova aba para download direto
      window.open(downloadUrl, '_blank');
      
      toast({
        title: t('quotation.pdfGenerated'),
        description: t('quotation.pdfSuccess'),
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: t('common.error'),
        description: t('quotation.pdfError'),
        variant: "destructive",
      });
    }
  };
  
  // Send Email with PDF
  const handleSendEmail = async () => {
    try {
      // Extrair dados do orçamento
      const quotationData = quotation?.data || quotation;
      
      // Verificar se o cliente tem e-mail cadastrado
      if (!quotationData?.clientEmail) {
        toast({
          title: t('common.warning'),
          description: t('quotation.noEmailProvided'),
          variant: "default",
        });
        return;
      }
      
      toast({
        title: t('quotation.sendingEmail'),
        description: t('quotation.pleaseWait'),
        variant: "default",
      });
      
      // Enviar e-mail com o orçamento anexado
      const response = await apiRequest({
        url: `/api/quotations/${quotationId}/send-email`,
        method: 'POST',
        data: {
          email: quotationData.clientEmail,
          subject: `Orçamento de Serviço para ${quotationData.clientName}`,
          message: `Prezado(a) ${quotationData.clientName},\n\nSegue em anexo o orçamento solicitado para os nossos serviços. Este orçamento é válido até ${formatDate(quotationData.validUntil)}.\n\nFicamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nEquipe Maria Faz`
        }
      });
      
      if (response && response.success) {
        toast({
          title: t('quotation.emailSent'),
          description: t('quotation.emailSuccess'),
          variant: "default",
        });
      } else {
        throw new Error(response?.message || "Falha ao enviar e-mail");
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: t('common.error'),
        description: typeof error === 'string' ? error : 
                     error instanceof Error ? error.message : 
                     t('quotation.emailError'),
        variant: "destructive",
      });
    }
  };
  
  // Delete quotation
  const handleDelete = async () => {
    try {
      await apiRequest({
        url: `/api/quotations/${quotationId}`,
        method: 'DELETE',
      });
      
      toast({
        title: t('quotation.deleted'),
        description: t('quotation.deleteSuccess'),
        variant: "default",
      });
      
      navigate('/quotations');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('quotation.deleteError'),
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };
  
  // Update status
  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiRequest({
        url: `/api/quotations/${quotationId}`,
        method: 'PATCH',
        data: { status: newStatus },
      });
      
      // Invalidate cache to refresh the detail
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}`] });
      
      toast({
        title: t('quotation.statusUpdated'),
        description: t(`quotation.statusChangedTo${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`),
        variant: "default",
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
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/quotations")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <div className="h-24 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  // Log para depuração
  console.log("Estado da consulta:", { error, isLoading, quotation: quotation ? (quotation.data || quotation) : null });
  
  if (error) {
    console.error("Erro ao buscar orçamento:", error);
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/quotations")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-center py-8">
              {t('common.errorLoading')}: {error instanceof Error ? error.message : String(error)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Se não houver quotation ou se for um objeto vazio/undefined
  if (!quotation || (typeof quotation === 'object' && Object.keys(quotation).length === 0)) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/quotations")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-center py-8">{t('quotation.notFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Se quotation tem uma propriedade data, usá-la
  const quotationData = quotation.data || quotation;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/quotations")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title={`${t('quotation.quotationFor')} ${quotationData?.clientName || '-'}`}
          subtitle={`${t('quotation.createdOn')} ${formatDate(quotationData?.createdAt)}`}
        />
        
        <div className="flex flex-wrap gap-2">
          {/* Status change buttons */}
          {quotationData?.status === 'draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStatusDialog('sent')}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('quotation.markAsSent')}
            </Button>
          )}
          
          {quotationData?.status === 'sent' && (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowStatusDialog('accepted')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('quotation.markAsAccepted')}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowStatusDialog('rejected')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('quotation.markAsRejected')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusDialog('expired')}
              >
                <Clock className="h-4 w-4 mr-2" />
                {t('quotation.markAsExpired')}
              </Button>
            </>
          )}
          
          {/* Action buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePdf}
          >
            <File className="h-4 w-4 mr-2" />
            {t('quotation.generatePdf')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
          >
            <Mail className="h-4 w-4 mr-2" />
            {t('quotation.sendByEmail')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/quotations/${quotationId}/edit`)}
          >
            <FileEdit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('common.delete')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quotation.clientInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.clientEmail')}</p>
                <p className="text-muted-foreground">{quotationData?.clientEmail || t('common.notProvided')}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.clientPhone')}</p>
                <p className="text-muted-foreground">{quotationData?.clientPhone || t('common.notProvided')}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.validUntil')}</p>
                <p className="text-muted-foreground">{formatDate(quotationData?.validUntil)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.status')}</p>
                <div className="mt-1">{getStatusBadge(quotationData?.status || 'draft')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quotation.propertyDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.propertyType')}</p>
                <p className="text-muted-foreground">
                  {
                    quotationData?.propertyTypeDisplay || 
                    getPropertyTypeLabel(quotationData?.propertyType)
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{t('quotation.propertyArea')}</p>
                <p className="text-muted-foreground">{quotationData?.propertyArea || 0} m²</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 22v-8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8" />
                  <path d="M18 22H6" />
                  <path d="M4 10V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" />
                  <path d="M11 18h2" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{t('quotation.bedrooms')}</p>
                <p className="text-muted-foreground">{quotationData?.bedrooms || 0}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
                  <line x1="8" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="16" y2="14" />
                  <path d="m16 6 2 2" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{t('quotation.bathrooms')}</p>
                <p className="text-muted-foreground">{quotationData?.bathrooms || 0}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{t('quotation.address')}</p>
                <p className="text-muted-foreground">{quotationData?.propertyAddress || quotationData?.address || t('common.notProvided')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quotation.pricingInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{t('quotation.basePrice')}</p>
                <p className="text-muted-foreground">
                  {quotationData?.basePrice 
                    ? formatPrice(quotationData.basePrice) 
                    : '0,00 €'}
                </p>
              </div>
            </div>
            
            {quotationData?.duplexSurcharge && parseFloat(quotationData.duplexSurcharge) > 0 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('quotation.duplexSurcharge')}</p>
                  <p className="text-muted-foreground">{formatPrice(quotationData.duplexSurcharge)}</p>
                </div>
              </div>
            )}
            
            {quotationData?.bbqSurcharge && parseFloat(quotationData.bbqSurcharge) > 0 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                    <line x1="6" y1="17" x2="18" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('quotation.bbqSurcharge')}</p>
                  <p className="text-muted-foreground">{formatPrice(quotationData.bbqSurcharge)}</p>
                </div>
              </div>
            )}
            
            {quotationData?.glassGardenSurcharge && parseFloat(quotationData.glassGardenSurcharge) > 0 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9V5c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
                    <rect x="2" y="9" width="10" height="13" rx="2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('quotation.glassGardenSurcharge')}</p>
                  <p className="text-muted-foreground">{formatPrice(quotationData.glassGardenSurcharge)}</p>
                </div>
              </div>
            )}
            
            {quotationData?.exteriorSurcharge && parseFloat(quotationData.exteriorSurcharge) > 0 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                    <path d="M2 20h20" />
                    <path d="M14 12v.01" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('quotation.exteriorSurcharge')}</p>
                  <p className="text-muted-foreground">{formatPrice(quotationData.exteriorSurcharge)}</p>
                </div>
              </div>
            )}
            
            {quotationData?.additionalSurcharges && parseFloat(String(quotationData.additionalSurcharges)) > 0 && (
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('quotation.additionalSurcharges')}</p>
                  <p className="text-muted-foreground">{formatPrice(quotationData.additionalSurcharges)}</p>
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-lg">{t('quotation.totalPrice')}</p>
                <p className="text-lg font-semibold text-primary">
                  {quotationData?.totalPriceFormatted || 
                   formatPrice(quotationData?.totalPrice || quotationData?.totalAmount || 0)}
                </p>
              </div>
            </div>
            
            {quotationData?.notes && (
              <div className="pt-4">
                <p className="font-medium">{t('quotation.notes')}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{quotationData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Status Change Dialog */}
      {showStatusDialog && (
        <AlertDialog open={!!showStatusDialog} onOpenChange={() => setShowStatusDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t(`quotation.confirm${showStatusDialog.charAt(0).toUpperCase() + showStatusDialog.slice(1)}`)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(`quotation.${showStatusDialog}Warning`)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusChange(showStatusDialog)}
                className={showStatusDialog === 'accepted' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
              >
                {t(`quotation.confirm${showStatusDialog.charAt(0).toUpperCase() + showStatusDialog.slice(1)}Action`)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}