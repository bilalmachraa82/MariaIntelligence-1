import React from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { QuotationList } from "@/components/quotations/quotation-list";

export default function QuotationsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={t('quotation.pageTitle')}
        subtitle={t('quotation.pageDescription')}
      />
      
      <QuotationList />
    </div>
  );
}