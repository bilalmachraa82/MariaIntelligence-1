import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
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
import { useTranslation } from "react-i18next";
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

// Inicializador de tema com tratamento de erros aprimorado
const initializeDarkMode = () => {
  // Funções auxiliares para aplicar temas
  const applyDarkTheme = () => document.documentElement.classList.add("dark");
  const applyLightTheme = () => document.documentElement.classList.remove("dark");
  
  // Verificar legacy preference (darkMode boolean)
  const legacyPreference = localStorage.getItem("darkMode");
  if (legacyPreference === "true") {
    applyDarkTheme();
    return;
  }
  
  // Buscar tema salvo
  const storedTheme = localStorage.getItem("theme");
  if (!storedTheme) {
    // Se não existir, criar tema padrão e salvar
    const defaultTheme = { 
      appearance: "system", 
      primary: "blue", 
      radius: 0.5, 
      variant: "tint" 
    };
    localStorage.setItem("theme", JSON.stringify(defaultTheme));
    
    // Verificar preferência do sistema
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyDarkTheme();
    } else {
      applyLightTheme();
    }
    return;
  }
  
  // Processar tema salvo
  if (storedTheme === "dark") {
    // Formato simples antigo - dark string
    applyDarkTheme();
    return;
  } else if (storedTheme === "light") {
    // Formato simples antigo - light string
    applyLightTheme();
    return;
  }
  
  // Tentar processar formato JSON
  try {
    const themeObject = JSON.parse(storedTheme);
    
    // Aplicar configuração baseada no tipo
    if (themeObject.appearance === "dark") {
      applyDarkTheme();
    } else if (themeObject.appearance === "light") {
      applyLightTheme();
    } else if (themeObject.appearance === "system") {
      // Usar preferência do sistema
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        applyDarkTheme();
      } else {
        applyLightTheme();
      }
      
      // Listener para mudanças na preferência do sistema
      window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          if (e.matches) {
            applyDarkTheme();
          } else {
            applyLightTheme();
          }
        });
    }
  } catch (e) {
    // Em caso de erro de parsing, usar tema claro como fallback
    console.error("Erro ao processar tema:", e);
    applyLightTheme();
    
    // Salvar tema padrão para corrigir o problema
    localStorage.setItem("theme", JSON.stringify({ 
      appearance: "light", 
      primary: "blue", 
      radius: 0.5, 
      variant: "tint" 
    }));
  }
};

// Executa a inicialização do tema escuro
initializeDarkMode();

