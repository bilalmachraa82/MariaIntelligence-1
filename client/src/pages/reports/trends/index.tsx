import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "wouter/use-browser-location";
import { motion } from "framer-motion";
import { subMonths } from "date-fns";

import { TrendsReport } from "@/components/reports/trends-report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { getQueryFn } from "@/lib/queryClient";

// Página de Relatório de Tendências
export default function TrendsReportPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  
  // Estado para filtros
  const [ownerId, setOwnerId] = useState<number | undefined>(
    searchParams.get("ownerId") ? parseInt(searchParams.get("ownerId") as string) : undefined
  );
  const [propertyId, setPropertyId] = useState<number | undefined>(
    searchParams.get("propertyId") ? parseInt(searchParams.get("propertyId") as string) : undefined
  );
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 12),
    to: new Date()
  });
  
  // Buscar proprietários
  const { data: owners, isLoading: isLoadingOwners } = useQuery({
    queryKey: ["/api/owners"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Buscar propriedades
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Filtrar propriedades por proprietário
  const filteredProperties = ownerId
    ? properties?.filter((p: any) => p.ownerId === ownerId)
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
              <DatePickerWithRange
                id="date-range"
                value={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>
            
            {/* Seletor de proprietário */}
            <div>
              <Label htmlFor="owner" className="mb-2 block">
                {t("trendsReport.owner", "Proprietário")}
              </Label>
              <Select
                value={ownerId?.toString() || ""}
                onValueChange={(value) => {
                  setOwnerId(value ? parseInt(value) : undefined);
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
                  <SelectItem value="">
                    {t("trendsReport.allOwners", "Todos os proprietários")}
                  </SelectItem>
                  {owners?.map((owner: any) => (
                    <SelectItem key={owner.id} value={owner.id.toString()}>
                      {owner.name}
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
                value={propertyId?.toString() || ""}
                onValueChange={(value) => setPropertyId(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger
                  id="property"
                  className={cn("w-full", isLoadingProperties && "opacity-70")}
                  disabled={isLoadingProperties}
                >
                  <SelectValue placeholder={t("trendsReport.allProperties", "Todas as propriedades")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {t("trendsReport.allProperties", "Todas as propriedades")}
                  </SelectItem>
                  {filteredProperties?.map((property: any) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
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