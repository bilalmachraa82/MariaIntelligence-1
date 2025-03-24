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
    queryFn: async () => {
      const response = await apiRequest({
        url: `/api/quotations/${quotationId}`
      });
      return response.data;
    },
    enabled: !!quotationId,
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
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
  
  // Generate PDF
  const handleGeneratePdf = async () => {
    try {
      await apiRequest({
        url: `/api/quotations/${quotationId}/pdf`,
        method: 'POST',
      });
      
      toast({
        title: t('quotation.pdfGenerated'),
        description: t('quotation.pdfSuccess'),
        variant: "default",
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('quotation.pdfError'),
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
  
  if (error || !quotation) {
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
          title={`${t('quotation.quotationFor')} ${quotation.clientName}`}
          subtitle={`${t('quotation.createdOn')} ${formatDate(quotation.createdAt)}`}
        />
        
        <div className="flex flex-wrap gap-2">
          {/* Status change buttons */}
          {quotation.status === 'draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowStatusDialog('sent')}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('quotation.markAsSent')}
            </Button>
          )}
          
          {quotation.status === 'sent' && (
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
                <p className="text-muted-foreground">{quotation.clientEmail || t('common.notProvided')}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.clientPhone')}</p>
                <p className="text-muted-foreground">{quotation.clientPhone || t('common.notProvided')}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.validUntil')}</p>
                <p className="text-muted-foreground">{formatDate(quotation.validUntil)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('quotation.status')}</p>
                <div className="mt-1">{getStatusBadge(quotation.status)}</div>
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
                  {t(`quotation.propertyType${quotation.propertyType.charAt(0).toUpperCase() + quotation.propertyType.slice(1)}`)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{t('quotation.totalArea')}</p>
                <p className="text-muted-foreground">{quotation.totalArea} m²</p>
              </div>
              
              {quotation.hasExteriorSpace && (
                <div>
                  <p className="font-medium">{t('quotation.exteriorArea')}</p>
                  <p className="text-muted-foreground">{quotation.exteriorArea} m²</p>
                </div>
              )}
              
              <div>
                <p className="font-medium">{t('quotation.bedrooms')}</p>
                <p className="text-muted-foreground">{quotation.bedrooms}</p>
              </div>
              
              <div>
                <p className="font-medium">{t('quotation.bathrooms')}</p>
                <p className="text-muted-foreground">{quotation.bathrooms}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">{t('quotation.additionalFeatures')}</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {quotation.isDuplex && <li>{t('quotation.isDuplex')}</li>}
                {quotation.hasExteriorSpace && <li>{t('quotation.hasExteriorSpace')}</li>}
                {quotation.hasBBQ && <li>{t('quotation.hasBBQ')}</li>}
                {quotation.hasGarden && <li>{t('quotation.hasGarden')}</li>}
                {quotation.hasGlassSurfaces && <li>{t('quotation.hasGlassSurfaces')}</li>}
                {!quotation.isDuplex && !quotation.hasExteriorSpace && !quotation.hasBBQ && 
                 !quotation.hasGarden && !quotation.hasGlassSurfaces && 
                 <li className="list-none text-center italic">{t('quotation.noAdditionalFeatures')}</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Price Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('quotation.priceSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('quotation.basePrice')}:</span>
                <span>{formatPrice(quotation.basePrice)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('quotation.additionalPrice')}:</span>
                <span>{formatPrice(quotation.additionalPrice)}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-bold text-lg">
                <span>{t('quotation.totalPrice')}:</span>
                <span>{formatPrice(quotation.totalPrice)}</span>
              </div>
            </div>
            
            {quotation.notes && (
              <div className="mt-4">
                <p className="font-medium">{t('quotation.notes')}</p>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete confirmation dialog */}
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
      
      {/* Status change confirmation dialog */}
      <AlertDialog 
        open={!!showStatusDialog} 
        onOpenChange={(open) => !open && setShowStatusDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showStatusDialog && t(`quotation.confirmStatusChange${showStatusDialog.charAt(0).toUpperCase() + showStatusDialog.slice(1)}`)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showStatusDialog && t(`quotation.statusChangeWarning${showStatusDialog.charAt(0).toUpperCase() + showStatusDialog.slice(1)}`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showStatusDialog && handleStatusChange(showStatusDialog)}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}