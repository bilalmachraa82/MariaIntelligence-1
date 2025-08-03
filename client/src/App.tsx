import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
// Importar configuração i18n
import "./i18n/config";
import DashboardFull from "@/pages/dashboard-full";
import { enforceCleanMode } from "./enforce-clean-mode";
import PropertiesPage from "@/pages/properties";
import PropertyDetailPage from "@/pages/properties/[id]";
import PropertyEditPage from "@/pages/properties/edit";
import OwnersPage from "@/pages/owners";
import OwnerDetailPage from "@/pages/owners/[id]";
import OwnerEditPage from "@/pages/owners/edit";
import ReservationsPage from "@/pages/reservations";
import ReservationDetailPage from "@/pages/reservations/[id]";
import ReservationNewPage from "@/pages/reservations/new";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import DocumentScanPage from "@/pages/pdf-upload";
import AssistantPage from "@/pages/assistant";
import ReservationAssistantPage from "@/pages/reservation-assistant";
import DemoDataPage from "@/pages/demo-data";
import ForceResetDemoData from "@/pages/demo-data/force-reset";
import { Layout } from "@/components/layout/layout";
import { useEffect } from 'react';

// Imports das páginas de equipes de limpeza
import CleaningTeamsPage from "@/pages/cleaning-teams";
import CleaningSchedulesPage from "@/pages/cleaning-teams/schedules";
import CleaningReportsPage from "@/pages/cleaning-reports";
import OwnerReportPage from "@/pages/reports/owner-report";
import TrendsReportPage from "@/pages/reports/trends";
import MonthlyInvoicePage from "@/pages/reports/monthly-invoice";
import BudgetCalculatorPage from "@/pages/budget-calculator";

// Imports das novas páginas de manutenção e pagamentos
import MaintenancePending from "@/pages/maintenance/pending";
import MaintenanceRequest from "@/pages/maintenance/request";
import MaintenanceNewTask from "@/pages/maintenance/new";
import PaymentsOutgoing from "@/pages/payments/outgoing";
import PaymentsIncoming from "@/pages/payments/incoming";
import PaymentNewPage from "@/pages/payments/new";
import ReservationApprovalPage from "@/pages/reservations/approval";

// Imports das páginas financeiras
import FinancialDocumentsPage from "@/pages/financial/documents";
import DocumentDetailPage from "@/pages/financial/documents/[id]";
import NewDocumentPage from "@/pages/financial/documents/new";
import EditDocumentPage from "@/pages/financial/documents/edit/[id]";
import NewDocumentItemPage from "@/pages/financial/documents/items/new";
import EditDocumentItemPage from "@/pages/financial/documents/items/edit/[id]";
import NewPaymentPage from "@/pages/financial/documents/payments/new";
import EditPaymentPage from "@/pages/financial/documents/payments/edit/[id]";

// Import da página de estatísticas de propriedades
import PropertyStatisticsPage from "@/pages/properties/estatisticas";

// Imports das páginas de orçamentos
import QuotationsPage from "@/pages/quotations";
import QuotationNewPage from "@/pages/quotations/new";
import QuotationDetailPage from "@/pages/quotations/[id]";
import QuotationEditPage from "@/pages/quotations/[id]/edit";

// Garantir que a aplicação sempre use light mode
document.documentElement.classList.remove("dark");
localStorage.removeItem("darkMode");
localStorage.removeItem("theme");

