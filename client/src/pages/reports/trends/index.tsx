import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { subMonths, format, addMonths, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { TrendsReport } from "@/components/reports/trends-report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label"; 
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { getQueryFn } from "@/lib/queryClient";
import { DateRange, DateRangePicker } from "@/components/ui/date-range-picker";

// Função para obter parâmetros da URL
function useURLParams() {
  const [location] = useLocation();
  
  const getURLParam = (param: string): string | null => {
    const url = new URL(window.location.href);
    return url.searchParams.get(param);
  };
  
  return { getURLParam };
}

// Página de Relatório de Tendências
export default function TrendsReportPage() {
  const { t } = useTranslation();
  const { getURLParam } = useURLParams();
  
  // Estado para filtros
  const [ownerId, setOwnerId] = useState<number | undefined>(() => {
    const param = getURLParam("ownerId");
    return param ? parseInt(param) : undefined;
  });
  
  const [propertyId, setPropertyId] = useState<number | undefined>(() => {
    const param = getURLParam("propertyId");
    return param ? parseInt(param) : undefined;
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 12),
    to: new Date()
  });
  
  // Buscar proprietários
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: ["/api/owners"],
    select: (response: any) => response.data || []
  });
  
  // Buscar propriedades
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["/api/properties"],
    select: (response: any) => response.data || []
  });
  
  // Filtrar propriedades por proprietário
  const filteredProperties = ownerId
    ? (properties as any[]).filter((p) => p.ownerId === ownerId)
    : properties;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">
          {t("trendsReport.pageTitle", "Relatório de Tendências")}
        </h1>
        <p className="text-muted-foreground">
          {t("trendsReport.pageDescription", "Visualize e analise tendências de desempenho ao longo do tempo")}
        </p>
      </motion.div>
      
      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>{t("trendsReport.filters", "Filtros")}</CardTitle>
          <CardDescription>
            {t("trendsReport.filtersDescription", "Personalize o relatório com os filtros abaixo")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Seletor de datas */}
            <div>
              <Label htmlFor="date-range" className="mb-2 block">
                {t("trendsReport.period", "Período")}
              </Label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                presets={[
                  {
                    label: t("trendsReport.lastMonth", "Último mês"),
                    dateRange: {
                      from: subMonths(new Date(), 1),
                      to: new Date()
                    }
                  },
                  {
                    label: t("trendsReport.last3Months", "Últimos 3 meses"),
                    dateRange: {
                      from: subMonths(new Date(), 3),
                      to: new Date()
                    }
                  },
                  {
                    label: t("trendsReport.last6Months", "Últimos 6 meses"),
                    dateRange: {
                      from: subMonths(new Date(), 6),
                      to: new Date()
                    }
                  },
                  {
                    label: t("trendsReport.lastYear", "Último ano"),
                    dateRange: {
                      from: subMonths(new Date(), 12),
                      to: new Date()
                    }
                  }
                ]}
              />
            </div>
            
            {/* Seletor de proprietário */}
            <div>
              <Label htmlFor="owner" className="mb-2 block">
                {t("trendsReport.owner", "Proprietário")}
              </Label>
              <Select
                value={ownerId?.toString() || "_all"}
                onValueChange={(value) => {
                  setOwnerId(value === "_all" ? undefined : parseInt(value));
                  // Limpar a propriedade se estiver mudando o proprietário
                  setPropertyId(undefined);
                }}
              >
                <SelectTrigger
                  id="owner"
                  className={cn("w-full", isLoadingOwners && "opacity-70")}
                  disabled={isLoadingOwners}
                >
                  <SelectValue placeholder={t("trendsReport.allOwners", "Todos os proprietários")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">
                    {t("trendsReport.allOwners", "Todos os proprietários")}
                  </SelectItem>
                  {(owners as any[]).filter(owner => owner && owner.id !== undefined && owner.id !== null).map((owner: any) => (
                    <SelectItem key={owner.id} value={owner.id.toString()}>
                      {owner.name || "Proprietário " + owner.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Seletor de propriedade */}
            <div>
              <Label htmlFor="property" className="mb-2 block">
                {t("trendsReport.property", "Propriedade")}
              </Label>
              <Select
                value={propertyId?.toString() || "_all"}
                onValueChange={(value) => setPropertyId(value === "_all" ? undefined : parseInt(value))}
              >
                <SelectTrigger
                  id="property"
                  className={cn("w-full", isLoadingProperties && "opacity-70")}
                  disabled={isLoadingProperties}
                >
                  <SelectValue placeholder={t("trendsReport.allProperties", "Todas as propriedades")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">
                    {t("trendsReport.allProperties", "Todas as propriedades")}
                  </SelectItem>
                  {(filteredProperties as any[]).filter(property => property && property.id !== undefined && property.id !== null).map((property: any) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name || "Propriedade " + property.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Botão para aplicar filtros */}
            <div className="flex items-end">
              <Button className="w-full">
                {t("trendsReport.applyFilters", "Aplicar Filtros")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Conteúdo do relatório */}
      <TrendsReport
        ownerId={ownerId}
        propertyId={propertyId}
        initialDateRange={dateRange}
        isLoading={isLoadingOwners || isLoadingProperties}
      />
    </div>
  );
}