function Router() {
  return (
    <Switch>
      {/* Rotas em inglês */}
      <Route path="/" component={DashboardFull} />
      <Route path="/dashboard" component={DashboardFull} />
      <Route path="/dashboard-full" component={DashboardFull} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/edit/:id?" component={PropertyEditPage} />
      <Route path="/properties/estatisticas" component={PropertyStatisticsPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/owners" component={OwnersPage} />
      <Route path="/owners/edit/:id?" component={OwnerEditPage} />
      <Route path="/owners/:id" component={OwnerDetailPage} />
      <Route path="/reservations" component={ReservationsPage} />
      <Route path="/reservations/new" component={ReservationNewPage} />
      <Route path="/reservations/:id" component={ReservationDetailPage} />
      <Route path="/reservations/approval" component={ReservationApprovalPage} />
      <Route path="/budget-calculator" component={BudgetCalculatorPage} />
      <Route path="/calculadora-orcamento" component={BudgetCalculatorPage} />
      <Route path="/upload-pdf" component={DocumentScanPage} />
      <Route path="/scan" component={DocumentScanPage} />
      <Route path="/pdf-upload" component={DocumentScanPage} />
      <Route path="/cleaning-teams" component={CleaningTeamsPage} />
      <Route path="/cleaning-teams/new" component={() => <div>New Cleaning Team (Coming Soon)</div>} />
      <Route path="/cleaning-teams/schedules" component={CleaningSchedulesPage} />
      <Route path="/cleaning-teams/:id" component={() => <div>Cleaning Team Details (Coming Soon)</div>} />
      <Route path="/cleaning-reports" component={CleaningReportsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/reports/owner-report" component={OwnerReportPage} />
      <Route path="/reports/monthly-invoice" component={MonthlyInvoicePage} />
      <Route path="/reports/trends" component={TrendsReportPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/assistant" component={AssistantPage} />
      <Route path="/reservation-assistant" component={ReservationAssistantPage} />
      <Route path="/demo-data" component={DemoDataPage} />
      <Route path="/demo-data/force-reset" component={ForceResetDemoData} />
      <Route path="/maintenance/pending" component={MaintenancePending} />
      <Route path="/maintenance/request" component={MaintenanceRequest} />
      <Route path="/maintenance/new" component={MaintenanceNewTask} />
      <Route path="/payments" component={PaymentsIncoming} /> {/* Página principal de pagamentos por padrão mostra recebimentos */}
      <Route path="/payments/outgoing" component={PaymentsOutgoing} />
      <Route path="/payments/incoming" component={PaymentsIncoming} />
      <Route path="/payments/new" component={PaymentNewPage} />
      
      {/* Rotas financeiras */}
      <Route path="/financial/documents" component={FinancialDocumentsPage} />
      <Route path="/financial/documents/new" component={NewDocumentPage} />
      <Route path="/financial/documents/edit/:id" component={EditDocumentPage} />
      <Route path="/financial/documents/items/new" component={NewDocumentItemPage} />
      <Route path="/financial/documents/items/edit/:id" component={EditDocumentItemPage} />
      <Route path="/financial/documents/payments/new" component={NewPaymentPage} />
      <Route path="/financial/documents/payments/edit/:id" component={EditPaymentPage} />
      <Route path="/financial/documents/:id" component={DocumentDetailPage} />
      
      {/* Rotas de orçamentos */}
      <Route path="/quotations" component={QuotationsPage} />
      <Route path="/quotations/new" component={QuotationNewPage} />
      <Route path="/quotations/:id/edit" component={QuotationEditPage} />
      <Route path="/quotations/:id" component={QuotationDetailPage} />
      
      {/* Rotas em português */}
      <Route path="/painel" component={DashboardFull} />
      <Route path="/painel-completo" component={DashboardFull} />
      <Route path="/propriedades" component={PropertiesPage} />
      <Route path="/propriedades/editar/:id?" component={PropertyEditPage} />
      <Route path="/propriedades/estatisticas" component={PropertyStatisticsPage} />
      <Route path="/propriedades/:id" component={PropertyDetailPage} />
      <Route path="/proprietarios" component={OwnersPage} />
      <Route path="/proprietarios/editar/:id?" component={OwnerEditPage} />
      <Route path="/proprietarios/:id" component={OwnerDetailPage} />
      <Route path="/reservas" component={ReservationsPage} />
      <Route path="/reservas/nova" component={ReservationNewPage} />
      <Route path="/reservas/:id" component={ReservationDetailPage} />
      <Route path="/reservas/aprovacao" component={ReservationApprovalPage} />
      <Route path="/upload-pdf" component={DocumentScanPage} />
      <Route path="/enviar-pdf" component={DocumentScanPage} />
      <Route path="/digitalizar" component={DocumentScanPage} />
      <Route path="/equipas-limpeza" component={CleaningTeamsPage} />
      <Route path="/equipas-limpeza/nova" component={() => <div>Nova Equipa de Limpeza (Em breve)</div>} />
      <Route path="/equipas-limpeza/agendamentos" component={CleaningSchedulesPage} />
      <Route path="/equipas-limpeza/:id" component={() => <div>Detalhes da Equipa de Limpeza (Em breve)</div>} />
      <Route path="/relatorios-limpeza" component={CleaningReportsPage} />
      <Route path="/relatorios" component={ReportsPage} />
      <Route path="/relatorios/proprietario" component={OwnerReportPage} />
      <Route path="/relatorios/faturacao-mensal" component={MonthlyInvoicePage} />
      <Route path="/relatorios/tendencias" component={TrendsReportPage} />
      <Route path="/configuracoes" component={SettingsPage} />
      <Route path="/assistente" component={AssistantPage} />
      <Route path="/assistente-reservas" component={ReservationAssistantPage} />
      <Route path="/dados-demo" component={DemoDataPage} />
      <Route path="/dados-demo/remocao-forcada" component={ForceResetDemoData} />
      <Route path="/manutencao/pendentes" component={MaintenancePending} />
      <Route path="/manutencao/solicitacao" component={MaintenanceRequest} />
      <Route path="/manutencao/nova" component={MaintenanceNewTask} />
      <Route path="/pagamentos" component={PaymentsIncoming} /> {/* Página principal de pagamentos por padrão mostra recebimentos */}
      <Route path="/pagamentos/saida" component={PaymentsOutgoing} />
      <Route path="/pagamentos/entrada" component={PaymentsIncoming} />
      <Route path="/pagamentos/novo" component={PaymentNewPage} />
      
      {/* Rotas financeiras em português */}
      <Route path="/financeiro/documentos" component={FinancialDocumentsPage} />
      <Route path="/financeiro/documentos/novo" component={NewDocumentPage} />
      <Route path="/financeiro/documentos/editar/:id" component={EditDocumentPage} />
      <Route path="/financeiro/documentos/itens/novo" component={NewDocumentItemPage} />
      <Route path="/financeiro/documentos/itens/editar/:id" component={EditDocumentItemPage} />
      <Route path="/financeiro/documentos/pagamentos/novo" component={NewPaymentPage} />
      <Route path="/financeiro/documentos/pagamentos/editar/:id" component={EditPaymentPage} />
      <Route path="/financeiro/documentos/:id" component={DocumentDetailPage} />
      <Route path="/documentos" component={FinancialDocumentsPage} />
      
      {/* Rotas de orçamentos em português */}
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
