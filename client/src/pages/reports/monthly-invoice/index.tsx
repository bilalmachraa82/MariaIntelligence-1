import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, ArrowRight, Download, FileText, Printer } from "lucide-react";
import { MonthlyInvoiceReport } from "@/components/reports/monthly-invoice-report";
import { DateRange } from "@/hooks/use-owner-report";
import { useOwners } from "@/hooks/use-owners";
import { useOwnerReport } from "@/hooks/use-owner-report";
import { downloadOwnerReportCSV } from "@/lib/export-utils";
import { downloadOwnerReportPDF } from "@/lib/pdf-export-utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Generate last 12 months for the dropdown
function getLast12Months() {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const month = subMonths(today, i);
    const monthStr = format(month, 'yyyy-MM');
    const monthLabel = format(month, 'LLLL yyyy', { locale: ptBR });
    
    months.push({
      value: monthStr,
      label: monthLabel,
    });
  }
  
  return months;
}

export default function MonthlyInvoicePage() {
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const { data: owners, isLoading: isOwnersLoading } = useOwners();
  
  // Calculate date range based on selected month
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfMonth(new Date()).toISOString().split('T')[0],
    endDate: endOfMonth(new Date()).toISOString().split('T')[0],
    label: t("dateRanges.currentMonth", "Mês Atual")
  });
  
  // Update date range when selected month changes
  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      
      setDateRange({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        label: format(startDate, 'LLLL yyyy', { locale: ptBR })
      });
    }
  }, [selectedMonth, t]);
  
  // Get owner report data with the calculated date range
  const { 
    report: ownerReport, 
    isLoading: isReportLoading 
  } = useOwnerReport(
    selectedOwner ? parseInt(selectedOwner) : null, 
    dateRange
  );
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const previousMonth = subMonths(new Date(year, month - 1), 1);
    setSelectedMonth(format(previousMonth, 'yyyy-MM'));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextMonth = addMonths(new Date(year, month - 1), 1);
    // Don't allow going to future months
    if (nextMonth <= new Date()) {
      setSelectedMonth(format(nextMonth, 'yyyy-MM'));
    }
  };
  
  // Handler for export functions
  const handleExport = (format: 'pdf' | 'csv') => {
    if (!ownerReport) return;
    
    if (format === 'pdf') {
      downloadOwnerReportPDF(ownerReport, 'full', i18n.language);
    } else {
      downloadOwnerReportCSV(ownerReport, 'full', i18n.language);
    }
  };
  
  // Toast hook for notifications
  const { toast } = useToast();
  
  // Email sending mutation
  const sendEmailMutation = useMutation({
    mutationFn: (data: { ownerId: number; month: string; year: string; }) => {
      return apiRequest('/api/reports/owner/send-email', {
        method: 'POST',
        data
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: t("monthlyInvoice.emailSent", "Email enviado com sucesso"),
        description: response.message || t("monthlyInvoice.emailSentDesc", "O relatório foi enviado para o email do proprietário."),
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: t("monthlyInvoice.emailError", "Erro ao enviar email"),
        description: error.message || t("monthlyInvoice.emailErrorDesc", "Não foi possível enviar o relatório. Por favor tente novamente."),
        variant: "destructive",
      });
    }
  });
  
  // Handler for email sending
  const handleSendEmail = () => {
    if (!selectedOwner || !selectedMonth) {
      toast({
        title: t("monthlyInvoice.missingData", "Dados incompletos"),
        description: t("monthlyInvoice.selectOwnerAndMonthForEmail", "Selecione o proprietário e o mês para enviar o relatório por email."),
        variant: "destructive",
      });
      return;
    }
    
    // Extract month and year from selectedMonth (format: YYYY-MM)
    const [year, month] = selectedMonth.split('-');
    
    sendEmailMutation.mutate({
      ownerId: parseInt(selectedOwner),
      month,
      year
    });
  };
  
  // Get months list for dropdown
  const months = getLast12Months();
  
  // Define loading state
  const isLoading = isOwnersLoading || isReportLoading || sendEmailMutation.isPending;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">
          {t("monthlyInvoice.title", "Relatório Mensal para Faturação")}
        </h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>{t("monthlyInvoice.generate", "Gerar Fatura Mensal")}</CardTitle>
          <CardDescription>
            {t("monthlyInvoice.selectOwnerAndMonth", "Selecione o proprietário e o mês para gerar o relatório para faturação")}
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
                {t("monthlyInvoice.month", "Mês")}
              </label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToPreviousMonth}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  disabled={selectedMonth === months[0].value}
                  className="shrink-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!selectedOwner && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <div className="h-12 w-12 mb-4 opacity-30">📊</div>
          <h2 className="text-lg font-medium mb-2">
            {t("monthlyInvoice.noOwnerSelected", "Nenhum proprietário selecionado")}
          </h2>
          <p>
            {t("monthlyInvoice.selectOwnerToGenerate", "Selecione um proprietário para gerar o relatório mensal para faturação.")}
          </p>
        </div>
      )}
      
      {selectedOwner && isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h2 className="text-lg font-medium">
            {t("monthlyInvoice.generating", "Gerando relatório...")}
          </h2>
        </div>
      )}
      
      {selectedOwner && ownerReport && !isLoading && (
        <MonthlyInvoiceReport 
          report={ownerReport}
          selectedMonth={selectedMonth}
          onExport={handleExport}
          onSendEmail={handleSendEmail}
        />
      )}
    </div>
  );
}