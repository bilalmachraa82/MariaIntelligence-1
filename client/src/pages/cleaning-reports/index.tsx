import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileCheck, Clock } from "lucide-react";

// Estrutura de dados para relatórios de limpeza
interface CleaningReport {
  id: number;
  teamId: number;
  teamName: string;
  propertyId: number;
  propertyName: string;
  date: string;
  duration: number;
  status: "completed" | "pending" | "failed";
  notes: string;
  score: number;
  issues: string[];
  paymentStatus: "pending" | "completed";
  paymentDueDate: string;
  paymentAmount: number;
}

export default function CleaningReportsPage() {
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("list");
  
  // Dados reais das equipas de limpeza
  const teams = [
    { id: 1, name: "Equipa Lisboa Centro" },
    { id: 2, name: "Equipa Porto" },
    { id: 3, name: "Equipa Algarve" },
    { id: 4, name: "Equipa Lisboa Norte" },
  ];
  
  // Dados simulados para os relatórios de limpeza
  const cleaningReports: CleaningReport[] = [
    {
      id: 1,
      teamId: 1,
      teamName: "Equipa Lisboa Centro",
      propertyId: 1,
      propertyName: "Ajuda",
      date: "2025-03-11",
      duration: 95,
      status: "completed",
      notes: "Limpeza concluída conforme planeado",
      score: 98,
      issues: [],
      paymentStatus: "completed",
      paymentDueDate: "2025-03-15",
      paymentAmount: 45
    },
    {
      id: 2,
      teamId: 1,
      teamName: "Equipa Lisboa Centro",
      propertyId: 2,
      propertyName: "Príncipe Real",
      date: "2025-03-10",
      duration: 120,
      status: "completed",
      notes: "Limpeza concluída com atraso de 20 minutos",
      score: 92,
      issues: ["atraso", "reposição incompleta"],
      paymentStatus: "completed",
      paymentDueDate: "2025-03-15",
      paymentAmount: 50
    },
    {
      id: 3,
      teamId: 2,
      teamName: "Equipa Porto",
      propertyId: 3,
      propertyName: "Boavista",
      date: "2025-03-12",
      duration: 85,
      status: "completed",
      notes: "Limpeza concluída sem problemas",
      score: 100,
      issues: [],
      paymentStatus: "pending",
      paymentDueDate: "2025-03-20",
      paymentAmount: 40
    },
    {
      id: 4,
      teamId: 2,
      teamName: "Equipa Porto",
      propertyId: 4,
      propertyName: "Ribeira",
      date: "2025-03-09",
      duration: 150,
      status: "failed",
      notes: "Não foi possível concluir a limpeza - acesso não foi autorizado",
      score: 0,
      issues: ["acesso negado", "falha de comunicação"],
      paymentStatus: "pending",
      paymentDueDate: "2025-03-20",
      paymentAmount: 0
    },
    {
      id: 5,
      teamId: 3,
      teamName: "Equipa Algarve",
      propertyId: 5,
      propertyName: "Praia da Rocha",
      date: "2025-03-12",
      duration: 110,
      status: "completed",
      notes: "Limpeza concluída com excelência",
      score: 100,
      issues: [],
      paymentStatus: "pending",
      paymentDueDate: "2025-03-25",
      paymentAmount: 60
    },
    {
      id: 6,
      teamId: 3,
      teamName: "Equipa Algarve",
      propertyId: 6,
      propertyName: "Albufeira Centro",
      date: "2025-03-11",
      duration: 130,
      status: "completed",
      notes: "Limpeza complementar realizada - manchas difíceis no sofá",
      score: 95,
      issues: ["manchas persistentes"],
      paymentStatus: "pending",
      paymentDueDate: "2025-03-25",
      paymentAmount: 65
    },
    {
      id: 7,
      teamId: 4,
      teamName: "Equipa Lisboa Norte",
      propertyId: 7,
      propertyName: "Expo",
      date: "2025-03-10",
      duration: 75,
      status: "completed",
      notes: "Limpeza concluída rapidamente",
      score: 94,
      issues: ["pequenos detalhes ignorados"],
      paymentStatus: "completed",
      paymentDueDate: "2025-03-18",
      paymentAmount: 35
    },
    {
      id: 8,
      teamId: 4,
      teamName: "Equipa Lisboa Norte",
      propertyId: 8,
      propertyName: "Benfica",
      date: "2025-03-08",
      duration: 0,
      status: "pending",
      notes: "Limpeza agendada",
      score: 0,
      issues: [],
      paymentStatus: "pending",
      paymentDueDate: "2025-03-18",
      paymentAmount: 40
    },
  ];
  
  // Filtragem dos relatórios com base nos filtros selecionados
  const filteredReports = cleaningReports.filter(report => {
    const teamFilter = selectedTeam === "all" || Number(selectedTeam) === report.teamId;
    const paymentFilter = selectedPaymentStatus === "all" || selectedPaymentStatus === report.paymentStatus;
    return teamFilter && paymentFilter;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Cálculo de dados para relatórios de pagamento
  const paymentSummaryByTeam = teams.map(team => {
    const teamReports = cleaningReports.filter(r => r.teamId === team.id);
    
    const totalPending = teamReports
      .filter(r => r.paymentStatus === "pending")
      .reduce((sum, r) => sum + r.paymentAmount, 0);
      
    const totalPaid = teamReports
      .filter(r => r.paymentStatus === "completed")
      .reduce((sum, r) => sum + r.paymentAmount, 0);
      
    return {
      teamId: team.id,
      teamName: team.name,
      totalPending,
      totalPaid,
      total: totalPending + totalPaid
    };
  });
  
  // Total de valores pendentes e pagos
  const totalPaymentAmount = paymentSummaryByTeam.reduce((sum, t) => sum + t.total, 0);
  const totalPendingAmount = paymentSummaryByTeam.reduce((sum, t) => sum + t.totalPending, 0);
  const totalPaidAmount = paymentSummaryByTeam.reduce((sum, t) => sum + t.totalPaid, 0);
  const pendingPaymentsCount = cleaningReports.filter(r => r.paymentStatus === "pending").length;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("cleaningReports.title", "Relatórios de Limpeza e Pagamentos")}</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t("reports.exportPDF", "Exportar PDF")}
        </Button>
      </div>
      
      <div className="grid gap-6 mb-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("cleaningReports.totalCleanings", "Total de Limpezas")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cleaningReports.length}</div>
            <p className="text-muted-foreground text-sm">
              {cleaningReports.filter(r => r.status === "completed").length} {t("cleaningReports.completedCleanings", "concluídas")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("cleaningReports.teamPayments", "Pagamentos às Equipas")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPaymentAmount}€</div>
            <p className="text-muted-foreground text-sm">
              {totalPendingAmount}€ {t("cleaningReports.pending", "pendentes")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("cleaningReports.pendingPayments", "Pagamentos Pendentes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingPaymentsCount}</div>
            <p className="text-muted-foreground text-sm">
              {t("cleaningReports.forAllTeams", "para todas as equipas")}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("cleaningReports.avgTeamScore", "Pontuação Média")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cleaningReports.filter(r => r.status === "completed").length 
                ? (cleaningReports
                    .filter(r => r.status === "completed")
                    .reduce((sum, r) => sum + r.score, 0) / 
                    cleaningReports.filter(r => r.status === "completed").length).toFixed(1)
                : "—"}
            </div>
            <p className="text-muted-foreground text-sm">
              {t("cleaningReports.outOf100", "de 100 pontos possíveis")}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("cleaningReports.filters", "Filtros")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium mb-1 block">
                {t("cleaningReports.team", "Equipa")}
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder={t("cleaningReports.allTeams", "Todas as equipas")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("cleaningReports.allTeams", "Todas as equipas")}</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium mb-1 block">
                {t("cleaningReports.paymentStatus", "Estado do Pagamento")}
              </label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t("cleaningReports.allStatuses", "Todos os estados")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("cleaningReports.allStatuses", "Todos os estados")}</SelectItem>
                  <SelectItem value="pending">{t("cleaningReports.statusPending", "Pendente")}</SelectItem>
                  <SelectItem value="completed">{t("cleaningReports.statusPaid", "Pago")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{t("cleaningReports.listView", "Lista de Limpezas")}</TabsTrigger>
          <TabsTrigger value="payments">{t("cleaningReports.payments", "Pagamentos")}</TabsTrigger>
          <TabsTrigger value="dueDates">{t("cleaningReports.dueDates", "Datas de Vencimento")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("cleaningReports.cleanings", "Limpezas")}</CardTitle>
              <CardDescription>
                {t("cleaningReports.cleaningsDescription", "Lista de todas as limpezas realizadas e suas informações.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cleaningReports.date", "Data")}</TableHead>
                    <TableHead>{t("cleaningReports.property", "Propriedade")}</TableHead>
                    <TableHead>{t("cleaningReports.team", "Equipa")}</TableHead>
                    <TableHead>{t("cleaningReports.duration", "Duração")}</TableHead>
                    <TableHead>{t("cleaningReports.status", "Estado")}</TableHead>
                    <TableHead>{t("cleaningReports.paymentStatus", "Pagamento")}</TableHead>
                    <TableHead>{t("cleaningReports.amount", "Valor")}</TableHead>
                    <TableHead>{t("cleaningReports.score", "Pontuação")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{report.propertyName}</TableCell>
                      <TableCell>{report.teamName}</TableCell>
                      <TableCell>
                        {report.status === "completed" 
                          ? <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              {report.duration} {t("cleaningReports.minutes", "min")}
                            </div>
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            report.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                            report.status === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : 
                            "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {report.status === "completed" 
                            ? t("cleaningReports.statusCompleted", "Concluída") :
                            report.status === "pending" 
                              ? t("cleaningReports.statusPending", "Pendente")
                              : t("cleaningReports.statusFailed", "Falhada")
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            report.paymentStatus === "completed" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : 
                            "bg-purple-100 text-purple-800 hover:bg-purple-200"
                          }
                        >
                          {report.paymentStatus === "completed" 
                            ? t("cleaningReports.statusPaid", "Pago")
                            : t("cleaningReports.statusPending", "Pendente")
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.paymentAmount > 0 ? `${report.paymentAmount}€` : "—"}
                      </TableCell>
                      <TableCell>
                        {report.status === "completed" 
                          ? <span className={
                              report.score >= 95 ? "text-green-600" :
                              report.score >= 80 ? "text-amber-600" : "text-red-600"
                            }>
                              {report.score}/100
                            </span>
                          : "—"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("cleaningReports.teamPayments", "Pagamentos por Equipa")}</CardTitle>
              <CardDescription>
                {t("cleaningReports.paymentsDescription", "Resumo dos pagamentos por equipa")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cleaningReports.team", "Equipa")}</TableHead>
                    <TableHead>{t("cleaningReports.pendingAmount", "Valor Pendente")}</TableHead>
                    <TableHead>{t("cleaningReports.paidAmount", "Valor Pago")}</TableHead>
                    <TableHead>{t("cleaningReports.totalAmount", "Total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentSummaryByTeam.map((team) => (
                    <TableRow key={team.teamId}>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-purple-600 font-medium">{team.totalPending}€</TableCell>
                      <TableCell className="text-blue-600 font-medium">{team.totalPaid}€</TableCell>
                      <TableCell className="font-bold">{team.total}€</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cleaningReports.totals", "Totais")}</TableHead>
                    <TableHead className="text-purple-600 font-medium">{totalPendingAmount}€</TableHead>
                    <TableHead className="text-blue-600 font-medium">{totalPaidAmount}€</TableHead>
                    <TableHead className="font-bold">{totalPaymentAmount}€</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dueDates" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{t("cleaningReports.upcomingPayments", "Pagamentos Próximos")}</CardTitle>
              <CardDescription>
                {t("cleaningReports.upcomingPaymentsDescription", "Pagamentos com vencimento nos próximos dias")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cleaningReports.dueDate", "Data de Vencimento")}</TableHead>
                    <TableHead>{t("cleaningReports.team", "Equipa")}</TableHead>
                    <TableHead>{t("cleaningReports.property", "Propriedade")}</TableHead>
                    <TableHead>{t("cleaningReports.amount", "Valor")}</TableHead>
                    <TableHead>{t("cleaningReports.actions", "Ações")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports
                    .filter(r => r.paymentStatus === "pending")
                    .sort((a, b) => new Date(a.paymentDueDate).getTime() - new Date(b.paymentDueDate).getTime())
                    .map((report) => {
                      const dueDate = new Date(report.paymentDueDate);
                      const today = new Date();
                      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const isPastDue = diffDays < 0;
                      const isDueSoon = diffDays >= 0 && diffDays <= 3;
                      
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span 
                                className={
                                  isPastDue ? "text-red-600 font-medium" :
                                  isDueSoon ? "text-amber-600 font-medium" : ""
                                }
                              >
                                {new Date(report.paymentDueDate).toLocaleDateString()}
                                {isPastDue && ` (${Math.abs(diffDays)} dias de atraso)`}
                                {isDueSoon && !isPastDue && ` (em ${diffDays} dias)`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{report.teamName}</TableCell>
                          <TableCell>{report.propertyName}</TableCell>
                          <TableCell className="font-medium">{report.paymentAmount}€</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              {t("cleaningReports.pay", "Pagar")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {filteredReports.filter(r => r.paymentStatus === "pending").length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  <p>{t("cleaningReports.noPaymentsDue", "Não há pagamentos pendentes no momento.")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}