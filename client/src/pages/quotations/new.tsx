import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/layout/page-header";
import { SimpleQuotationForm } from "@/components/quotations/simple-quotation-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewQuotationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const handleSuccess = () => {
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
        title={t("quotation.newTitle")}
        subtitle={t("quotation.newDescription")}
      />
      
      {/* Usando o formulário simplificado alinhado com o banco de dados */}
      <SimpleQuotationForm onSuccess={handleSuccess} />
    </div>
  );
}