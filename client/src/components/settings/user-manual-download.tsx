import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { 
  Check, Download, FileText, Info, BookOpen, 
  Layout, Home, Building2, Calendar, Users, 
  Settings, ClipboardCheck, BarChart2, 
  FileSearch, ChevronRight, Eye, CheckCircle,
  Layers, Play, Lock, Activity, PieChart,
  TrendingUp, DollarSign, FileSpreadsheet
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

/**
 * Componente para baixar o manual do usuário em PDF com um visual ultra moderno
 * Permite ao usuário baixar o manual completo ou escolher seções específicas
 * Inclui elementos visuais como ícones, animações e estilos modernos
 */
export default function UserManualDownload() {
  const { t, i18n } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("intro");
  const [showTip, setShowTip] = useState(false);
  const [viewingOnline, setViewingOnline] = useState(false);
  const currentLanguage = i18n.language;

  // Simula progresso durante a geração do PDF
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isGenerating]);

  // Exibe uma dica aleatória após um tempo
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTip(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Função para gerar o PDF do manual
  const generateUserManual = async () => {
    setIsGenerating(true);
    setProgress(0);
    
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
      const primaryColor = "#E5A4A4"; // Cor corporativa do Maria Faz
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
        { id: "intro", title: t("settings.manual.sections.intro", "Introdução"), icon: BookOpen },
        { id: "dashboard", title: t("settings.manual.sections.dashboard", "Painel Principal"), icon: Home },
        { id: "properties", title: t("settings.manual.sections.properties", "Gestão de Imóveis"), icon: Building2 },
        { id: "reservations", title: t("settings.manual.sections.reservations", "Reservas"), icon: Calendar },
        { id: "owners", title: t("settings.manual.sections.owners", "Proprietários"), icon: Users },
        { id: "cleaning", title: t("settings.manual.sections.cleaning", "Equipas de Limpeza"), icon: ClipboardCheck },
        { id: "reports", title: t("settings.manual.sections.reports", "Relatórios"), icon: BarChart2 },
        { id: "documents", title: t("settings.manual.sections.documents", "Processamento de Documentos"), icon: FileSearch },
        { id: "settings", title: t("settings.manual.sections.settings", "Configurações"), icon: Settings },
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
              "\n\n• Cadastro completo de imóveis com nome, endereço e características " +
              "\n• Vinculação com proprietários " +
              "\n• Definição de custos de limpeza e manutenção " +
              "\n• Visualização de reservas associadas " +
              "\n• Ativação/desativação de propriedades");
            break;
          case "reservations":
            sectionContent = t("settings.manual.content.reservations", 
              "O sistema de Reservas facilita o gerenciamento completo dos aluguéis: " +
              "\n\n• Criação manual de novas reservas com todos os detalhes necessários " +
              "\n• Processamento automático de PDFs de reservas via Google Gemini " +
              "\n• Visualização de reservas por propriedade e status " +
              "\n• Rastreamento de valores, taxas e custos associados " +
              "\n• Gestão de status das reservas (confirmada, em andamento, concluída, cancelada)");
            break;
          case "owners":
            sectionContent = t("settings.manual.content.owners", 
              "O módulo de Proprietários permite gerenciar: " +
              "\n\n• Cadastro de proprietários com informações de contato " +
              "\n• Associação de proprietários com suas propriedades " +
              "\n• Visualização de relatórios financeiros por proprietário " +
              "\n• Exportação de relatórios em PDF para compartilhamento " +
              "\n• Envio de relatórios mensais por email quando configurado");
            break;
          case "cleaning":
            sectionContent = t("settings.manual.content.cleaning", 
              "A gestão de Equipas de Limpeza inclui: " +
              "\n\n• Cadastro de equipas de limpeza e seus membros " +
              "\n• Visualização de propriedades atribuídas a cada equipa " +
              "\n• Registro de custos e valores de pagamento " +
              "\n• Associação de limpezas às reservas " +
              "\n• Histórico de trabalhos realizados por equipa");
            break;
          case "reports":
            sectionContent = t("settings.manual.content.reports", 
              "O sistema oferece relatórios detalhados para análise do negócio: " +
              "\n\n• Relatórios financeiros por período: Acompanhe receitas, despesas e lucro líquido com gráficos que se adaptam automaticamente ao período selecionado (semanal, mensal ou anual)." +
              "\n\n• Relatórios por proprietário: Demonstrativo financeiro detalhado para cada proprietário, incluindo rendimentos brutos, taxas e rendimento líquido, com opção de envio por email." +
              "\n\n• Análise de ocupação: Visualização gráfica da taxa de ocupação das propriedades, ajudando a identificar padrões de sazonalidade e períodos de alta demanda." +
              "\n\n• Painel de estatísticas: Visão geral com principais métricas como taxa de ocupação atual, receita total, lucro líquido e número de reservas ativas." +
              "\n\n• Tendências de receita: Acompanhamento visual da evolução das receitas ao longo do tempo, com comparativos entre períodos similares.");
            break;
          case "documents":
            sectionContent = t("settings.manual.content.documents", 
              "O Processamento de Documentos automatiza tarefas através da IA Google Gemini: " +
              "\n\n• Processamento de PDFs de Reservas: Faça upload de confirmações de reservas das plataformas principais e o sistema extrairá automaticamente todos os dados relevantes como nome do hóspede, datas, valores e detalhes da propriedade." +
              "\n\n• Processamento de Check-ins e Check-outs: O sistema pode processar documentos de entrada e saída, extraindo as informações específicas de cada tipo." +
              "\n\n• Extração Inteligente: A IA identifica automaticamente as informações importantes no documento, mesmo quando o formato varia entre diferentes plataformas." +
              "\n\n• Revisão de Dados: Após a extração automática, você pode revisar e ajustar qualquer informação antes de confirmar a criação da reserva." +
              "\n\n• Validação de Dados: O sistema verifica a consistência das informações extraídas, alertando sobre possíveis erros ou inconsistências.");
            break;
          case "settings":
            sectionContent = t("settings.manual.content.settings", 
              "Nas Configurações do sistema você pode: " +
              "\n\n• Alterar o idioma da interface (Português, Inglês) " +
              "\n• Gerenciar propriedades e seus detalhes " +
              "\n• Configurar equipas de limpeza e seus membros " +
              "\n• Acessar o manual do usuário e guias de uso " +
              "\n• Visualizar e baixar o manual em PDF para referência offline");
            break;
        }
        
        // Quebrar texto em múltiplas linhas
        const splitText = doc.splitTextToSize(sectionContent, contentWidth);
        doc.text(splitText, margin, 30);
        
        // Adicionar informação sobre capturas de tela ilustrativas
        try {
          let y = 30 + splitText.length * 5;
          
          // Verifica se ainda há espaço suficiente na página atual
          const remainingSpace = doc.internal.pageSize.getHeight() - y - 20;
          if (remainingSpace < 40) {
            doc.addPage();
            y = 20;
          }
          
          // Adiciona título para a captura de tela
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(primaryColor);
          doc.text(t("settings.manual.screenshot.title", "Informação Visual"), margin, y);
          y += 8;
          
          // Texto informativo sobre capturas de tela
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          const hintText = t(
            "settings.manual.screenshot.hint", 
            "Para visualizar capturas de tela detalhadas de cada módulo, acesse a visualização online do manual ou utilize o sistema diretamente. A interface apresenta um design moderno, responsivo e adaptado para uso em dispositivos móveis e desktop."
          );
          
          const hintSplitText = doc.splitTextToSize(hintText, contentWidth);
          doc.text(hintSplitText, margin, y);
          
          y += hintSplitText.length * 5 + 10;
          
          // Caixa com dicas para o módulo específico
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'FD');
          
          // Título da dica
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(primaryColor);
          doc.text(t("settings.manual.screenshot.tips", "Dicas de Uso:"), margin + 5, y + 10);
          
          // Conteúdo da dica específica para este módulo
          let tipText = "";
          if (section.id === "dashboard") {
            tipText = t("settings.manual.tips.dashboard", "O dashboard principal oferece uma visão completa da ocupação, receitas e próximos check-ins. Utilize os filtros de período para refinar a análise.");
          } else if (section.id === "reports") {
            tipText = t("settings.manual.tips.reports", "Os relatórios financeiros podem ser exportados em PDF ou enviados por email diretamente para proprietários. Use os filtros de data para análises específicas.");
          } else if (section.id === "documents") {
            tipText = t("settings.manual.tips.documents", "Para processar documentos em lote, utilize a opção 'Upload Múltiplo'. O sistema identificará automaticamente quais são check-ins e check-outs.");
          } else if (section.id === "reservations") {
            tipText = t("settings.manual.tips.reservations", "Você pode criar reservas manualmente ou processá-las automaticamente através de PDFs. Todas as plataformas principais são suportadas.");
          } else if (section.id === "properties") {
            tipText = t("settings.manual.tips.properties", "Mantenha as informações das propriedades atualizadas para cálculos precisos de rentabilidade e relatórios de proprietários.");
          }
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          const tipSplitText = doc.splitTextToSize(tipText, contentWidth - 10);
          doc.text(tipSplitText, margin + 5, y + 15);
          
        } catch (error) {
          console.error("Erro ao adicionar informações visuais:", error);
        }
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

  // Ícones para cada seção
  const sectionIcons = {
    intro: <BookOpen className="h-5 w-5 text-primary" />,
    dashboard: <Layout className="h-5 w-5 text-primary" />,
    properties: <Building2 className="h-5 w-5 text-primary" />,
    reservations: <Calendar className="h-5 w-5 text-primary" />,
    documents: <FileSearch className="h-5 w-5 text-primary" />,
    reports: <BarChart2 className="h-5 w-5 text-primary" />,
    owners: <Users className="h-5 w-5 text-primary" />,
    cleaning: <ClipboardCheck className="h-5 w-5 text-primary" />,
    settings: <Settings className="h-5 w-5 text-primary" />
  };

  return (
    <div className="space-y-8">
      {/* Hero section com design moderno */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-primary/5 p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary/10 rounded-full -ml-10 -mb-10" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              {t("settings.manual.hero.title", "Manual Interativo Maria Faz")}
            </h2>
            <p className="text-muted-foreground">
              {t("settings.manual.hero.subtitle", "Aprenda como maximizar o uso do sistema com nosso guia completo")}
            </p>
            
            {showTip && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-lg p-3 text-sm flex gap-2 items-start"
              >
                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-800 dark:text-yellow-200">
                  {t("settings.manual.hero.tip", "Dica: Você pode imprimir o manual ou salvá-lo em PDF para consulta offline a qualquer momento.")}
                </p>
              </motion.div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={generateUserManual}
              disabled={isGenerating}
              className="relative overflow-hidden group"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    className="absolute inset-0 bg-primary/20"
                    style={{ originX: 0 }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <Download className="h-4 w-4 animate-bounce" />
                    {t("settings.manual.generating", "Gerando PDF...")}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4 group-hover:animate-bounce" />
                  {t("settings.manual.download", "Baixar PDF")}
                </span>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="group"
              onClick={() => setViewingOnline(!viewingOnline)}
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 group-hover:text-primary transition-colors" />
                {viewingOnline 
                  ? t("settings.manual.hideOnline", "Ocultar Visualização") 
                  : t("settings.manual.view", "Visualizar Online")}
              </span>
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Mensagem quando a visualização online está ativa */}
      {viewingOnline && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 flex items-start gap-3"
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-full flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              {t("settings.manual.onlineView.title", "Visualização Online Ativada")}
            </h3>
            <p className="text-sm text-blue-700/80 dark:text-blue-300/80">
              {t("settings.manual.onlineView.description", "Você está visualizando o manual completo diretamente no navegador. Navegue pelas seções usando os botões abaixo.")}
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Tabs de navegação do manual com design moderno */}
      <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 ${!viewingOnline && "hidden"}`}>
        {/* Sidebar com índice */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {t("settings.manual.sections.title", "Módulos do Sistema")}
            </h3>
            
            <div className="space-y-1">
              {Object.entries(sectionIcons).map(([key, icon]) => (
                <motion.button
                  key={key}
                  whileHover={{ x: 4 }}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-2 text-left py-2 px-3 rounded-md text-sm transition-colors ${
                    activeTab === key 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {icon}
                  <span>
                    {t(`settings.manual.sections.${key}`, key.charAt(0).toUpperCase() + key.slice(1))}
                  </span>
                  {activeTab === key && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </motion.button>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground">
                {t("settings.manual.progress.title", "Progresso de Aprendizado")}
              </h4>
              <Progress value={60} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t("settings.manual.progress.description", "60% do manual consultado")}
              </p>
            </div>
          </div>
          
          <Card className="border-green-100 dark:border-green-800/30 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                {t("settings.manual.recommendation.title", "Recomendado")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("settings.manual.recommendation.text", "Aprenda como processar PDFs de check-in e check-out automaticamente com nossa IA.")}
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full" disabled>
                <span className="flex items-center gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  {t("settings.manual.recommendation.cta", "Consultar documentação")}
                </span>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Conteúdo principal */}
        <div className="md:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto py-2 justify-start overflow-x-auto gap-1">
              <TabsTrigger value="intro" className="gap-1">
                <BookOpen className="h-4 w-4" />
                {t("settings.manual.sections.intro", "Introdução")}
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-1">
                <Layout className="h-4 w-4" />
                {t("settings.manual.sections.dashboard", "Painel Principal")}
              </TabsTrigger>
              <TabsTrigger value="properties" className="gap-1">
                <Building2 className="h-4 w-4" />
                {t("settings.manual.sections.properties", "Gestão de Imóveis")}
              </TabsTrigger>
              <TabsTrigger value="reservations" className="gap-1">
                <Calendar className="h-4 w-4" />
                {t("settings.manual.sections.reservations", "Reservas")}
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1">
                <FileSearch className="h-4 w-4" />
                {t("settings.manual.sections.documents", "Documentos")}
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1">
                <BarChart2 className="h-4 w-4" />
                {t("settings.manual.sections.reports", "Relatórios")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="pt-4 space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                          {t("settings.manual.badges.reports", "Análise de Dados")}
                        </Badge>
                        <CardTitle className="text-xl">
                          {t("settings.manual.sections.reports", "Relatórios Detalhados")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.manual.reports.description", "Análises financeiras e operacionais para tomada de decisões")}
                        </CardDescription>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart2 className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                      {t("settings.manual.content.reportsIntro", "O sistema oferece relatórios detalhados para análise do negócio:")}
                    </p>
                    
                    <div className="space-y-4">
                      {/* Relatório financeiro */}
                      <Card className="overflow-hidden border-primary/10">
                        <div className="bg-primary/5 px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Relatórios financeiros por período</h3>
                          </div>
                        </div>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            Acompanhe receitas, despesas e lucro líquido em diferentes períodos (diário, semanal, mensal, anual). Inclui gráficos de tendências e comparativos com períodos anteriores.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Receita</Badge>
                            <Badge variant="outline">Despesas</Badge>
                            <Badge variant="outline">Lucro</Badge>
                            <Badge variant="outline">Exportação</Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Relatório proprietário */}
                      <Card className="overflow-hidden border-primary/10">
                        <div className="bg-primary/5 px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Relatórios por proprietário</h3>
                          </div>
                        </div>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            Demonstrativo financeiro detalhado para cada proprietário, incluindo rendimentos brutos, taxas, despesas e rendimento líquido. Pode ser enviado automaticamente por email em base mensal.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Email</Badge>
                            <Badge variant="outline">PDF</Badge>
                            <Badge variant="outline">Mensal</Badge>
                            <Badge variant="outline">Personalizado</Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Relatório ocupação */}
                      <Card className="overflow-hidden border-primary/10">
                        <div className="bg-primary/5 px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Relatório de ocupação</h3>
                          </div>
                        </div>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            Análise detalhada de taxas de ocupação por propriedade, região e período, permitindo identificar padrões de sazonalidade e oportunidades de precificação dinâmica.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Sazonalidade</Badge>
                            <Badge variant="outline">Taxa de ocupação</Badge>
                            <Badge variant="outline">Previsões</Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Relatório desempenho */}
                      <Card className="overflow-hidden border-primary/10">
                        <div className="bg-primary/5 px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <h3 className="font-medium">Relatório de desempenho por propriedade</h3>
                          </div>
                        </div>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            Métricas detalhadas de ROI, receita por noite, taxa de conversão de reservas e avaliações de hóspedes para cada propriedade.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">ROI</Badge>
                            <Badge variant="outline">Comparativo</Badge>
                            <Badge variant="outline">Avaliações</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="documents" className="pt-4 space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                          {t("settings.manual.badges.ai", "Inteligência Artificial")}
                        </Badge>
                        <CardTitle className="text-xl">
                          {t("settings.manual.sections.documents", "Processamento de Documentos")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.manual.documents.description", "Extração automática de dados de documentos através de IA")}
                        </CardDescription>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileSearch className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                      {t("settings.manual.content.documentsIntro", "O Processamento de Documentos automatiza tarefas através de IA:")}
                    </p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Tipos de documentos suportados */}
                      <Card className="border-primary/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {t("settings.manual.documents.types.title", "Documentos suportados")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.types.pdfs", "PDFs de reservas")}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.types.checkin", "Formulários de check-in")}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.types.checkout", "Relatórios de check-out")}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.types.invoices", "Faturas e recibos")}</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Dados extraídos */}
                      <Card className="border-primary/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {t("settings.manual.documents.data.title", "Dados extraídos")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.data.guest", "Dados do hóspede")}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.data.dates", "Datas de check-in/check-out")}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.data.amounts", "Valores e taxas")}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>{t("settings.manual.documents.data.property", "Propriedade e plataforma")}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Processo de processamento */}
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        {t("settings.manual.documents.process.title", "Processo de Processamento")}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-primary/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</span>
                              {t("settings.manual.documents.process.upload", "Upload de Documento")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {t("settings.manual.documents.process.upload.desc", "Faça upload do PDF ou imagem através do sistema")}
                          </CardContent>
                        </Card>
                        
                        <Card className="border-primary/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</span>
                              {t("settings.manual.documents.process.extraction", "Extração com IA")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {t("settings.manual.documents.process.extraction.desc", "A IA processa e extrai todos os dados relevantes")}
                          </CardContent>
                        </Card>
                        
                        <Card className="border-primary/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</span>
                              {t("settings.manual.documents.process.validation", "Validação e Finalização")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-muted-foreground">
                            {t("settings.manual.documents.process.validation.desc", "Verifique e ajuste os dados antes de confirmar")}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    {/* AI Feature Box */}
                    <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-6 mt-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/20 rounded-full p-3">
                          <FileSearch className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            {t("settings.manual.ai.title", "Tecnologia Avançada de IA")}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            O Maria Faz utiliza o modelo Mistral AI para extrair dados de documentos de forma inteligente e precisa, com reconhecimento automático e validação contextual.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Extração OCR</Badge>
                            <Badge variant="secondary">Reconhecimento Semântico</Badge>
                            <Badge variant="secondary">Validação Inteligente</Badge>
                            <Badge variant="secondary">Processamento em Lote</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="intro" className="pt-4 space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/20">
                          {t("settings.manual.badges.overview", "Visão geral")}
                        </Badge>
                        <CardTitle className="text-xl">
                          {t("settings.manual.sections.intro", "Introdução ao Sistema")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.manual.intro.description", "Conheça o Maria Faz e suas principais funcionalidades")}
                        </CardDescription>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white mb-6">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
                      <div className="relative z-10">
                        <h3 className="text-lg font-semibold mb-2">
                          {t("settings.manual.intro.welcome", "Bem-vindo ao Maria Faz")}
                        </h3>
                        <p className="text-sm text-gray-300 mb-4">
                          {t("settings.manual.intro.tagline", "Uma solução completa para gestão de propriedades de aluguel de curta duração")}
                        </p>
                        <div className="flex gap-4">
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold">35+</span>
                            <span className="text-xs text-gray-400">{t("settings.manual.intro.stats.properties", "Propriedades")}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold">250+</span>
                            <span className="text-xs text-gray-400">{t("settings.manual.intro.stats.reservations", "Reservas/mês")}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold">98%</span>
                            <span className="text-xs text-gray-400">{t("settings.manual.intro.stats.accuracy", "Precisão na IA")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Layout className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-medium mb-1">{t("settings.manual.intro.features.interface", "Interface Intuitiva")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.manual.intro.features.interface.desc", "Design moderno e responsivo adaptado para todos os dispositivos")}
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Calendar className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-medium mb-1">{t("settings.manual.intro.features.reservations", "Gestão de Reservas")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.manual.intro.features.reservations.desc", "Controle completo de check-ins, check-outs e pagamentos")}
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <FileSearch className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-medium mb-1">{t("settings.manual.intro.features.ai", "Processamento com IA")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.manual.intro.features.ai.desc", "Extração automática de dados de documentos e PDFs")}
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <BarChart2 className="h-8 w-8 text-primary mb-2" />
                        <h3 className="font-medium mb-1">{t("settings.manual.intro.features.reports", "Relatórios Detalhados")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t("settings.manual.intro.features.reports.desc", "Análises financeiras e operacionais personalizáveis")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-medium mb-2">
                        {t("settings.manual.intro.getStarted", "Primeiros Passos")}
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{t("settings.manual.intro.steps.first", "Cadastre suas propriedades e proprietários")}</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{t("settings.manual.intro.steps.second", "Configure suas taxas e regras de negócio")}</span>
                        </li>
                        <li className="flex gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{t("settings.manual.intro.steps.third", "Importe reservas existentes ou crie novas manualmente")}</span>
                        </li>
                      </ul>
                    </div>
                    

                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="dashboard" className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30">
                          {t("settings.manual.badges.essential", "Essencial")}
                        </Badge>
                        <CardTitle>
                          {t("settings.manual.sections.dashboard", "Painel Principal")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.manual.dashboard.description", "Centro de controle com todas as métricas importantes")}
                        </CardDescription>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <Layout className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 border-b">
                        <h3 className="font-medium">{t("settings.manual.dashboard.overview", "Visão Geral do Dashboard")}</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          {t("settings.manual.content.dashboardIntro", 
                            "O Painel Principal oferece uma visão geral do seu negócio com métricas importantes:")}
                        </p>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <div className="mt-1 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">{t("settings.manual.content.dashboardBullet1", "Resumo de reservas atuais e futuras")}</h4>
                              <p className="text-xs text-muted-foreground">{t("settings.manual.dashboard.reservations.desc", "Visualize check-ins e check-outs programados para hoje e amanhã")}</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="mt-1 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                              <BarChart2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">{t("settings.manual.content.dashboardBullet2", "Estatísticas de ocupação e receita")}</h4>
                              <p className="text-xs text-muted-foreground">{t("settings.manual.dashboard.stats.desc", "Acompanhe a receita e ocupação com gráficos interativos por período")}</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="mt-1 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                              <Activity className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">{t("settings.manual.content.dashboardBullet3", "Atividades recentes no sistema")}</h4>
                              <p className="text-xs text-muted-foreground">{t("settings.manual.dashboard.activities.desc", "Histórico das ações realizadas por você e sua equipe")}</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="mt-1 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                              <ClipboardCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">{t("settings.manual.content.dashboardBullet4", "Tarefas pendentes e próximas limpezas")}</h4>
                              <p className="text-xs text-muted-foreground">{t("settings.manual.dashboard.tasks.desc", "Lista de tarefas a serem realizadas e agendamento de limpezas")}</p>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="overflow-hidden border border-blue-100 dark:border-blue-800/30">
                        <CardHeader className="p-4 pb-2 bg-blue-50 dark:bg-blue-900/10">
                          <CardTitle className="text-sm text-blue-700 dark:text-blue-300">
                            {t("settings.manual.dashboard.tips.title", "Dicas e Truques")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.dashboard.tips.content", "Configure seus widgets favoritos clicando no ícone de engrenagem em cada bloco do dashboard. Arraste e reorganize os blocos conforme sua preferência.")}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="overflow-hidden border border-purple-100 dark:border-purple-800/30">
                        <CardHeader className="p-4 pb-2 bg-purple-50 dark:bg-purple-900/10">
                          <CardTitle className="text-sm text-purple-700 dark:text-purple-300">
                            {t("settings.manual.dashboard.shortcuts.title", "Atalhos Rápidos")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <kbd className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">R</kbd>
                              <span className="text-xs text-muted-foreground">{t("settings.manual.dashboard.shortcuts.reservations", "Reservas")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <kbd className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">P</kbd>
                              <span className="text-xs text-muted-foreground">{t("settings.manual.dashboard.shortcuts.properties", "Propriedades")}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="properties" className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
                          {t("settings.manual.badges.core", "Módulo central")}
                        </Badge>
                        <CardTitle>
                          {t("settings.manual.sections.properties", "Gestão de Imóveis")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.manual.properties.description", "Cadastro e administração de todas as propriedades")}
                        </CardDescription>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      {t("settings.manual.content.propertiesIntro", 
                        "O módulo de Gestão de Imóveis permite cadastrar e gerenciar todas as propriedades:")}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="relative overflow-hidden group rounded-lg border p-4 hover:border-primary/50 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {t("settings.manual.content.propertiesBullet1", "Cadastro completo")}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.properties.bullet1.desc", "Registre todos os detalhes das propriedades incluindo fotos e informações de localização.")}
                          </p>
                        </div>
                        
                        <div className="relative overflow-hidden group rounded-lg border p-4 hover:border-primary/50 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {t("settings.manual.content.propertiesBullet2", "Gestão de proprietários")}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.properties.bullet2.desc", "Associe propriedades aos seus respectivos proprietários para relatórios financeiros.")}
                          </p>
                        </div>
                        
                        <div className="relative overflow-hidden group rounded-lg border p-4 hover:border-primary/50 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {t("settings.manual.content.propertiesBullet3", "Custos operacionais")}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.properties.bullet3.desc", "Configure custos de limpeza, check-in e outras taxas específicas para cada imóvel.")}
                          </p>
                        </div>
                        
                        <div className="relative overflow-hidden group rounded-lg border p-4 hover:border-primary/50 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {t("settings.manual.content.propertiesBullet4", "Estatísticas detalhadas")}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.properties.bullet4.desc", "Acompanhe a taxa de ocupação, receita média e lucro para cada propriedade.")}
                          </p>
                        </div>
                        
                        <div className="relative overflow-hidden group rounded-lg border p-4 hover:border-primary/50 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {t("settings.manual.content.propertiesBullet5", "Associação a plataformas")}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.properties.bullet5.desc", "Vincule suas propriedades a plataformas como Airbnb e Booking para facilitar o gerenciamento.")}
                          </p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-4">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        {t("settings.manual.properties.import.title", "Importação de Propriedades")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.manual.properties.import.desc", "Para importar propriedades em massa, utilize nosso modelo de planilha Excel ou CSV. Acesse 'Importar' no menu de Propriedades.")}
                      </p>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="text-xs" disabled>
                          {t("settings.manual.properties.import.downloadTemplate", "Baixar modelo de importação")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="reservations" className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30">
                          {t("settings.manual.badges.revenue", "Receita")}
                        </Badge>
                        <CardTitle>
                          {t("settings.manual.sections.reservations", "Gestão de Reservas")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.manual.reservations.description", "Controle completo de todas as reservas do seu negócio")}
                        </CardDescription>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Calendar className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative p-4 overflow-hidden rounded-xl border bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
                      <div className="absolute top-0 right-0 opacity-10">
                        <Calendar className="h-32 w-32 text-blue-500" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-medium mb-2">{t("settings.manual.reservations.overview", "Visão Geral")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t("settings.manual.content.reservationsIntro", 
                            "O sistema de Reservas facilita o gerenciamento completo dos aluguéis:")}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">1</span>
                              </div>
                              <p className="text-sm">
                                {t("settings.manual.content.reservationsBullet1", "Processamento automático de PDFs de reservas")}
                              </p>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">2</span>
                              </div>
                              <p className="text-sm">
                                {t("settings.manual.content.reservationsBullet2", "Controle financeiro com receitas e despesas")}
                              </p>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">3</span>
                              </div>
                              <p className="text-sm">
                                {t("settings.manual.content.reservationsBullet3", "Gestão de check-in e check-out")}
                              </p>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">4</span>
                              </div>
                              <p className="text-sm">
                                {t("settings.manual.content.reservationsBullet4", "Calendário integrado com visão mensal")}
                              </p>
                            </div>
                            
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">5</span>
                              </div>
                              <p className="text-sm">
                                {t("settings.manual.content.reservationsBullet5", "Relatórios detalhados por período")}
                              </p>
                            </div>
                        </div>
                      </div>
                    </div>
                    
                    <Card className="overflow-hidden border-blue-100 dark:border-blue-800/30">
                      <CardHeader className="py-3 px-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
                        <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
                          {t("settings.manual.reservations.ai.title", "Processamento Automático")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                          {t("settings.manual.reservations.ai.description", 
                            "O Maria Faz utiliza inteligência artificial para extrair automaticamente dados de PDFs de reservas de várias plataformas como Airbnb, Booking e VRBO.")}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30">
                            Airbnb
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30">
                            Booking.com
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30">
                            VRBO
                          </Badge>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/30">
                            Expedia
                          </Badge>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30">
                            Hotéis.com
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="documents" className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/30">
                          {t("settings.manual.badges.ai", "Inteligência Artificial")}
                        </Badge>
                        <CardTitle>
                          {t("settings.manual.sections.documents", "Processamento de Documentos")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.manual.documents.description", "Extração automática de dados de documentos através de IA")}
                        </CardDescription>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                        <FileSearch className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t("settings.manual.content.documentsIntro", 
                        "O Processamento de Documentos automatiza tarefas através de IA:")}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative overflow-hidden rounded-lg border p-5 bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/10 dark:to-gray-900">
                        <div className="absolute top-0 right-0 opacity-10">
                          <FileSearch className="h-24 w-24 text-violet-500" />
                        </div>
                        <div className="relative">
                          <h3 className="font-medium mb-2">
                            {t("settings.manual.documents.types.title", "Documentos suportados")}
                          </h3>
                          <ul className="space-y-1 pl-5 list-disc text-sm">
                            <li>{t("settings.manual.documents.types.pdfs", "PDFs de reservas")}</li>
                            <li>{t("settings.manual.documents.types.checkin", "Formulários de check-in")}</li>
                            <li>{t("settings.manual.documents.types.checkout", "Relatórios de check-out")}</li>
                            <li>{t("settings.manual.documents.types.invoices", "Faturas e recibos")}</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="relative overflow-hidden rounded-lg border p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-gray-900">
                        <div className="absolute top-0 right-0 opacity-10">
                          <FileText className="h-24 w-24 text-indigo-500" />
                        </div>
                        <div className="relative">
                          <h3 className="font-medium mb-2">
                            {t("settings.manual.documents.data.title", "Dados extraídos")}
                          </h3>
                          <ul className="space-y-1 pl-5 list-disc text-sm">
                            <li>{t("settings.manual.documents.data.guest", "Dados do hóspede")}</li>
                            <li>{t("settings.manual.documents.data.dates", "Datas de check-in/check-out")}</li>
                            <li>{t("settings.manual.documents.data.amounts", "Valores e taxas")}</li>
                            <li>{t("settings.manual.documents.data.property", "Propriedade e plataforma")}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <h3 className="font-medium">
                        {t("settings.manual.documents.process.title", "Processo de Processamento")}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
                            <span className="text-sm font-bold text-violet-700 dark:text-violet-300">1</span>
                          </div>
                          <h4 className="text-sm font-medium mb-1">
                            {t("settings.manual.documents.process.upload", "Upload de Documento")}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.documents.process.upload.desc", "Faça upload do PDF ou imagem através do sistema")}
                          </p>
                        </div>
                        
                        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
                            <span className="text-sm font-bold text-violet-700 dark:text-violet-300">2</span>
                          </div>
                          <h4 className="text-sm font-medium mb-1">
                            {t("settings.manual.documents.process.extraction", "Extração com IA")}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.documents.process.extraction.desc", "A IA processa e extrai todos os dados relevantes")}
                          </p>
                        </div>
                        
                        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                          <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
                            <span className="text-sm font-bold text-violet-700 dark:text-violet-300">3</span>
                          </div>
                          <h4 className="text-sm font-medium mb-1">
                            {t("settings.manual.documents.process.validation", "Validação e Finalização")}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.manual.documents.process.validation.desc", "Verifique e ajuste os dados antes de confirmar")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}