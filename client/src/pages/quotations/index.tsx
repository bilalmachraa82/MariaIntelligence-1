import React from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { QuotationList } from "@/components/quotations/quotation-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function QuotationsPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={t("quotation.pageTitle")}
        subtitle={t("quotation.pageDescription")}
        actions={
          <Button onClick={() => navigate("/quotations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("quotation.create")}
          </Button>
        }
      />
      
      <QuotationList />
    </div>
  );
}