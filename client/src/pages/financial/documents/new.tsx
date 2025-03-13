import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { useCreateFinancialDocument } from "@/hooks/use-financial-documents";
import { useNavigate } from "wouter";
import { ArrowLeft } from "lucide-react";

import { Layout } from "@/components/layout/layout";
import { DocumentForm } from "@/components/financial/document-form";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NewDocumentPage() {
  const { t } = useTranslation();
  const [, navigate] = useNavigate();
  
  // Mutation para criar um novo documento
  const createMutation = useCreateFinancialDocument();
  
  // Handler para submissão do formulário
  const handleSubmit = async (values: any) => {
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
      const result = await createMutation.mutateAsync(documentData);
      
      // Mostrar mensagem de sucesso
      toast({
        title: t("Documento criado"),
        description: t("O documento financeiro foi criado com sucesso.")
      });
      
      // Redirecionar para a página de detalhes
      navigate(`/financial/documents/${result.id}`);
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      
      // Mostrar mensagem de erro
      toast({
        title: t("Erro ao criar documento"),
        description: t("Ocorreu um erro ao criar o documento financeiro. Verifique os dados e tente novamente."),
        variant: "destructive"
      });
    }
  };

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
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("Novo Documento Financeiro")}</h1>
            <p className="text-muted-foreground">
              {t("Crie um novo documento financeiro para controlar receitas e despesas.")}
            </p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <DocumentForm 
            onSubmit={handleSubmit} 
            isSubmitting={createMutation.isPending}
          />
        </div>
      </div>
    </Layout>
  );
}