function Router() {
  return (
    <Switch>
      {/* Rotas principais */}
      <Route path="/" component={DashboardFull} />
      <Route path="/painel" component={DashboardFull} />
      <Route path="/painel-completo" component={DashboardFull} />
      
      {/* Propriedades */}
      <Route path="/propriedades" component={PropertiesPage} />
      <Route path="/propriedades/editar/:id?" component={PropertyEditPage} />
      <Route path="/propriedades/estatisticas" component={PropertyStatisticsPage} />
      <Route path="/propriedades/:id" component={PropertyDetailPage} />
      
      {/* Proprietários */}
      <Route path="/proprietarios" component={OwnersPage} />
      <Route path="/proprietarios/editar/:id?" component={OwnerEditPage} />
      <Route path="/proprietarios/:id" component={OwnerDetailPage} />
      
      {/* Reservas */}
      <Route path="/reservas" component={ReservationsPage} />
      <Route path="/reservas/nova" component={ReservationNewPage} />
      <Route path="/reservas/:id" component={ReservationDetailPage} />
      <Route path="/reservas/aprovacao" component={ReservationApprovalPage} />
      
      {/* Calculadora de orçamento */}
      <Route path="/calculadora-orcamento" component={BudgetCalculatorPage} />
      
      {/* Upload de documentos */}
      <Route path="/upload-pdf" component={DocumentScanPage} />
      <Route path="/enviar-pdf" component={DocumentScanPage} />
      <Route path="/digitalizar" component={DocumentScanPage} />
      
      {/* Equipas de limpeza */}
      <Route path="/equipas-limpeza" component={CleaningTeamsPage} />
      <Route path="/equipas-limpeza/nova" component={() => <div>Nova Equipa de Limpeza (Em breve)</div>} />
      <Route path="/equipas-limpeza/agendamentos" component={CleaningSchedulesPage} />
      <Route path="/equipas-limpeza/:id" component={() => <div>Detalhes da Equipa de Limpeza (Em breve)</div>} />
      <Route path="/relatorios-limpeza" component={CleaningReportsPage} />
      
      {/* Relatórios */}
      <Route path="/relatorios" component={ReportsPage} />
      <Route path="/relatorios/proprietario" component={OwnerReportPage} />
      <Route path="/relatorios/faturacao-mensal" component={MonthlyInvoicePage} />
      <Route path="/relatorios/tendencias" component={TrendsReportPage} />
      
      {/* Configurações */}
      <Route path="/configuracoes" component={SettingsPage} />
      
      {/* Assistente */}
      <Route path="/assistente" component={AssistantPage} />
      <Route path="/assistente-reservas" component={ReservationAssistantPage} />
      
      {/* Dados demo */}
      <Route path="/dados-demo" component={DemoDataPage} />
      <Route path="/dados-demo/remocao-forcada" component={ForceResetDemoData} />
      
      {/* Manutenção */}
      <Route path="/manutencao/pendentes" component={MaintenancePending} />
      <Route path="/manutencao/solicitacao" component={MaintenanceRequest} />
      <Route path="/manutencao/nova" component={MaintenanceNewTask} />
      
      {/* Pagamentos */}
      <Route path="/pagamentos" component={PaymentsIncoming} />
      <Route path="/pagamentos/saida" component={PaymentsOutgoing} />
      <Route path="/pagamentos/entrada" component={PaymentsIncoming} />
      <Route path="/pagamentos/novo" component={PaymentNewPage} />
      
      {/* Documentos financeiros */}
      <Route path="/financeiro/documentos" component={FinancialDocumentsPage} />
      <Route path="/financeiro/documentos/novo" component={NewDocumentPage} />
      <Route path="/financeiro/documentos/editar/:id" component={EditDocumentPage} />
      <Route path="/financeiro/documentos/itens/novo" component={NewDocumentItemPage} />
      <Route path="/financeiro/documentos/itens/editar/:id" component={EditDocumentItemPage} />
      <Route path="/financeiro/documentos/pagamentos/novo" component={NewPaymentPage} />
      <Route path="/financeiro/documentos/pagamentos/editar/:id" component={EditPaymentPage} />
      <Route path="/financeiro/documentos/:id" component={DocumentDetailPage} />
      <Route path="/documentos" component={FinancialDocumentsPage} />
      
      {/* Orçamentos */}
      <Route path="/orcamentos" component={QuotationsPage} />
      <Route path="/orcamentos/novo" component={QuotationNewPage} />
      <Route path="/orcamentos/:id/editar" component={QuotationEditPage} />
      <Route path="/orcamentos/:id" component={QuotationDetailPage} />
      
      {/* Página não encontrada */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Forçar limpeza de dados demo na inicialização
  // Este código é executado sempre que o aplicativo é iniciado/recarregado
  useEffect(() => {
    // Forçar o modo limpo (sem dados demo) uma única vez na inicialização
    enforceCleanMode();
    console.log('Modo limpo aplicado: todos os dados demo estão permanentemente bloqueados');
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
