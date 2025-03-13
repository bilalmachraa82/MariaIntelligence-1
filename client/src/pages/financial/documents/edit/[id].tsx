import React from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "wouter";
import { toast } from "@/hooks/use-toast";
import { 
  useFinancialDocument, 
  useUpdateFinancialDocument 
} from "@/hooks/use-financial-documents";
import { useNavigate } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { DocumentForm } from "@/components/financial/document-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function EditDocumentPage() {
  const { t } = useTranslation();
  const [, params] = useRoute<{ id: string }>("/financial/documents/edit/:id");
  const [, navigate] = useNavigate();
  
  const documentId = params ? parseInt(params.id) : undefined;
  
  // Carregar documento existente
  const { 
    data: documentData, 
    isLoading: isLoadingDocument,
    isError: isDocumentError
  } = useFinancialDocument(documentId);
  
  // Extrair documento do resultado
  const document = documentData?.document;
  
  // Mutation para atualizar documento
  const updateMutation = useUpdateFinancialDocument();
  
  // Handler para submissão do formulário
  const handleSubmit = async (values: any) => {
    if (!documentId) return;
    
    try {
      // Converter valores para o formato esperado pela API
      const documentData = {
        ...values,
        // Converter valores de data para string no formato YYYY-MM-DD
        issueDate: values.issueDate.toISOString().split('T')[0],
        dueDate: values.dueDate.toISOString().split('T')[0],
        // Converter ID de entidade para número
        entityId: parseInt(values.entityId),
      };
      
      // Enviar para a API
      await updateMutation.mutateAsync({
        id: documentId,
        data: documentData
      });
      
      // Mostrar mensagem de sucesso
      toast({
        title: t("Documento atualizado"),
        description: t("O documento financeiro foi atualizado com sucesso.")
      });
      
      // Redirecionar para a página de detalhes
      navigate(`/financial/documents/${documentId}`);
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      
      // Mostrar mensagem de erro
      toast({
        title: t("Erro ao atualizar documento"),
        description: t("Ocorreu um erro ao atualizar o documento financeiro. Verifique os dados e tente novamente."),
        variant: "destructive"
      });
    }
  };
  
  // Preparar valores padrão para o formulário
  const getDefaultValues = () => {
    if (!document) return {};
    
    return {
      type: document.type,
      status: document.status,
      entityType: document.entityType,
      entityId: document.entityId.toString(),
      referenceMonth: document.referenceMonth,
      issueDate: new Date(document.issueDate),
      dueDate: new Date(document.dueDate),
      totalAmount: document.totalAmount,
      description: document.description || '',
      externalReference: document.externalReference || '',
    };
  };
  
  // Mostrar loading enquanto carrega
  if (isLoadingDocument) {
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
          
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-xl">{t("Carregando documento...")}</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Mostrar erro se não conseguir carregar
  if (isDocumentError || !document) {
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
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" className="mr-4">
            <Link href={`/financial/documents/${documentId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Voltar para detalhes")}
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("Editar Documento #{{id}}", { id: documentId })}
            </h1>
            <p className="text-muted-foreground">
              {t("Atualize os detalhes do documento financeiro.")}
            </p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <DocumentForm 
            defaultValues={getDefaultValues()}
            onSubmit={handleSubmit} 
            isSubmitting={updateMutation.isPending}
          />
        </div>
      </div>
    </Layout>
  );
}