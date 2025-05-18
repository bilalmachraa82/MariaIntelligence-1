import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  Download, 
  FileCheck, 
  Clock, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  ArrowUpCircle,
  Banknote,
  CheckCheck
} from "lucide-react";

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

// Importar os novos componentes de dashboard modernos
import { ModernDashboardCard, ModernStatCard, ModernMetricRow } from "@/components/dashboard/modern-dashboard-card";

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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">{t("cleaningReports.title", "Relatórios de Limpeza e Pagamentos")}</h1>
        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg">
          <Download className="mr-2 h-4 w-4" />
          {t("reports.exportPDF", "Exportar PDF")}
        </Button>
      </div>
      
      <div className="grid gap-6 mb-6 md:grid-cols-4">
        <ModernStatCard 
          title={t("cleaningReports.totalCleanings", "Total de Limpezas")}
          value={cleaningReports.length}
          icon={<FileCheck size={20} />}
          highlightColor="blue"
          className="shadow-lg hover:shadow-xl transition-all"
        />
        
        <ModernStatCard 
          title={t("cleaningReports.teamPayments", "Pagamentos às Equipas")}
          value={`${totalPaymentAmount}€`}
          icon={<CreditCard size={20} />}
          highlightColor="purple"
          className="shadow-lg hover:shadow-xl transition-all"
        />
        
        <ModernStatCard 
          title={t("cleaningReports.pendingPayments", "Pagamentos Pendentes")}
          value={pendingPaymentsCount}
          icon={<AlertTriangle size={20} />}
          highlightColor="orange"
          className="shadow-lg hover:shadow-xl transition-all"
        />
        
        <ModernStatCard 
          title={t("cleaningReports.avgTeamScore", "Pontuação Média")}
          value={
            cleaningReports.filter(r => r.status === "completed").length 
            ? (cleaningReports
                .filter(r => r.status === "completed")
                .reduce((sum, r) => sum + r.score, 0) / 
                cleaningReports.filter(r => r.status === "completed").length).toFixed(1)
            : "—"
          }
          icon={<TrendingUp size={20} />}
          highlightColor="teal"
          className="shadow-lg hover:shadow-xl transition-all"
        />
      </div>
      
      <div className="mb-6">
        <ModernDashboardCard 
          title={t("cleaningReports.filters", "Filtros")}
          icon={<Users size={18} />}
          className="bg-gradient-to-br from-indigo-950/90 to-purple-900/90 backdrop-blur-lg"
        >
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium mb-2 block text-white/80">
                {t("cleaningReports.team", "Equipa")}
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t("cleaningReports.allTeams", "Todas as equipas")} />
                </SelectTrigger>
                <SelectContent className="bg-indigo-950 border-white/20 text-white">
                  <SelectItem value="all" className="focus:bg-white/20 hover:bg-white/10">
                    {t("cleaningReports.allTeams", "Todas as equipas")}
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()} className="focus:bg-white/20 hover:bg-white/10">
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium mb-2 block text-white/80">
                {t("cleaningReports.paymentStatus", "Estado do Pagamento")}
              </label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder={t("cleaningReports.allStatuses", "Todos os estados")} />
                </SelectTrigger>
                <SelectContent className="bg-indigo-950 border-white/20 text-white">
                  <SelectItem value="all" className="focus:bg-white/20 hover:bg-white/10">
                    {t("cleaningReports.allStatuses", "Todos os estados")}
                  </SelectItem>
                  <SelectItem value="pending" className="focus:bg-white/20 hover:bg-white/10">
                    {t("cleaningReports.statusPending", "Pendente")}
                  </SelectItem>
                  <SelectItem value="completed" className="focus:bg-white/20 hover:bg-white/10">
                    {t("cleaningReports.statusPaid", "Pago")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ModernDashboardCard>
      </div>
      
      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gradient-to-r from-indigo-900/70 to-purple-900/70 p-1 rounded-xl">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            {t("cleaningReports.listView", "Lista de Limpezas")}
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg"
          >
            <Banknote className="h-4 w-4 mr-2" />
            {t("cleaningReports.payments", "Pagamentos")}
          </TabsTrigger>
          <TabsTrigger 
            value="dueDates" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t("cleaningReports.dueDates", "Datas de Vencimento")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <ModernDashboardCard
            title={t("cleaningReports.cleanings", "Limpezas")}
            subtitle={t("cleaningReports.cleaningsDescription", "Lista de todas as limpezas realizadas e suas informações.")}
            icon={<FileCheck size={18} />}
            className="bg-gradient-to-br from-indigo-950/90 to-purple-900/90 backdrop-blur-lg"
            headerAction={
              <Button className="bg-white/10 hover:bg-white/20 text-white border-0 shadow-lg flex items-center gap-2">
                <CheckCheck size={16} />
                {t("cleaningReports.markAsPaid", "Marcar como Pago")}
              </Button>
            }
          >
            <div className="rounded-lg overflow-hidden border border-white/10">
              <Table className="border-collapse">
                <TableHeader className="bg-indigo-900/50">
                  <TableRow className="border-b-0">
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.date", "Data")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.property", "Propriedade")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.team", "Equipa")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.duration", "Duração")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.status", "Estado")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.paymentStatus", "Pagamento")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.amount", "Valor")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.score", "Pontuação")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report, index) => (
                    <TableRow 
                      key={report.id} 
                      className={
                        index % 2 === 0 
                          ? "bg-white/5 hover:bg-white/10 transition-colors border-b-0" 
                          : "bg-transparent hover:bg-white/10 transition-colors border-b-0"
                      }
                    >
                      <TableCell className="text-white/80">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-white">{report.propertyName}</TableCell>
                      <TableCell className="text-white/80">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                              {report.teamName.split(' ').map(word => word[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {report.teamName}
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80">
                        {report.status === "completed" 
                          ? <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-blue-400" />
                              {report.duration} {t("cleaningReports.minutes", "min")}
                            </div>
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        <div className={`
                          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                          ${report.status === "completed" ? "bg-green-500/20 text-green-400 border border-green-500/30" : 
                            report.status === "pending" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : 
                            "bg-red-500/20 text-red-400 border border-red-500/30"}
                        `}>
                          {report.status === "completed" ? <CheckCircle2 size={12} /> : 
                           report.status === "pending" ? <Clock size={12} /> : 
                           <AlertTriangle size={12} />}
                          {report.status === "completed" 
                            ? t("cleaningReports.statusCompleted", "Concluída") :
                            report.status === "pending" 
                              ? t("cleaningReports.statusPending", "Pendente")
                              : t("cleaningReports.statusFailed", "Falhada")
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`
                          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                          ${report.paymentStatus === "completed" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : 
                           "bg-purple-500/20 text-purple-400 border border-purple-500/30"}
                        `}>
                          {report.paymentStatus === "completed" ? <CreditCard size={12} /> : <Clock size={12} />}
                          {report.paymentStatus === "completed" 
                            ? t("cleaningReports.statusPaid", "Pago")
                            : t("cleaningReports.statusPending", "Pendente")
                          }
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-white">
                        {report.paymentAmount > 0 ? `${report.paymentAmount}€` : "—"}
                      </TableCell>
                      <TableCell>
                        {report.status === "completed" && (
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={report.score} 
                              max={100} 
                              className="h-2 w-16 bg-white/10"
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${report.score}%`,
                                  background: report.score >= 95 ? 'linear-gradient(90deg, #34d399, #10b981)' : 
                                            report.score >= 80 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' :
                                            'linear-gradient(90deg, #f87171, #ef4444)'
                                }}
                              />
                            </Progress>
                            <span className={`text-xs font-medium ${
                              report.score >= 95 ? "text-green-400" :
                              report.score >= 80 ? "text-amber-400" : "text-red-400"
                            }`}>
                              {report.score}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ModernDashboardCard>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <ModernDashboardCard
            title={t("cleaningReports.teamPayments", "Pagamentos por Equipa")}
            subtitle={t("cleaningReports.paymentsDescription", "Resumo dos pagamentos por equipa")}
            icon={<Banknote size={18} />}
            className="bg-gradient-to-br from-indigo-950/90 to-purple-900/90 backdrop-blur-lg"
          >
            <div className="rounded-lg overflow-hidden border border-white/10">
              <Table className="border-collapse">
                <TableHeader className="bg-indigo-900/50">
                  <TableRow className="border-b-0">
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.team", "Equipa")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.pendingAmount", "Valor Pendente")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.paidAmount", "Valor Pago")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.totalAmount", "Total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentSummaryByTeam.map((team, index) => (
                    <TableRow 
                      key={team.teamId}
                      className={
                        index % 2 === 0 
                          ? "bg-white/5 hover:bg-white/10 transition-colors border-b-0" 
                          : "bg-transparent hover:bg-white/10 transition-colors border-b-0"
                      }
                    >
                      <TableCell className="text-white/80">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                              {team.teamName.split(' ').map(word => word[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {team.teamName}
                        </div>
                      </TableCell>
                      <TableCell className="text-purple-400 font-medium">{team.totalPending}€</TableCell>
                      <TableCell className="text-blue-400 font-medium">{team.totalPaid}€</TableCell>
                      <TableCell className="font-bold text-white">{team.total}€</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableHeader className="bg-indigo-900/50">
                  <TableRow className="border-t border-white/10">
                    <TableHead className="text-white/70 font-bold">{t("cleaningReports.totals", "Totais")}</TableHead>
                    <TableHead className="text-purple-400 font-bold">{totalPendingAmount}€</TableHead>
                    <TableHead className="text-blue-400 font-bold">{totalPaidAmount}€</TableHead>
                    <TableHead className="text-white font-bold">{totalPaymentAmount}€</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
          </ModernDashboardCard>
        </TabsContent>
        
        <TabsContent value="dueDates" className="space-y-4">
          <ModernDashboardCard
            title={t("cleaningReports.upcomingPayments", "Pagamentos Próximos")}
            subtitle={t("cleaningReports.upcomingPaymentsDescription", "Pagamentos com vencimento nos próximos dias")}
            icon={<Calendar size={18} />}
            className="bg-gradient-to-br from-indigo-950/90 to-purple-900/90 backdrop-blur-lg"
          >
            <div className="rounded-lg overflow-hidden border border-white/10">
              <Table className="border-collapse">
                <TableHeader className="bg-indigo-900/50">
                  <TableRow className="border-b-0">
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.dueDate", "Data de Vencimento")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.team", "Equipa")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.property", "Propriedade")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.amount", "Valor")}</TableHead>
                    <TableHead className="text-white/70 font-medium">{t("cleaningReports.actions", "Ações")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports
                    .filter(r => r.paymentStatus === "pending")
                    .sort((a, b) => new Date(a.paymentDueDate).getTime() - new Date(b.paymentDueDate).getTime())
                    .map((report, index) => {
                      const dueDate = new Date(report.paymentDueDate);
                      const today = new Date();
                      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const isPastDue = diffDays < 0;
                      const isDueSoon = diffDays >= 0 && diffDays <= 3;
                      
                      return (
                        <TableRow 
                          key={report.id}
                          className={
                            index % 2 === 0 
                              ? "bg-white/5 hover:bg-white/10 transition-colors border-b-0" 
                              : "bg-transparent hover:bg-white/10 transition-colors border-b-0"
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`
                                flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                ${isPastDue ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                                  isDueSoon ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : 
                                  "bg-blue-500/20 text-blue-400 border border-blue-500/30"}
                              `}>
                                <Calendar size={12} />
                                {new Date(report.paymentDueDate).toLocaleDateString()}
                                {isPastDue && ` (${Math.abs(diffDays)} dias de atraso)`}
                                {isDueSoon && !isPastDue && ` (em ${diffDays} dias)`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-white/80">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                                  {report.teamName.split(' ').map(word => word[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {report.teamName}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-white">{report.propertyName}</TableCell>
                          <TableCell className="font-bold text-white">{report.paymentAmount}€</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white hover:from-blue-700 hover:to-indigo-700"
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              {t("cleaningReports.pay", "Pagar")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {filteredReports.filter(r => r.paymentStatus === "pending").length === 0 && (
                <div className="p-6 text-center text-white/60">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-50" />
                  <p>{t("cleaningReports.noPaymentsDue", "Não há pagamentos pendentes no momento.")}</p>
                </div>
              )}
            </div>
          </ModernDashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}