import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { Download, FileText, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Componente para baixar o manual do usuário em PDF
 * Permite ao usuário baixar o manual completo ou escolher seções específicas
 */
export default function UserManualDownload() {
  const { t, i18n } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const currentLanguage = i18n.language;

  // Função para gerar o PDF do manual
  const generateUserManual = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Configurações do documento
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Cores e estilos
      const primaryColor = "#007bff";
      const secondaryColor = "#6c757d";
      
      // Adicionar logo (usando retângulo colorido como placeholder)
      doc.setFillColor(primaryColor);
      doc.rect(margin, 15, 40, 15, 'F');
      doc.setTextColor("#ffffff");
      doc.setFontSize(14);
      doc.text("MARIA FAZ", margin + 5, 25);
      
      // Título
      doc.setTextColor("#000000");
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(t("settings.manual.pdfTitle", "Manual do Usuário"), margin, 50);
      
      // Subtítulo
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor);
      doc.setFont("helvetica", "normal");
      doc.text(t("settings.manual.pdfSubtitle", "Sistema de Gestão de Propriedades"), margin, 60);
      
      // Data de geração
      const today = new Date();
      const dateStr = today.toLocaleDateString(currentLanguage === 'pt-PT' ? 'pt-PT' : 'en-US');
      doc.setFontSize(10);
      doc.text(t("settings.manual.generated", "Gerado em: {{date}}", { date: dateStr }), margin, 70);
      
      // Adicionar índice
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#000000");
      doc.text(t("settings.manual.toc", "Índice"), margin, 20);
      
      const sections = [
        { id: "intro", title: t("settings.manual.sections.intro", "Introdução") },
        { id: "dashboard", title: t("settings.manual.sections.dashboard", "Painel Principal") },
        { id: "properties", title: t("settings.manual.sections.properties", "Gestão de Imóveis") },
        { id: "reservations", title: t("settings.manual.sections.reservations", "Reservas") },
        { id: "owners", title: t("settings.manual.sections.owners", "Proprietários") },
        { id: "cleaning", title: t("settings.manual.sections.cleaning", "Equipas de Limpeza") },
        { id: "reports", title: t("settings.manual.sections.reports", "Relatórios") },
        { id: "documents", title: t("settings.manual.sections.documents", "Processamento de Documentos") },
        { id: "settings", title: t("settings.manual.sections.settings", "Configurações") },
      ];
      
      // Desenhar índice
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor("#000000");
      
      sections.forEach((section, index) => {
        const y = 30 + (index * 10);
        doc.text(`${index + 1}. ${section.title}`, margin, y);
      });
      
      // Adicionar conteúdo das seções
      sections.forEach((section, index) => {
        doc.addPage();
        
        // Título da seção
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor);
        doc.text(`${index + 1}. ${section.title}`, margin, 20);
        
        // Conteúdo da seção
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor("#000000");
        
        let sectionContent = "";
        
        switch (section.id) {
          case "intro":
            sectionContent = t("settings.manual.content.intro", 
              "O sistema Maria Faz é uma solução completa para gestão de propriedades, " +
              "especialmente desenvolvida para empresas que gerenciam imóveis para aluguel de curta duração. " +
              "Esta plataforma integra funcionalidades essenciais como gestão de reservas, " +
              "controle de limpeza, comunicação com proprietários e geração de relatórios financeiros.");
            break;
          case "dashboard":
            sectionContent = t("settings.manual.content.dashboard", 
              "O Painel Principal oferece uma visão geral do seu negócio com métricas importantes: " +
              "\n\n• Resumo de reservas atuais e futuras " +
              "\n• Estatísticas de ocupação e receita " +
              "\n• Atividades recentes no sistema " +
              "\n• Tarefas pendentes e próximas limpezas");
            break;
          case "properties":
            sectionContent = t("settings.manual.content.properties", 
              "O módulo de Gestão de Imóveis permite cadastrar e gerenciar todas as propriedades: " +
              "\n\n• Cadastro completo de imóveis com fotos e características " +
              "\n• Vinculação com proprietários " +
              "\n• Definição de regras e taxas específicas " +
              "\n• Calendário de disponibilidade " +
              "\n• Histórico de reservas e manutenções");
            break;
          case "reservations":
            sectionContent = t("settings.manual.content.reservations", 
              "O sistema de Reservas facilita o gerenciamento completo dos aluguéis: " +
              "\n\n• Criação manual de reservas " +
              "\n• Importação automatizada de PDFs de plataformas (Airbnb, Booking, etc.) " +
              "\n• Processamento de check-ins e check-outs " +
              "\n• Gestão de pagamentos " +
              "\n• Comunicação com hóspedes");
            break;
          case "owners":
            sectionContent = t("settings.manual.content.owners", 
              "O módulo de Proprietários permite gerenciar: " +
              "\n\n• Cadastro de proprietários e contatos " +
              "\n• Contratos e acordos financeiros " +
              "\n• Geração de relatórios financeiros " +
              "\n• Envio automático de relatórios por email " +
              "\n• Histórico de comunicações");
            break;
          case "cleaning":
            sectionContent = t("settings.manual.content.cleaning", 
              "A gestão de Equipas de Limpeza inclui: " +
              "\n\n• Cadastro de equipas e membros " +
              "\n• Agendamento automático de limpezas " +
              "\n• Notificações e lembretes " +
              "\n• Relatórios de desempenho " +
              "\n• Gestão de pagamentos");
            break;
          case "reports":
            sectionContent = t("settings.manual.content.reports", 
              "O sistema oferece relatórios detalhados para análise do negócio: " +
              "\n\n• Relatórios financeiros por período " +
              "\n• Relatórios por proprietário " +
              "\n• Análise de ocupação e sazonalidade " +
              "\n• Desempenho por propriedade " +
              "\n• Exportação em PDF e envio por email");
            break;
          case "documents":
            sectionContent = t("settings.manual.content.documents", 
              "O Processamento de Documentos automatiza tarefas através de IA: " +
              "\n\n• Upload de PDFs de reservas " +
              "\n• Extração automática de dados com IA " +
              "\n• Reconhecimento de documentos de check-in e check-out " +
              "\n• Processamento de comprovantes e faturas " +
              "\n• Validação inteligente de dados");
            break;
          case "settings":
            sectionContent = t("settings.manual.content.settings", 
              "Nas Configurações do sistema você pode personalizar: " +
              "\n\n• Preferências gerais e idioma " +
              "\n• Configurações de notificações " +
              "\n• Integração com serviços externos " +
              "\n• Gestão de usuários e permissões " +
              "\n• Backup e recuperação de dados");
            break;
        }
        
        // Quebrar texto em múltiplas linhas
        const splitText = doc.splitTextToSize(sectionContent, contentWidth);
        doc.text(splitText, margin, 30);
      });
      
      // Adicionar rodapé
      try {
        // @ts-ignore - Método disponível mas não reconhecido corretamente pelo TypeScript
        const totalPages = doc.internal.pages.length - 1;
        
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(secondaryColor);
          doc.text(
            t("settings.manual.footer", "Maria Faz - Sistema de Gestão de Propriedades - Página {{page}} de {{total}}", 
              { page: i, total: totalPages }
            ), 
            pageWidth / 2, 
            doc.internal.pageSize.getHeight() - 10, 
            { align: "center" }
          );
        }
      } catch (error) {
        console.error("Erro ao adicionar rodapé:", error);
      }
      
      // Salvar o PDF
      doc.save("manual-maria-faz.pdf");
    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t("settings.manual.alertTitle", "Manual do Sistema")}</AlertTitle>
        <AlertDescription>
          {t("settings.manual.alertDesc", "Este manual contém todas as instruções para utilizar o sistema Maria Faz. Você pode baixar a versão completa ou visualizar seções específicas abaixo.")}
        </AlertDescription>
      </Alert>
      
      <div className="flex space-x-4">
        <Button
          onClick={generateUserManual}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isGenerating
            ? t("settings.manual.generating", "Gerando PDF...")
            : t("settings.manual.download", "Baixar Manual Completo")}
        </Button>
        
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {t("settings.manual.view", "Visualizar Online")}
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="intro" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto py-2 justify-start overflow-x-auto gap-1">
          <TabsTrigger value="intro">
            {t("settings.manual.sections.intro", "Introdução")}
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            {t("settings.manual.sections.dashboard", "Painel Principal")}
          </TabsTrigger>
          <TabsTrigger value="properties">
            {t("settings.manual.sections.properties", "Gestão de Imóveis")}
          </TabsTrigger>
          <TabsTrigger value="reservations">
            {t("settings.manual.sections.reservations", "Reservas")}
          </TabsTrigger>
          <TabsTrigger value="documents">
            {t("settings.manual.sections.documents", "Processamento de Documentos")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="intro" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">
                {t("settings.manual.sections.intro", "Introdução")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("settings.manual.content.intro", 
                  "O sistema Maria Faz é uma solução completa para gestão de propriedades, " +
                  "especialmente desenvolvida para empresas que gerenciam imóveis para aluguel de curta duração. " +
                  "Esta plataforma integra funcionalidades essenciais como gestão de reservas, " +
                  "controle de limpeza, comunicação com proprietários e geração de relatórios financeiros.")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dashboard" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">
                {t("settings.manual.sections.dashboard", "Painel Principal")}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t("settings.manual.content.dashboardIntro", 
                  "O Painel Principal oferece uma visão geral do seu negócio com métricas importantes:")}
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>{t("settings.manual.content.dashboardBullet1", "Resumo de reservas atuais e futuras")}</li>
                <li>{t("settings.manual.content.dashboardBullet2", "Estatísticas de ocupação e receita")}</li>
                <li>{t("settings.manual.content.dashboardBullet3", "Atividades recentes no sistema")}</li>
                <li>{t("settings.manual.content.dashboardBullet4", "Tarefas pendentes e próximas limpezas")}</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="properties" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">
                {t("settings.manual.sections.properties", "Gestão de Imóveis")}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t("settings.manual.content.propertiesIntro", 
                  "O módulo de Gestão de Imóveis permite cadastrar e gerenciar todas as propriedades:")}
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>{t("settings.manual.content.propertiesBullet1", "Cadastro completo de imóveis com fotos e características")}</li>
                <li>{t("settings.manual.content.propertiesBullet2", "Vinculação com proprietários")}</li>
                <li>{t("settings.manual.content.propertiesBullet3", "Definição de regras e taxas específicas")}</li>
                <li>{t("settings.manual.content.propertiesBullet4", "Calendário de disponibilidade")}</li>
                <li>{t("settings.manual.content.propertiesBullet5", "Histórico de reservas e manutenções")}</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reservations" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">
                {t("settings.manual.sections.reservations", "Reservas")}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t("settings.manual.content.reservationsIntro", 
                  "O sistema de Reservas facilita o gerenciamento completo dos aluguéis:")}
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>{t("settings.manual.content.reservationsBullet1", "Criação manual de reservas")}</li>
                <li>{t("settings.manual.content.reservationsBullet2", "Importação automatizada de PDFs de plataformas (Airbnb, Booking, etc.)")}</li>
                <li>{t("settings.manual.content.reservationsBullet3", "Processamento de check-ins e check-outs")}</li>
                <li>{t("settings.manual.content.reservationsBullet4", "Gestão de pagamentos")}</li>
                <li>{t("settings.manual.content.reservationsBullet5", "Comunicação com hóspedes")}</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">
                {t("settings.manual.sections.documents", "Processamento de Documentos")}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t("settings.manual.content.documentsIntro", 
                  "O Processamento de Documentos automatiza tarefas através de IA:")}
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>{t("settings.manual.content.documentsBullet1", "Upload de PDFs de reservas")}</li>
                <li>{t("settings.manual.content.documentsBullet2", "Extração automática de dados com IA")}</li>
                <li>{t("settings.manual.content.documentsBullet3", "Reconhecimento de documentos de check-in e check-out")}</li>
                <li>{t("settings.manual.content.documentsBullet4", "Processamento de comprovantes e faturas")}</li>
                <li>{t("settings.manual.content.documentsBullet5", "Validação inteligente de dados")}</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}