import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { QuotationForm } from "@/components/quotations/quotation-form";

export default function EditQuotationPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [, navigate] = useLocation();
  
  const quotationId = params.id;
  
  // Fetch quotation data
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
  
  // Handle successful save
  const handleSuccess = () => {
    navigate(`/quotations/${quotationId}`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/quotations/${quotationId}`)}
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
          onClick={() => navigate(`/quotations/${quotationId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
      
      <PageHeader
        title={t('quotation.editTitle')}
        subtitle={t('quotation.editDescription')}
      />
      
      <QuotationForm 
        defaultValues={quotation} 
        onSuccess={handleSuccess} 
        isEditing={true}
      />
    </div>
  );
}