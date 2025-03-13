import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { useFinancialDocuments, useDeleteFinancialDocument, FinancialDocumentFilters } from "@/hooks/use-financial-documents";

import { Layout } from "@/components/layout/layout";
import { FinancialDocumentsTable } from "@/components/financial/documents-table";
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

export default function FinancialDocumentsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FinancialDocumentFilters>({});
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  
  // Carregar documentos financeiros
  const { 
    data: financialDocumentsData, 
    isLoading: isLoadingDocuments,
    isError
  } = useFinancialDocuments(filters);
  
  const documents = financialDocumentsData || [];
  
  // Mutation para excluir documento
  const deleteMutation = useDeleteFinancialDocument();
  
  // Confirmar e excluir documento
  const handleDeleteDocument = async (id: number) => {
    setDocumentToDelete(id);
  };
  
  // Executar a exclusão
  const confirmDelete = async () => {
    if (documentToDelete === null) return;
    
    try {
      await deleteMutation.mutateAsync(documentToDelete);
      toast({
        title: t("Documento excluído"),
        description: t("O documento financeiro foi excluído com sucesso."),
      });
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      toast({
        title: t("Erro ao excluir"),
        description: t("Ocorreu um erro ao excluir o documento. Tente novamente."),
        variant: "destructive",
      });
    } finally {
      setDocumentToDelete(null);
    }
  };
  
  // Cancelar a exclusão
  const cancelDelete = () => {
    setDocumentToDelete(null);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("Documentos Financeiros")}</h1>
          <p className="text-muted-foreground">
            {t("Gerencie todos os documentos financeiros, como faturas, recibos e pagamentos.")}
          </p>
        </div>

        {/* Tabela de Documentos */}
        <FinancialDocumentsTable
          documents={documents}
          isLoading={isLoadingDocuments}
          onDelete={handleDeleteDocument}
        />
        
        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={documentToDelete !== null} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Confirmar exclusão")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("Tem certeza que deseja excluir este documento financeiro? Esta ação irá remover todos os itens e pagamentos associados a este documento. Esta ação não pode ser desfeita.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>{t("Cancelar")}</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground" 
                onClick={confirmDelete}
              >
                {t("Excluir")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}