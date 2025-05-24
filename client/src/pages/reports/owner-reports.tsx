import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Mail, 
  Download, 
  Euro, 
  Calendar,
  Building2,
  TrendingUp,
  Send,
  Loader2,
  CheckCircle2,
  User
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useProperties } from "@/hooks/use-properties";
import { useOwners } from "@/hooks/use-owners";
import { useReservations } from "@/hooks/use-reservations";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface OwnerReport {
  owner: any;
  properties: any[];
  reservations: any[];
  totalRevenue: number;
  totalCommission: number;
  netAmount: number;
  period: string;
}

export default function OwnerReports() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [reportData, setReportData] = useState<OwnerReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const { data: owners = [], isLoading: isLoadingOwners } = useOwners();
  const { data: properties = [], isLoading: isLoadingProperties } = useProperties();
  const { data: reservations = [], isLoading: isLoadingReservations } = useReservations();

  // Gerar opções de período (últimos 12 meses)
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const value = `${year}-${month.toString().padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    return { value, label };
  });

  const generateReport = async () => {
    if (!selectedOwner || !selectedPeriod) {
      toast({
        title: "Dados em falta",
        description: "Por favor selecciona o proprietário e o período.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Encontrar o proprietário
      const owner = owners.find(o => o.id.toString() === selectedOwner);
      if (!owner) throw new Error("Proprietário não encontrado");

      // Encontrar propriedades do proprietário
      const ownerProperties = properties.filter(p => p.ownerId === owner.id);
      
      // Filtrar reservas do período e das propriedades do proprietário
      const [year, month] = selectedPeriod.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const periodReservations = reservations.filter(r => {
        const checkInDate = new Date(r.checkInDate);
        const propertyMatch = ownerProperties.some(p => p.id === r.propertyId);
        const dateMatch = checkInDate >= startDate && checkInDate <= endDate;
        return propertyMatch && dateMatch && r.status === 'completed';
      });

      // Calcular totais
      let totalRevenue = 0;
      let totalCommission = 0;

      periodReservations.forEach(reservation => {
        const revenue = parseFloat(reservation.totalAmount) || 0;
        const commission = parseFloat(reservation.commission) || 0;
        
        totalRevenue += revenue;
        totalCommission += commission;
      });

      const netAmount = totalRevenue - totalCommission;

      const report: OwnerReport = {
        owner,
        properties: ownerProperties,
        reservations: periodReservations,
        totalRevenue,
        totalCommission,
        netAmount,
        period: periodOptions.find(p => p.value === selectedPeriod)?.label || selectedPeriod
      };

      setReportData(report);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: `Encontradas ${periodReservations.length} reservas para ${owner.name}`,
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro inesperado. Tenta novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReportByEmail = async () => {
    if (!reportData) return;

    setIsSendingEmail(true);
    
    try {
      const response = await fetch('/api/reports/owner/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: reportData.owner.id,
          period: selectedPeriod,
          reportData: reportData
        }),
      });

      if (response.ok) {
        toast({
          title: "Email enviado com sucesso!",
          description: `Relatório enviado para ${reportData.owner.name}`,
        });
      } else {
        throw new Error('Falha no envio do email');
      }

    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o relatório. Verifica a configuração de email.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoadingOwners || isLoadingProperties || isLoadingReservations) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">A carregar dados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
          <FileText className="h-8 w-8" />
          Relatórios para Proprietários
        </h1>
        <p className="text-muted-foreground">
          Gera e envia relatórios financeiros detalhados para os proprietários
        </p>
      </motion.div>

      {/* Seleção de Filtros */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Configurar Relatório
            </CardTitle>
            <CardDescription>
              Selecciona o proprietário e período para gerar o relatório financeiro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seleção de Proprietário */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Proprietário</label>
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona o proprietário" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {owner.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de Período */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {period.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={generateReport} 
              disabled={!selectedOwner || !selectedPeriod || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A gerar relatório...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Relatório Gerado */}
      {reportData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Relatório - {reportData.owner.name}
                  </CardTitle>
                  <CardDescription>
                    Período: {reportData.period}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={sendReportByEmail}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Email
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="summary" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Resumo Financeiro</TabsTrigger>
                  <TabsTrigger value="reservations">Reservas</TabsTrigger>
                  <TabsTrigger value="properties">Propriedades</TabsTrigger>
                </TabsList>

                {/* Tab Resumo Financeiro */}
                <TabsContent value="summary" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-800">Receita Total</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(reportData.totalRevenue)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Euro className="h-5 w-5 text-orange-600" />
                          <span className="font-medium text-orange-800">Comissões Maria Faz</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">
                          {formatCurrency(reportData.totalCommission)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-800">Valor Líquido</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(reportData.netAmount)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Valor a transferir:</strong> {formatCurrency(reportData.netAmount)} 
                      - Este é o montante líquido que {reportData.owner.name} irá receber após dedução das comissões de gestão.
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                {/* Tab Reservas */}
                <TabsContent value="reservations">
                  {reportData.reservations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hóspede</TableHead>
                          <TableHead>Propriedade</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Receita</TableHead>
                          <TableHead>Comissão</TableHead>
                          <TableHead>Líquido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.reservations.map((reservation) => {
                          const property = properties.find(p => p.id === reservation.propertyId);
                          const revenue = parseFloat(reservation.totalAmount) || 0;
                          const commission = parseFloat(reservation.commission) || 0;
                          const net = revenue - commission;
                          
                          return (
                            <TableRow key={reservation.id}>
                              <TableCell className="font-medium">{reservation.guestName}</TableCell>
                              <TableCell>{property?.name || 'N/A'}</TableCell>
                              <TableCell>{formatDate(reservation.checkInDate)}</TableCell>
                              <TableCell>{formatDate(reservation.checkOutDate)}</TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {formatCurrency(revenue)}
                              </TableCell>
                              <TableCell className="text-orange-600">
                                {formatCurrency(commission)}
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium">
                                {formatCurrency(net)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Não foram encontradas reservas concluídas para este período.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                {/* Tab Propriedades */}
                <TabsContent value="properties">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportData.properties.map((property) => {
                      const propertyReservations = reportData.reservations.filter(r => r.propertyId === property.id);
                      const propertyRevenue = propertyReservations.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0);
                      
                      return (
                        <Card key={property.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              <span className="font-medium">{property.name}</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><strong>Reservas:</strong> {propertyReservations.length}</p>
                              <p><strong>Receita:</strong> {formatCurrency(propertyRevenue)}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}