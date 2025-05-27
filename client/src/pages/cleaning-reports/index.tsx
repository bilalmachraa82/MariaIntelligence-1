import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Download, 
  FileCheck, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  BellRing, 
  BarChart, 
  Sparkles
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
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">{t("cleaningReports.title", "Relatórios de Limpeza e Pagamentos")}</h1>
          <p className="text-sm text-muted-foreground italic mt-1 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
            "Uma equipa limpa é o primeiro passo para um cliente satisfeito! ✨"
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0">
          <Download className="mr-2 h-4 w-4" />
          {"Exportar PDF"}
        </Button>
      </div>
      
      <div className="grid gap-6 mb-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <FileCheck className="h-5 w-5 mr-2 text-blue-500" />
              {t("cleaningReports.totalCleanings", "Total de Limpezas")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{cleaningReports.length}</div>
            <p className="text-muted-foreground text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              {cleaningReports.filter(r => r.status === "completed").length} {t("cleaningReports.completedCleanings", "concluídas")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-purple-500" />
              {t("cleaningReports.teamPayments", "Pagamentos às Equipas")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalPaymentAmount}€</div>
            <p className="text-muted-foreground text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
              {totalPendingAmount}€ {"pendentes"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <BellRing className="h-5 w-5 mr-2 text-amber-500" />
              {t("cleaningReports.pendingPayments", "Pagamentos Pendentes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingPaymentsCount}</div>
            <p className="text-muted-foreground text-sm flex items-center">
              <Users className="h-4 w-4 mr-1 text-blue-500" />
              {t("cleaningReports.forAllTeams", "para todas as equipas")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-green-500" />
              {t("cleaningReports.avgTeamScore", "Pontuação Média")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {cleaningReports.filter(r => r.status === "completed").length 
                ? (cleaningReports
                    .filter(r => r.status === "completed")
                    .reduce((sum, r) => sum + r.score, 0) / 
                    cleaningReports.filter(r => r.status === "completed").length).toFixed(1)
                : "—"}
            </div>
            <p className="text-muted-foreground text-sm flex items-center">
              <BarChart className="h-4 w-4 mr-1 text-blue-500" />
              {t("cleaningReports.outOf100", "de 100 pontos possíveis")}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-md">
          <CardHeader className="pb-2 border-b border-slate-200">
            <CardTitle className="flex items-center text-slate-800">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              {"Filtros"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pt-4">
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium mb-2 block text-slate-700 flex items-center">
                <Users className="h-4 w-4 mr-1 text-blue-500" />
                {"Equipa"}
              </label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="border-slate-300 hover:border-slate-400 transition-colors">
                  <SelectValue placeholder={"Todas as equipas"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{"Todas as equipas"}</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium mb-2 block text-slate-700 flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-purple-500" />
                {"Estado do Pagamento"}
              </label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger className="border-slate-300 hover:border-slate-400 transition-colors">
                  <SelectValue placeholder={"Todos os estados"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{"Todos os estados"}</SelectItem>
                  <SelectItem value="pending">{"Pendente"}</SelectItem>
                  <SelectItem value="completed">{"Pago"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-1 rounded-xl border border-slate-200">
          <TabsTrigger value="list" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <FileCheck className="h-4 w-4" />
            {"Lista de Limpezas"}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4" />
            {"Pagamentos"}
          </TabsTrigger>
          <TabsTrigger value="dueDates" className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4" />
            {"Datas de Vencimento"}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card className="border-t-4 border-t-blue-500 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-slate-50 border-b">
              <CardTitle className="flex items-center text-blue-700">
                <FileCheck className="h-5 w-5 mr-2 text-blue-500" />
                {"Limpezas"}
              </CardTitle>
              <CardDescription>
                {"Lista de todas as limpezas realizadas e suas informações."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead className="font-semibold text-slate-700">{"Data"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Propriedade"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Equipa"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Duração"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Estado"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Pagamento"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Valor"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Pontuação"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report, index) => (
                    <TableRow key={report.id} className={index % 2 === 0 ? "bg-slate-50" : ""}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{report.propertyName}</TableCell>
                      <TableCell className="text-slate-700">{report.teamName}</TableCell>
                      <TableCell>
                        {report.status === "completed" 
                          ? <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-slate-500" />
                              {report.duration} {"min"}
                            </div>
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                          report.status === "completed" ? "bg-green-100 text-green-800 border border-green-200" :
                          report.status === "pending" ? "bg-amber-100 text-amber-800 border border-amber-200" : 
                          "bg-red-100 text-red-800 border border-red-200"
                        }`}>
                          {report.status === "completed" ? <CheckCircle size={12} /> : 
                           report.status === "pending" ? <Clock size={12} /> : 
                           <XCircle size={12} />}
                          {report.status === "completed" 
                            ? "Concluída" :
                            report.status === "pending" 
                              ? "Pendente"
                              : "Falhada"
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                          report.paymentStatus === "completed" ? "bg-blue-100 text-blue-800 border border-blue-200" : 
                          "bg-purple-100 text-purple-800 border border-purple-200"
                        }`}>
                          {report.paymentStatus === "completed" ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {report.paymentStatus === "completed" 
                            ? "Pago"
                            : "Pendente"
                          }
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {report.paymentAmount > 0 ? `${report.paymentAmount}€` : "—"}
                      </TableCell>
                      <TableCell>
                        {report.status === "completed" 
                          ? <div className="flex items-center gap-1">
                              <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    report.score >= 95 ? "bg-green-500" :
                                    report.score >= 80 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${report.score}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${
                                report.score >= 95 ? "text-green-600" :
                                report.score >= 80 ? "text-amber-600" : "text-red-600"
                              }`}>
                                {report.score}
                              </span>
                            </div>
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
          <Card className="border-t-4 border-t-purple-500 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-slate-50 border-b">
              <CardTitle className="flex items-center text-purple-700">
                <DollarSign className="h-5 w-5 mr-2 text-purple-500" />
                {"Pagamentos por Equipa"}
              </CardTitle>
              <CardDescription>
                {"Resumo dos pagamentos por equipa"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead className="font-semibold text-slate-700">{"Equipa"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Valor Pendente"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Valor Pago"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Total"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Percentual"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentSummaryByTeam.map((team, index) => (
                    <TableRow key={team.teamId} className={index % 2 === 0 ? "bg-slate-50" : ""}>
                      <TableCell className="font-medium text-slate-800 border-l-4 border-l-purple-300">{team.teamName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                          <span className="text-purple-600 font-medium">{team.totalPending}€</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-blue-600 font-medium">{team.totalPaid}€</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">{team.total}€</TableCell>
                      <TableCell>
                        {team.total > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-3 rounded-full bg-slate-200 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{ width: `${Math.round((team.total / totalPaymentAmount) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {Math.round((team.total / totalPaymentAmount) * 100)}%
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 hover:bg-slate-200">
                    <TableHead className="font-bold text-slate-800">{"Totais"}</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                        <span className="text-purple-600 font-medium">{totalPendingAmount}€</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-blue-600 font-medium">{totalPaidAmount}€</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-lg">{totalPaymentAmount}€</TableHead>
                    <TableHead className="font-bold">100%</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dueDates" className="space-y-4">
          <Card className="border-t-4 border-t-amber-500 shadow-lg overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-slate-50 border-b">
              <CardTitle className="flex items-center text-amber-700">
                <BellRing className="h-5 w-5 mr-2 text-amber-500" />
                {"Pagamentos Próximos"}
              </CardTitle>
              <CardDescription>
                {"Pagamentos com vencimento nos próximos dias"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow className="hover:bg-slate-100">
                    <TableHead className="font-semibold text-slate-700">{"Data de Vencimento"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Equipa"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Propriedade"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Valor"}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{"Ações"}</TableHead>
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
                        <TableRow key={report.id} className={index % 2 === 0 ? "bg-slate-50" : ""}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                isPastDue ? "bg-red-500" :
                                isDueSoon ? "bg-amber-500" : "bg-green-500"
                              }`}></div>
                              <Calendar className={`h-4 w-4 mr-2 ${
                                isPastDue ? "text-red-500" :
                                isDueSoon ? "text-amber-500" : "text-green-500"
                              }`} />
                              <span 
                                className={
                                  isPastDue ? "text-red-600 font-medium" :
                                  isDueSoon ? "text-amber-600 font-medium" : "text-slate-600"
                                }
                              >
                                {new Date(report.paymentDueDate).toLocaleDateString()}
                                {isPastDue && (
                                  <span className="ml-1 inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                    <AlertTriangle size={10} className="mr-0.5" /> 
                                    {Math.abs(diffDays)} dias de atraso
                                  </span>
                                )}
                                {isDueSoon && !isPastDue && (
                                  <span className="ml-1 inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                    <BellRing size={10} className="mr-0.5" /> 
                                    em {diffDays} dias
                                  </span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">{report.teamName}</TableCell>
                          <TableCell className="text-slate-700">{report.propertyName}</TableCell>
                          <TableCell>
                            <span className="text-purple-600 font-medium text-base">{report.paymentAmount}€</span>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0">
                              <DollarSign className="h-3.5 w-3.5 mr-1" />
                              {"Pagar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {filteredReports.filter(r => r.paymentStatus === "pending").length === 0 && (
                <div className="p-8 text-center bg-slate-50">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-slate-600 font-medium">{"Não há pagamentos pendentes no momento."}</p>
                  <p className="text-slate-500 text-sm mt-1">Todos os pagamentos estão em dia! 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}