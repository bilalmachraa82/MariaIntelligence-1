import { lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { LazyWrapper } from "@/shared/components/LazyWrapper";
import { Layout } from "@/components/layout/layout";
import { useEffect } from 'react';
import { enforceCleanMode } from "./enforce-clean-mode";

// Import i18n configuration
import "./i18n/config";

// ========================================
// SYNCHRONOUS IMPORTS (Critical pages only)
// ========================================
import NotFound from "@/pages/not-found";
import DashboardFull from "@/pages/dashboard-full";

// ========================================
// LAZY LOADED PAGES (Everything else)
// ========================================
// Properties
const PropertiesPage = lazy(() => import("@/pages/properties"));
const PropertyDetailPage = lazy(() => import("@/pages/properties/[id]"));
const PropertyEditPage = lazy(() => import("@/pages/properties/edit"));
const PropertyStatisticsPage = lazy(() => import("@/pages/properties/estatisticas"));

// Owners
const OwnersPage = lazy(() => import("@/pages/owners"));
const OwnerDetailPage = lazy(() => import("@/pages/owners/[id]"));
const OwnerEditPage = lazy(() => import("@/pages/owners/edit"));

// Reservations
const ReservationsPage = lazy(() => import("@/pages/reservations"));
const ReservationDetailPage = lazy(() => import("@/pages/reservations/[id]"));
const ReservationNewPage = lazy(() => import("@/pages/reservations/new"));
const ReservationApprovalPage = lazy(() => import("@/pages/reservations/approval"));

// Reports
const ReportsPage = lazy(() => import("@/pages/reports"));
const OwnerReportPage = lazy(() => import("@/pages/reports/owner-report"));
const TrendsReportPage = lazy(() => import("@/pages/reports/trends"));
const MonthlyInvoicePage = lazy(() => import("@/pages/reports/monthly-invoice"));

// Settings & Tools
const SettingsPage = lazy(() => import("@/pages/settings"));
const DocumentScanPage = lazy(() => import("@/pages/pdf-upload"));
const BudgetCalculatorPage = lazy(() => import("@/pages/budget-calculator"));

// Assistants
const AssistantPage = lazy(() => import("@/pages/assistant"));
const ReservationAssistantPage = lazy(() => import("@/pages/reservation-assistant"));

// Demo Data
const DemoDataPage = lazy(() => import("@/pages/demo-data"));
const ForceResetDemoData = lazy(() => import("@/pages/demo-data/force-reset"));

// Cleaning Teams
const CleaningTeamsPage = lazy(() => import("@/pages/cleaning-teams"));
const CleaningSchedulesPage = lazy(() => import("@/pages/cleaning-teams/schedules"));
const CleaningReportsPage = lazy(() => import("@/pages/cleaning-reports"));

// Maintenance
const MaintenancePending = lazy(() => import("@/pages/maintenance/pending"));
const MaintenanceRequest = lazy(() => import("@/pages/maintenance/request"));
const MaintenanceNewTask = lazy(() => import("@/pages/maintenance/new"));

// Payments
const PaymentsOutgoing = lazy(() => import("@/pages/payments/outgoing"));
const PaymentsIncoming = lazy(() => import("@/pages/payments/incoming"));
const PaymentNewPage = lazy(() => import("@/pages/payments/new"));

// Financial Documents
const FinancialDocumentsPage = lazy(() => import("@/pages/financial/documents"));
const DocumentDetailPage = lazy(() => import("@/pages/financial/documents/[id]"));
const NewDocumentPage = lazy(() => import("@/pages/financial/documents/new"));
const EditDocumentPage = lazy(() => import("@/pages/financial/documents/edit/[id]"));
const NewDocumentItemPage = lazy(() => import("@/pages/financial/documents/items/new"));
const EditDocumentItemPage = lazy(() => import("@/pages/financial/documents/items/edit/[id]"));
const NewPaymentPage = lazy(() => import("@/pages/financial/documents/payments/new"));
const EditPaymentPage = lazy(() => import("@/pages/financial/documents/payments/edit/[id]"));

// Quotations
const QuotationsPage = lazy(() => import("@/pages/quotations"));
const QuotationNewPage = lazy(() => import("@/pages/quotations/new"));
const QuotationDetailPage = lazy(() => import("@/pages/quotations/[id]"));
const QuotationEditPage = lazy(() => import("@/pages/quotations/[id]/edit"));

// Guarantee light mode
document.documentElement.classList.remove("dark");
localStorage.removeItem("darkMode");
localStorage.removeItem("theme");

// ========================================
// LAZY ROUTE COMPONENT WRAPPER
// ========================================
const LazyRoute = ({ component: Component }: { component: React.ComponentType<any> }) => (
  <LazyWrapper>
    <Component />
  </LazyWrapper>
);

function Router() {
  return (
    <Switch>
      {/* Main Routes (Critical - loaded immediately) */}
      <Route path="/" component={DashboardFull} />
      <Route path="/painel" component={DashboardFull} />
      <Route path="/painel-completo" component={DashboardFull} />

      {/* Properties (Lazy loaded) */}
      <Route path="/propriedades" component={() => <LazyRoute component={PropertiesPage} />} />
      <Route path="/propriedades/editar/:id?" component={() => <LazyRoute component={PropertyEditPage} />} />
      <Route path="/propriedades/estatisticas" component={() => <LazyRoute component={PropertyStatisticsPage} />} />
      <Route path="/propriedades/:id" component={() => <LazyRoute component={PropertyDetailPage} />} />

      {/* Owners (Lazy loaded) */}
      <Route path="/proprietarios" component={() => <LazyRoute component={OwnersPage} />} />
      <Route path="/proprietarios/editar/:id?" component={() => <LazyRoute component={OwnerEditPage} />} />
      <Route path="/proprietarios/:id" component={() => <LazyRoute component={OwnerDetailPage} />} />

      {/* Reservations (Lazy loaded) */}
      <Route path="/reservas" component={() => <LazyRoute component={ReservationsPage} />} />
      <Route path="/reservas/nova" component={() => <LazyRoute component={ReservationNewPage} />} />
      <Route path="/reservas/:id" component={() => <LazyRoute component={ReservationDetailPage} />} />
      <Route path="/reservas/aprovacao" component={() => <LazyRoute component={ReservationApprovalPage} />} />

      {/* Budget Calculator (Lazy loaded) */}
      <Route path="/calculadora-orcamento" component={() => <LazyRoute component={BudgetCalculatorPage} />} />

      {/* Document Upload (Lazy loaded) */}
      <Route path="/upload-pdf" component={() => <LazyRoute component={DocumentScanPage} />} />
      <Route path="/enviar-pdf" component={() => <LazyRoute component={DocumentScanPage} />} />
      <Route path="/digitalizar" component={() => <LazyRoute component={DocumentScanPage} />} />

      {/* Cleaning Teams (Lazy loaded) */}
      <Route path="/equipas-limpeza" component={() => <LazyRoute component={CleaningTeamsPage} />} />
      <Route path="/equipas-limpeza/nova" component={() => <div>Nova Equipa de Limpeza (Em breve)</div>} />
      <Route path="/equipas-limpeza/agendamentos" component={() => <LazyRoute component={CleaningSchedulesPage} />} />
      <Route path="/equipas-limpeza/:id" component={() => <div>Detalhes da Equipa de Limpeza (Em breve)</div>} />
      <Route path="/relatorios-limpeza" component={() => <LazyRoute component={CleaningReportsPage} />} />

      {/* Reports (Lazy loaded) */}
      <Route path="/relatorios" component={() => <LazyRoute component={ReportsPage} />} />
      <Route path="/relatorios/proprietario" component={() => <LazyRoute component={OwnerReportPage} />} />
      <Route path="/relatorios/faturacao-mensal" component={() => <LazyRoute component={MonthlyInvoicePage} />} />
      <Route path="/relatorios/tendencias" component={() => <LazyRoute component={TrendsReportPage} />} />

      {/* Settings (Lazy loaded) */}
      <Route path="/configuracoes" component={() => <LazyRoute component={SettingsPage} />} />

      {/* Assistant (Lazy loaded) */}
      <Route path="/assistente" component={() => <LazyRoute component={AssistantPage} />} />
      <Route path="/assistente-reservas" component={() => <LazyRoute component={ReservationAssistantPage} />} />

      {/* Demo Data (Lazy loaded) */}
      <Route path="/dados-demo" component={() => <LazyRoute component={DemoDataPage} />} />
      <Route path="/dados-demo/remocao-forcada" component={() => <LazyRoute component={ForceResetDemoData} />} />

      {/* Maintenance (Lazy loaded) */}
      <Route path="/manutencao/pendentes" component={() => <LazyRoute component={MaintenancePending} />} />
      <Route path="/manutencao/solicitacao" component={() => <LazyRoute component={MaintenanceRequest} />} />
      <Route path="/manutencao/nova" component={() => <LazyRoute component={MaintenanceNewTask} />} />

      {/* Payments (Lazy loaded) */}
      <Route path="/pagamentos" component={() => <LazyRoute component={PaymentsIncoming} />} />
      <Route path="/pagamentos/saida" component={() => <LazyRoute component={PaymentsOutgoing} />} />
      <Route path="/pagamentos/entrada" component={() => <LazyRoute component={PaymentsIncoming} />} />
      <Route path="/pagamentos/novo" component={() => <LazyRoute component={PaymentNewPage} />} />

      {/* Financial Documents (Lazy loaded) */}
      <Route path="/financeiro/documentos" component={() => <LazyRoute component={FinancialDocumentsPage} />} />
      <Route path="/financeiro/documentos/novo" component={() => <LazyRoute component={NewDocumentPage} />} />
      <Route path="/financeiro/documentos/editar/:id" component={() => <LazyRoute component={EditDocumentPage} />} />
      <Route path="/financeiro/documentos/itens/novo" component={() => <LazyRoute component={NewDocumentItemPage} />} />
      <Route path="/financeiro/documentos/itens/editar/:id" component={() => <LazyRoute component={EditDocumentItemPage} />} />
      <Route path="/financeiro/documentos/pagamentos/novo" component={() => <LazyRoute component={NewPaymentPage} />} />
      <Route path="/financeiro/documentos/pagamentos/editar/:id" component={() => <LazyRoute component={EditPaymentPage} />} />
      <Route path="/financeiro/documentos/:id" component={() => <LazyRoute component={DocumentDetailPage} />} />
      <Route path="/documentos" component={() => <LazyRoute component={FinancialDocumentsPage} />} />

      {/* Quotations (Lazy loaded) */}
      <Route path="/orcamentos" component={() => <LazyRoute component={QuotationsPage} />} />
      <Route path="/orcamentos/novo" component={() => <LazyRoute component={QuotationNewPage} />} />
      <Route path="/orcamentos/:id/editar" component={() => <LazyRoute component={QuotationEditPage} />} />
      <Route path="/orcamentos/:id" component={() => <LazyRoute component={QuotationDetailPage} />} />

      {/* 404 - Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force clean mode on initialization
  useEffect(() => {
    enforceCleanMode();
    console.log('Modo limpo aplicado: todos os dados demo estão permanentemente bloqueados');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
