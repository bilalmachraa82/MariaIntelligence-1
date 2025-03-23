import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { 
  Download, FileText, Info, BookOpen, 
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
              "\n\n• Relatórios financeiros por período: Acompanhe receitas, despesas e lucro líquido em diferentes períodos (diário, semanal, mensal, anual). Inclui gráficos de tendências e comparativos com períodos anteriores." +
              "\n\n• Relatórios por proprietário: Demonstrativo financeiro detalhado para cada proprietário, incluindo rendimentos brutos, taxas, despesas e rendimento líquido. Pode ser enviado automaticamente por email em base mensal." +
              "\n\n• Relatório de ocupação: Análise detalhada de taxas de ocupação por propriedade, região e período, permitindo identificar padrões de sazonalidade e oportunidades de precificação dinâmica." +
              "\n\n• Relatório de desempenho por propriedade: Métricas detalhadas de ROI, receita por noite, taxa de conversão de reservas e avaliações de hóspedes para cada propriedade." +
              "\n\n• Relatório de canais: Análise comparativa de desempenho entre diferentes plataformas (Airbnb, Booking, etc.) incluindo taxas, volume de reservas e receita média." +
              "\n\n• Relatório de despesas: Controle detalhado de custos operacionais, manutenções, limpezas e outros gastos com filtros por categoria, propriedade e data." +
              "\n\n• Dashboard analítico: Painel visual com principais KPIs do negócio, permitindo visualização em tempo real do desempenho geral.");
            break;
          case "documents":
            sectionContent = t("settings.manual.content.documents", 
              "O Processamento de Documentos automatiza tarefas através de IA (Inteligência Artificial) Mistral: " +
              "\n\n• Processamento de PDFs de Reservas: Faça upload de confirmações de reservas das principais plataformas (Airbnb, Booking.com, VRBO, Expedia) e o sistema extrairá automaticamente todos os dados relevantes como nome do hóspede, datas, valores, taxas e detalhes da propriedade." +
              "\n\n• Processamento de Pares de Documentos: O sistema consegue processar simultaneamente documentos de check-in e check-out, combinando as informações para criar um registro completo da reserva, incluindo valores adicionais e alterações." +
              "\n\n• Reconhecimento Inteligente de Documentos: A IA identifica automaticamente o tipo de documento (confirmação de reserva, check-in, check-out, fatura, recibo) e aplica o processamento adequado para cada um." +
              "\n\n• Extração de Dados Estruturados: Todos os dados são extraídos em formato estruturado e organizados no sistema, prontos para serem usados em relatórios e análises." +
              "\n\n• Validação Contextual: O sistema valida os dados extraídos em relação à base de dados existente, identificando possíveis inconsistências ou duplicidades." +
              "\n\n• Processamento em Lote: Suporte para processamento de múltiplos documentos em sequência, ideal para importação inicial de dados ou atualizações periódicas." +
              "\n\n• Interface de Verificação e Edição: Após a extração automática, você pode revisar e editar os dados antes de confirmar a inclusão no sistema." +
              "\n\n• Suporte para Documentos Financeiros: Processa faturas, recibos e comprovantes de pagamento, extraindo valores, datas, categorias e fornecedores.");
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
        
        // Adicionar captura de tela ilustrativa (mockup) para cada seção
        try {
          let y = 30 + splitText.length * 5;
          
          // Verifica se ainda há espaço suficiente na página atual
          const remainingSpace = doc.internal.pageSize.getHeight() - y - 20;
          if (remainingSpace < 60) {
            doc.addPage();
            y = 20;
          }
          
          // Adiciona título para a captura de tela
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(primaryColor);
          doc.text(t("settings.manual.screenshot.title", "Captura de Tela Ilustrativa"), margin, y);
          
          // Adiciona um retângulo representando uma captura de tela
          y += 10;
          const imageWidth = contentWidth;
          const imageHeight = 60;
          
          // Retângulo decorativo representando a captura de tela
          doc.setDrawColor(200, 200, 200);
          doc.setFillColor(245, 245, 245);
          doc.roundedRect(margin, y, imageWidth, imageHeight, 3, 3, 'FD');
          
          // Adiciona elementos gráficos representando a interface
          doc.setFillColor(primaryColor);
          
          // Cabeçalho simulado
          doc.rect(margin + 5, y + 5, imageWidth - 10, 10, 'F');
          
          // Elementos de interface simulados
          if (section.id === "dashboard") {
            // Cards de estatísticas
            doc.setFillColor(220, 220, 220);
            doc.rect(margin + 5, y + 20, 40, 30, 'F');
            doc.rect(margin + 50, y + 20, 40, 30, 'F');
            doc.rect(margin + 95, y + 20, 40, 30, 'F');
            
            // Gráfico simulado
            doc.setFillColor(230, 230, 230);
            doc.rect(margin + 5, y + 20, imageWidth - 10, 30, 'F');
            doc.setDrawColor(primaryColor);
            
            // Linhas do gráfico
            doc.setLineWidth(0.5);
            for (let i = 0; i < 5; i++) {
              const startX = margin + 10 + (i * 30);
              const startY = y + 45 - (Math.random() * 20);
              const endX = margin + 40 + (i * 30);
              const endY = y + 45 - (Math.random() * 20);
              doc.line(startX, startY, endX, endY);
            }
          } else if (section.id === "reports") {
            // Tabela com dados financeiros
            doc.setFillColor(240, 240, 240);
            doc.rect(margin + 5, y + 20, imageWidth - 10, 30, 'F');
            
            // Linhas da tabela
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            for (let i = 1; i < 4; i++) {
              const lineY = y + 20 + (i * 7.5);
              doc.line(margin + 5, lineY, margin + imageWidth - 5, lineY);
            }
            
            // Colunas da tabela
            for (let i = 1; i < 4; i++) {
              const lineX = margin + 5 + (i * (imageWidth - 10) / 4);
              doc.line(lineX, y + 20, lineX, y + 50);
            }
          } else if (section.id === "documents") {
            // Interface de processamento de PDFs
            doc.setFillColor(240, 240, 240);
            doc.rect(margin + 5, y + 20, imageWidth / 2 - 10, 30, 'F');
            
            // PDF processado
            doc.setFillColor(230, 230, 230);
            doc.rect(margin + imageWidth / 2 + 5, y + 20, imageWidth / 2 - 10, 30, 'F');
            
            // Ícone de documento
            doc.setFillColor(primaryColor);
            doc.rect(margin + 15, y + 25, 15, 20, 'F');
            
            // Setas de processamento
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(1);
            const arrowX1 = margin + imageWidth / 2 - 15;
            const arrowX2 = margin + imageWidth / 2 + 5;
            const arrowY = y + 35;
            doc.line(arrowX1, arrowY, arrowX2, arrowY);
            doc.line(arrowX2 - 5, arrowY - 3, arrowX2, arrowY);
            doc.line(arrowX2 - 5, arrowY + 3, arrowX2, arrowY);
          }
          
          // Legenda da captura de tela
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          doc.text(
            t("settings.manual.screenshot." + section.id, `Interface do módulo de ${section.title}`), 
            margin, 
            y + imageHeight + 7
          );
        } catch (error) {
          console.error("Erro ao adicionar captura de tela:", error);
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
    documents: <FileSearch className="h-5 w-5 text-primary" />
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
              <Button variant="ghost" size="sm" className="w-full">
                <span className="flex items-center gap-1 text-xs">
                  <Play className="h-3 w-3" />
                  {t("settings.manual.recommendation.cta", "Ver tutorial")}
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
            </TabsList>
            
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
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex gap-3 items-center mt-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">
                          {t("settings.manual.intro.premium", "Recursos Premium")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("settings.manual.intro.premium.desc", "Desbloqueie recursos avançados como API, integração com canais e muito mais.")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto text-xs">
                        {t("settings.manual.intro.premium.cta", "Saiba mais")}
                      </Button>
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
                      {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="relative overflow-hidden group rounded-lg border p-4 hover:border-primary/50 transition-colors">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {t(`settings.manual.content.propertiesBullet${item}`, `Característica ${item}`)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t(`settings.manual.properties.bullet${item}.desc`, `Descrição detalhada da característica ${item} do sistema.`)}
                          </p>
                        </div>
                      ))}
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
                        <Button variant="outline" size="sm" className="text-xs">
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
                          {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="flex items-start gap-2">
                              <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{item}</span>
                              </div>
                              <p className="text-sm">
                                {t(`settings.manual.content.reservationsBullet${item}`, `Característica ${item}`)}
                              </p>
                            </div>
                          ))}
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