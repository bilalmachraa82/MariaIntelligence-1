import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { format, addDays } from "date-fns";
import { useOwners } from "@/hooks/use-owners";
import { useOwnerReport } from "@/hooks/use-owner-report";
import { downloadOwnerReportCSV } from "@/lib/export-utils";
import { downloadOwnerReportPDF } from "@/lib/pdf-export-utils";
import { OwnerReportModern } from "@/components/reports/owner-report-modern";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

// Componente principal
export default function OwnerReportPage() {
  const { t, i18n } = useTranslation();
  const { data: owners, isLoading: isOwnersLoading } = useOwners();
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  
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
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };
  
  // Verificar se está carregando os dados
  const isLoading = isOwnersLoading || isReportLoading;
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
              <DateRangePicker 
                value={dateRange} 
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
          dateRange={dateRange}
          occupancyData={occupancyData}
          costDistribution={costDistribution}
          isLoading={isLoading}
          onExport={(format) => downloadOwnerReportCSV(ownerReport, format, i18n.language)}
        />
      )}
    </div>
  );
}