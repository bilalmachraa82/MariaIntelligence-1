import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/layout/page-header";
import { QuotationForm } from "@/components/quotations/quotation-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewQuotationPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  
  const handleSuccess = () => {
    // Redirecionar para a lista após criar com sucesso
    navigate("/quotations");
  };
  
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
      
      <PageHeader
        title={t('quotation.newTitle')}
        subtitle={t('quotation.newDescription')}
      />
      
      <QuotationForm onSuccess={handleSuccess} />
    </div>
  );
}