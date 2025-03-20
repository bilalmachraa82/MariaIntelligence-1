import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange as UIDateRange } from "@/components/ui/date-range-picker";
import { DateRangePresetPicker } from "@/components/ui/date-range-preset-picker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useOwners } from "@/hooks/use-owners";
import { useOwnerReport, DateRange as ReportDateRange } from "@/hooks/use-owner-report";
import { downloadOwnerReportCSV } from "@/lib/export-utils";
import { downloadOwnerReportPDF } from "@/lib/pdf-export-utils";
import { OwnerReportModern } from "@/components/reports/owner-report-modern";
import { Button } from "@/components/ui/button";
import { FileText, Download, Mail } from "lucide-react";
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
  
  // Função para lidar com a mudança no range de datas
  const handleDateRangeChange = (newRange: UIDateRange) => {
    setUiDateRange(newRange);
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
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t("ownerReport.title", "Relatório Financeiro por Proprietário")}</h1>
        
        {selectedOwner && ownerReport && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => downloadOwnerReportCSV(ownerReport, 'full', i18n.language)}
            >
              <Download className="h-4 w-4" />
              {t("export.csv", "Exportar CSV")}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => downloadOwnerReportPDF(ownerReport, 'full', i18n.language)}
            >
              <FileText className="h-4 w-4" />
              {t("export.pdf", "Exportar PDF")}
            </Button>
          </div>
        )}
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>{t("ownerReport.generateReport", "Gerar Relatório")}</CardTitle>
          <CardDescription>
            {t("ownerReport.selectOwnerAndPeriod", "Selecione o proprietário e o período para gerar o relatório")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="text-sm font-medium mb-1 block">
                {t("ownerReport.owner", "Proprietário")}
              </label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("ownerReport.selectOwner", "Selecione um proprietário")} />
                </SelectTrigger>
                <SelectContent>
                  {isOwnersLoading ? (
                    <SelectItem value="loading" disabled>
                      {t("common.loading", "Carregando...")}
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
              <label className="text-sm font-medium mb-1 block">
                {t("ownerReport.period", "Período")}
              </label>
              <DateRangePresetPicker 
                value={uiDateRange} 
                onChange={handleDateRangeChange} 
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!selectedOwner && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <div className="h-12 w-12 mb-4 opacity-30">📊</div>
          <h2 className="text-lg font-medium mb-2">{t("ownerReport.noOwnerSelected", "Nenhum proprietário selecionado")}</h2>
          <p>{t("ownerReport.selectOwnerToGenerate", "Selecione um proprietário para gerar o relatório financeiro.")}</p>
        </div>
      )}
      
      {selectedOwner && ownerReport && (
        <OwnerReportModern
          report={ownerReport}
          dateRange={uiDateRange}
          occupancyData={occupancyData}
          costDistribution={costDistribution}
          isLoading={isLoading}
          onExport={(format) => downloadOwnerReportCSV(ownerReport, format, i18n.language)}
          onSendEmail={handleSendEmail}
        />
      )}
    </div>
  );
}