import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  Filter,
  ArrowRight,
  Download,
  FileText,
  Printer
} from "lucide-react";
import { formatCurrency, formatDate, calculateDuration } from "@/lib/utils";
import { ReservationSummary } from "@/hooks/use-owner-report";

// Tipos de plataformas para estilização
const platformColors: Record<string, { bg: string; text: string }> = {
  airbnb: { 
    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", 
    text: "text-red-600 dark:text-red-400" 
  },
  booking: { 
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", 
    text: "text-blue-600 dark:text-blue-400" 
  },
  expedia: { 
    bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800", 
    text: "text-yellow-600 dark:text-yellow-400" 
  },
  direct: { 
    bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800", 
    text: "text-green-600 dark:text-green-400" 
  },
  other: { 
    bg: "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800", 
    text: "text-gray-600 dark:text-gray-400" 
  }
};

// Função segura para obter a cor baseada na plataforma
function getPlatformColor(platform: string): { bg: string; text: string } {
  const normalizedPlatform = platform.toLowerCase();
  
  // Verifica se é uma das plataformas conhecidas
  if (normalizedPlatform in platformColors) {
    return platformColors[normalizedPlatform as keyof typeof platformColors];
  }
  
  // Fallback para "other" se a plataforma não for reconhecida
  return platformColors.other;
}

interface PropertyReservationsTableProps {
  propertyName: string;
  reservations: ReservationSummary[];
  showPropertyHeader?: boolean;
  itemsPerPage?: number;
  showMonetary?: boolean;
  allowExport?: boolean;
  exportId?: string;
}

export function PropertyReservationsTable({
  propertyName,
  reservations,
  showPropertyHeader = true,
  itemsPerPage = 10,
  showMonetary = true,
  allowExport = false,
  exportId
}: PropertyReservationsTableProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("checkInDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  
  // Calcular totais
  const totals = {
    totalAmount: reservations.reduce((sum, res) => sum + res.totalAmount, 0),
    cleaningFees: reservations.reduce((sum, res) => sum + res.cleaningFee, 0),
    checkInFees: reservations.reduce((sum, res) => sum + res.checkInFee, 0),
    commission: reservations.reduce((sum, res) => sum + res.commission, 0),
    teamPayments: reservations.reduce((sum, res) => sum + res.teamPayment, 0),
    netAmount: reservations.reduce((sum, res) => sum + res.netAmount, 0),
    reservations: reservations.length,
    nights: reservations.reduce((sum, res) => sum + res.nights, 0)
  };
  
  // Filtrar reservas
  const filteredReservations = reservations.filter(reservation => {
    if (platformFilter === "all") return true;
    return reservation.platform.toLowerCase() === platformFilter.toLowerCase();
  });
  
  // Debug - log das reservas disponíveis
  console.log(`PropertyReservationsTable - ${propertyName}: ${reservations.length} reservas disponíveis`);
  reservations.forEach((res, idx) => {
    console.log(`Reserva ${idx + 1}: ${res.checkInDate} - ${res.checkOutDate}, ${res.guestName}, ${formatCurrency(res.totalAmount)}`);
  });
  
  // Ordenar reservas
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    let valueA, valueB;
    
    // Determinar os valores de comparação baseados em sortBy
    switch (sortBy) {
      case "guestName":
        valueA = a.guestName;
        valueB = b.guestName;
        break;
      case "platform":
        valueA = a.platform;
        valueB = b.platform;
        break;
      case "nights":
        valueA = a.nights;
        valueB = b.nights;
        break;
      case "totalAmount":
        valueA = a.totalAmount;
        valueB = b.totalAmount;
        break;
      case "netAmount":
        valueA = a.netAmount;
        valueB = b.netAmount;
        break;
      case "checkOutDate":
        valueA = new Date(a.checkOutDate).getTime();
        valueB = new Date(b.checkOutDate).getTime();
        break;
      case "checkInDate":
      default:
        valueA = new Date(a.checkInDate).getTime();
        valueB = new Date(b.checkInDate).getTime();
        break;
    }
    
    // Ordenar baseado na direção
    const direction = sortDirection === "asc" ? 1 : -1;
    
    if (valueA < valueB) return -1 * direction;
    if (valueA > valueB) return 1 * direction;
    return 0;
  });
  
  // Paginação
  const totalPages = Math.ceil(sortedReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedReservations.length);
  const currentReservations = sortedReservations.slice(startIndex, endIndex);
  
  // Alternar ordenação
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };
  
  // Conseguir todas as plataformas únicas para filtro
  const platforms = Array.from(new Set(reservations.map(r => r.platform.toLowerCase())));
  
  // Exportar para CSV ou PDF
  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Export to ${format} requested for property ${propertyName}`);
    // Implementação futura
  };
  
  return (
    <Card className="w-full">
      {showPropertyHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <Home className="mr-2 h-5 w-5 text-primary" />
            {propertyName}
          </CardTitle>
          <CardDescription>
            {t("reports.totalReservations", "Total de reservas")}: {filteredReservations.length}
            {showMonetary && ` • ${t("reports.totalRevenue", "Receita total")}: ${formatCurrency(totals.totalAmount)}`}
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {/* Filtros */}
        <div className="px-4 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t("reports.filterBy", "Filtrar por")}:
            </span>
            <Select 
              value={platformFilter} 
              onValueChange={setPlatformFilter}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("reports.allPlatforms", "Todas Plataformas")}</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform} className="capitalize">
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {allowExport && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => handleExport('pdf')}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
            </div>
          )}
        </div>
        
        {currentReservations.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            {t("reports.noReservations", "Não existem reservas no período selecionado.")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors" 
                  onClick={() => toggleSort("checkInDate")}
                >
                  {t("reports.period", "Período")}
                  {sortBy === "checkInDate" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSort("guestName")}
                >
                  {t("reports.guest", "Hóspede")}
                  {sortBy === "guestName" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSort("nights")}
                >
                  {t("reports.nights", "Noites")}
                  {sortBy === "nights" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSort("platform")}
                >
                  {t("reports.platform", "Plataforma")}
                  {sortBy === "platform" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
                {showMonetary && (
                  <>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSort("totalAmount")}
                    >
                      {t("reports.amount", "Valor")}
                      {sortBy === "totalAmount" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSort("netAmount")}
                    >
                      {t("reports.netAmount", "Valor Líquido")}
                      {sortBy === "netAmount" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentReservations.map(reservation => {
                const platformColor = getPlatformColor(reservation.platform);
                
                return (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {formatDate(reservation.checkInDate)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <ArrowRight className="h-3 w-3 mx-1" />
                            {formatDate(reservation.checkOutDate)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1.5 text-muted-foreground" />
                        {reservation.guestName}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {reservation.nights}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize font-normal ${platformColor.bg} ${platformColor.text}`}
                      >
                        {reservation.platform}
                      </Badge>
                    </TableCell>
                    {showMonetary && (
                      <>
                        <TableCell className="text-right">
                          {formatCurrency(reservation.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(reservation.netAmount)}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
              
              {/* Totais */}
              {showMonetary && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={4}>
                    {t("reports.total", "Total")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.netAmount)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {totalPages > 1 && (
        <CardFooter className="flex justify-between items-center py-2">
          <div className="text-sm text-muted-foreground">
            {t("reports.showing", "Mostrando")} {startIndex + 1}-{endIndex} {t("reports.of", "de")} {sortedReservations.length}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <Button
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  );
}