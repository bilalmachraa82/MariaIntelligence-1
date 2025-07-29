import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "wouter";
import {
  useFinancialDocument,
  useUpdateFinancialDocument,
  useDeleteFinancialDocumentItem,
  useDeletePaymentRecord
} from "@/hooks/use-financial-documents";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { DocumentDetails } from "@/components/financial/document-details";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DocumentDetailPage() {
  const { t } = useTranslation();
  const [, params] = useRoute<{ id: string }>("/financial/documents/:id");
  const documentId = params ? parseInt(params.id) : undefined;
  
  // Carregar detalhes do documento
  const {
    data: documentData,
    isLoading: isLoadingDocument,
    isError: isDocumentError
  } = useFinancialDocument(documentId);
  
  // Extrair documento, itens e pagamentos do resultado
  const document = documentData?.document;
  const items = documentData?.items || [];
  const payments = documentData?.payments || [];
  
  // Mutations
  const updateDocumentMutation = useUpdateFinancialDocument();
  const deleteItemMutation = useDeleteFinancialDocumentItem();
  const deletePaymentMutation = useDeletePaymentRecord();
  
  // Definir handlers
  const handleUpdateStatus = async (status: string) => {
    if (!documentId) return;
    
    try {
      await updateDocumentMutation.mutateAsync({
        id: documentId,
        data: { status }
      });
      
      toast({
        title: t("Status atualizado"),
        description: t("O status do documento foi atualizado com sucesso.")
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: t("Erro ao atualizar status"),
        description: t("Ocorreu um erro ao atualizar o status do documento."),
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteItem = async (itemId: number) => {
    try {
      await deleteItemMutation.mutateAsync(itemId);
      
      toast({
        title: t("Item excluído"),
        description: t("O item foi excluído com sucesso.")
      });
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      toast({
        title: t("Erro ao excluir item"),
        description: t("Ocorreu um erro ao excluir o item."),
        variant: "destructive"
      });
    }
  };
  
  const handleDeletePayment = async (paymentId: number) => {
    try {
      await deletePaymentMutation.mutateAsync(paymentId);
      
      toast({
        title: t("Pagamento excluído"),
        description: t("O registro de pagamento foi excluído com sucesso.")
      });
    } catch (error) {
      console.error("Erro ao excluir pagamento:", error);
      toast({
        title: t("Erro ao excluir pagamento"),
        description: t("Ocorreu um erro ao excluir o registro de pagamento."),
        variant: "destructive"
      });
    }
  };
  
  // Verificar erros
  if (isDocumentError) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center mb-6">
            <Button asChild variant="ghost" className="mr-4">
              <Link href="/financial/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("Voltar para lista")}
              </Link>
            </Button>
          </div>
          
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{t("Erro ao carregar documento")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("Não foi possível carregar os detalhes do documento financeiro.")}
            </p>
            <Button asChild>
              <Link href="/financial/documents">{t("Voltar para lista")}</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button asChild variant="ghost" className="mr-4">
              <Link href="/financial/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("Voltar para lista")}
              </Link>
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isLoadingDocument ? (
                  <span className="flex items-center">
                    <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                    {t("Carregando...")}
                  </span>
                ) : (
                  t("Documento Financeiro #{{id}}", { id: documentId })
                )}
              </h1>
              {document && (
                <p className="text-muted-foreground">
                  {document.type === 'incoming' ? t("A Receber") : t("A Pagar")} - {document.entityName}
                </p>
              )}
            </div>
          </div>
          
          {document && (
            <div className="flex space-x-3">
              <Button asChild variant="outline">
                <Link href={`/financial/documents/edit/${documentId}`}>
                  {t("Editar Documento")}
                </Link>
              </Button>
              
              <Button asChild>
                <Link href={`/financial/documents/items/new?documentId=${documentId}`}>
                  {t("Adicionar Item")}
                </Link>
              </Button>
              
              {document.status !== "paid" && document.status !== "cancelled" && (
                <Button asChild>
                  <Link href={`/financial/documents/payments/new?documentId=${documentId}`}>
                    {t("Registrar Pagamento")}
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
        
        <DocumentDetails
          document={document}
          items={items}
          payments={payments}
          isLoading={isLoadingDocument}
          onAddItem={() => window.location.href = `/financial/documents/items/new?documentId=${documentId}`}
          onEditItem={(itemId) => window.location.href = `/financial/documents/items/edit/${itemId}`}
          onDeleteItem={handleDeleteItem}
          onAddPayment={() => window.location.href = `/financial/documents/payments/new?documentId=${documentId}`}
          onEditPayment={(paymentId) => window.location.href = `/financial/documents/payments/edit/${paymentId}`}
          onDeletePayment={handleDeletePayment}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </Layout>
  );
}