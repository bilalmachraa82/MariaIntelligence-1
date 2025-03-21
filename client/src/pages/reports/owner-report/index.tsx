import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange as UIDateRange } from "@/components/ui/date-range-picker";
import { DateRangePresetPicker } from "@/components/ui/date-range-preset-picker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { useOwners } from "@/hooks/use-owners";
import { useOwnerReport, DateRange as ReportDateRange } from "@/hooks/use-owner-report";
import { downloadOwnerReportCSV } from "@/lib/export-utils";
import { downloadOwnerReportPDF } from "@/lib/pdf-export-utils";
import { OwnerReportModern } from "@/components/reports/owner-report-modern";
import { Button } from "@/components/ui/button";
import { FileText, Download, Mail, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Componente principal
export default function OwnerReportPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { data: owners, isLoading: isOwnersLoading } = useOwners();
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [uiDateRange, setUiDateRange] = useState<UIDateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  // Converter o UIDateRange para o formato esperado pelo hook useOwnerReport
  const dateRange: ReportDateRange = useMemo(() => ({
    startDate: uiDateRange.from ? format(uiDateRange.from, 'yyyy-MM-dd') : startOfMonth(new Date()).toISOString().split('T')[0],
    endDate: uiDateRange.to ? format(uiDateRange.to, 'yyyy-MM-dd') : endOfMonth(new Date()).toISOString().split('T')[0],
    label: t("dateRanges.custom", "Período Personalizado")
  }), [uiDateRange, t]);
  
  // Usar o hook personalizado para obter o relatório com dados reais
  const { 
    report: ownerReport, 
    propertyOccupancyData: occupancyData, 
    costDistributionData: costDistribution,
    isLoading: isReportLoading 
  } = useOwnerReport(
    selectedOwner ? parseInt(selectedOwner) : null, 
    dateRange
  );
  
  // Log para depuração - monitorar alterações nos dados do relatório
  useEffect(() => {
    if (ownerReport) {
      console.log("Relatório atualizado:", {
        ownerId: ownerReport.ownerId,
        startDate: ownerReport.startDate,
        endDate: ownerReport.endDate,
        totalProperties: ownerReport.propertyReports.length,
        totalReservations: ownerReport.totals.totalReservations
      });
    }
  }, [ownerReport]);
  
  // Função para lidar com a mudança no range de datas
  const handleDateRangeChange = (newRange: UIDateRange) => {
    console.log("Data alterada para:", newRange);
    
    // Antes de alterar o estado, criar a versão formatada das datas
    const formattedStartDate = newRange.from ? format(newRange.from, 'yyyy-MM-dd') : startOfMonth(new Date()).toISOString().split('T')[0];
    const formattedEndDate = newRange.to ? format(newRange.to, 'yyyy-MM-dd') : endOfMonth(new Date()).toISOString().split('T')[0];
    
    // SOLUÇÃO RADICAL: Forçar uma atualização completa definindo o proprietário como null e depois de volta
    if (selectedOwner) {
      const currentOwner = selectedOwner;
      
      // Força a limpeza do relatório
      setSelectedOwner("");
      
      // Log detalhado para depuração
      console.log("FORÇANDO ATUALIZAÇÃO COMPLETA DO RELATÓRIO");
      console.log("Intervalo formatado para API:", formattedStartDate, "até", formattedEndDate);
      
      // Atualizar o estado da UI
      setUiDateRange(newRange);
      
      // Atraso pequeno para garantir que a UI seja atualizada
      setTimeout(() => {
        // Redefine o proprietário para forçar um novo carregamento de dados
        setSelectedOwner(currentOwner);
        
        toast({
          title: t("dateRange.updated", "Intervalo atualizado"),
          description: t("dateRange.updatedDescription", `Dados atualizados para o período ${formattedStartDate} a ${formattedEndDate}`),
          duration: 3000
        });
      }, 100);
    } else {
      // Se não houver proprietário selecionado, apenas atualiza o intervalo
      setUiDateRange(newRange);
    }
  };
  
  // Função para enviar o relatório por email
  const handleSendEmail = async () => {
    if (!selectedOwner || !ownerReport) return;
    
    setIsSendingEmail(true);
    
    try {
      // Obter o mês e ano para o título do relatório
      const startDate = new Date(dateRange.startDate);
      const month = startDate.toLocaleString('pt-PT', { month: 'long' });
      const year = startDate.getFullYear();
      
      const response = await apiRequest<{success: boolean; email?: string; error?: string}>('/api/reports/owner/send-email', {
        method: 'POST',
        data: {
          ownerId: parseInt(selectedOwner),
          month,
          year,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      
      if (response.success) {
        toast({
          title: t("email.sent", "Email enviado com sucesso"),
          description: t("email.sentDescription", "O relatório foi enviado para {{email}}", { 
            email: response.email || "o email do proprietário"
          }),
          variant: "default"
        });
      } else {
        throw new Error(response.error || t("email.genericError", "Erro ao enviar o email"));
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: t("email.error", "Erro ao enviar email"),
        description: t("email.errorDescription", "Não foi possível enviar o relatório. Tente novamente mais tarde."),
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // Verificar se está carregando os dados
  const isLoading = isOwnersLoading || isReportLoading || isSendingEmail;
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Cabeçalho com animação e design moderno */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold tracking-tight">{t("ownerReport.title", "✨ Panorama Financeiro")}</h1>
            <p className="text-blue-100 mt-1">
              {t("ownerReport.subtitle", "Transforme números em histórias de sucesso para os proprietários")}
            </p>
          </div>
          
          {selectedOwner && ownerReport && (
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 text-white border-white/40 hover:bg-white/30 flex items-center gap-2"
                onClick={() => downloadOwnerReportCSV(ownerReport, 'full', i18n.language)}
              >
                <Download className="h-4 w-4" />
                {t("export.csv", "Exportar CSV")}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 text-white border-white/40 hover:bg-white/30 flex items-center gap-2"
                onClick={() => downloadOwnerReportPDF(ownerReport, 'full', i18n.language)}
              >
                <FileText className="h-4 w-4" />
                {t("export.pdf", "Exportar PDF")}
              </Button>
              
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2"
                onClick={handleSendEmail}
              >
                <Mail className="h-4 w-4" />
                {t("reports.sendEmail", "Enviar Relatório")}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Seleção de proprietário e período com design melhorado */}
      <Card className="mb-8 border-none shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <span className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-800">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </span>
              {t("ownerReport.generateReport", "Criar Seu Relatório Mágico")}
            </CardTitle>
            <CardDescription>
              {t("ownerReport.selectOwnerAndPeriod", "Escolha o proprietário e período para revelar uma análise inspiradora")}
            </CardDescription>
          </CardHeader>
        </div>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full">
              <label className="text-sm font-medium mb-2 block text-blue-700 dark:text-blue-300">
                {t("ownerReport.owner", "Quem vai receber as boas notícias?")}
              </label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger className="w-full border-blue-200 dark:border-blue-800 focus:ring-blue-500">
                  <SelectValue placeholder={t("ownerReport.selectOwner", "Selecione o proprietário")} />
                </SelectTrigger>
                <SelectContent>
                  {isOwnersLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-blue-600 rounded-full"></div>
                        {t("common.loading", "Buscando proprietários...")}
                      </div>
                    </SelectItem>
                  ) : (
                    owners?.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id.toString()}>
                        {owner.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full">
              <label className="text-sm font-medium mb-2 block text-blue-700 dark:text-blue-300">
                {t("ownerReport.period", "Qual período deseja analisar?")}
              </label>
              <DateRangePresetPicker 
                value={uiDateRange} 
                onChange={handleDateRangeChange} 
                className="w-full border-blue-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Estado vazio com uma mensagem mais amigável e divertida */}
      {!selectedOwner && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full p-6 mb-6">
            <div className="text-4xl animate-bounce">✨📊</div>
          </div>
          <h2 className="text-2xl font-medium mb-3 text-blue-800 dark:text-blue-300">
            {t("ownerReport.noOwnerSelected", "Vamos começar nossa jornada?")}
          </h2>
          <p className="text-lg text-blue-600 dark:text-blue-400 max-w-md">
            {t("ownerReport.selectOwnerToGenerate", "Selecione um proprietário acima e transformaremos dados em insights valiosos que irão inspirar e alegrar!")}
          </p>
        </div>
      )}
      
      {/* Conteúdo do relatório */}
      {selectedOwner && ownerReport && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
          <OwnerReportModern
            report={ownerReport}
            dateRange={uiDateRange}
            occupancyData={occupancyData}
            costDistribution={costDistribution}
            isLoading={isLoading}
            onExport={(format) => downloadOwnerReportCSV(ownerReport, format, i18n.language)}
            onSendEmail={handleSendEmail}
          />
        </div>
      )}
      
      {/* Preview do email */}
      {selectedOwner && ownerReport && (
        <Card className="mt-8 border-none shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <span className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-800">
                  <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </span>
                {t("emailPreview.title", "Prévia do Email")}
              </CardTitle>
              <CardDescription>
                {t("emailPreview.description", "Assim será o email enviado ao proprietário")}
              </CardDescription>
            </CardHeader>
          </div>
          <CardContent className="p-6">
            <div className="border rounded-md p-4 bg-white dark:bg-gray-900">
              <div className="mb-3 pb-3 border-b">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Para:</span> {ownerReport.ownerName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Assunto:</span> {t("emailPreview.subject", "Seu Relatório Financeiro")} - {format(new Date(dateRange.startDate), "MMMM yyyy", { locale: pt })}
                </div>
              </div>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p>{t("emailPreview.greeting", "Olá")} {ownerReport.ownerName},</p>
                <p>
                  {t("emailPreview.body1", "Temos o prazer de enviar seu relatório financeiro para o período selecionado, anexo a este email em formato PDF. Nele você encontrará:")}
                </p>
                <ul>
                  <li>{t("emailPreview.item1", "Resumo detalhado do desempenho de suas propriedades")}</li>
                  <li>{t("emailPreview.item2", "Análise de receitas, despesas e lucro líquido")}</li>
                  <li>{t("emailPreview.item3", "Lista completa de todas as reservas no período")}</li>
                  <li>{t("emailPreview.item4", "Insights personalizados para otimizar seus resultados")}</li>
                  <li>{t("emailPreview.item5", "Tabela detalhada com valores recebidos por cada propriedade")}</li>
                </ul>
                <p>
                  {t("emailPreview.body2", "Este relatório é enviado automaticamente e contém todos os detalhes necessários no PDF anexo. Não é necessário acessar nenhum sistema adicional.")}
                </p>
                <p>
                  {t("emailPreview.closing", "Estamos à disposição para qualquer esclarecimento!")}
                </p>
                <p>{t("emailPreview.signature", "Equipe Maria Faz")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}