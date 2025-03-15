import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
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
import PDFUploadPage from "@/pages/pdf-upload";
import AssistantPage from "@/pages/assistant";
import DemoDataPage from "@/pages/demo-data";
import { Layout } from "@/components/layout/layout";
import { useTranslation } from "react-i18next";
import { useEffect } from 'react';

// Imports das páginas de equipes de limpeza
import CleaningTeamsPage from "@/pages/cleaning-teams";
import CleaningReportsPage from "@/pages/cleaning-reports";
import OwnerReportPage from "@/pages/reports/owner-report";
import TrendsReportPage from "@/pages/reports/trends";
import MonthlyInvoicePage from "@/pages/reports/monthly-invoice";

// Imports das novas páginas de manutenção e pagamentos
import MaintenancePending from "@/pages/maintenance/pending";
import MaintenanceRequest from "@/pages/maintenance/request";
import PaymentsOutgoing from "@/pages/payments/outgoing";
import PaymentsIncoming from "@/pages/payments/incoming";
import PaymentNewPage from "@/pages/payments/new";

// Imports das páginas financeiras
import FinancialDocumentsPage from "@/pages/financial/documents";
import DocumentDetailPage from "@/pages/financial/documents/[id]";
import NewDocumentPage from "@/pages/financial/documents/new";
import EditDocumentPage from "@/pages/financial/documents/edit/[id]";
import NewDocumentItemPage from "@/pages/financial/documents/items/new";
import EditDocumentItemPage from "@/pages/financial/documents/items/edit/[id]";
import NewPaymentPage from "@/pages/financial/documents/payments/new";
import EditPaymentPage from "@/pages/financial/documents/payments/edit/[id]";

// Inicializa o tema escuro conforme a preferência salva
const initializeDarkMode = () => {
  // Verifica se o modo escuro está ativado no localStorage
  const darkModePreference = localStorage.getItem("darkMode");
  const isDark = darkModePreference === "true";
  
  // Aplica a classe 'dark' no elemento html se o modo escuro estiver ativado
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  
  // Também verifica a preferência do sistema se estiver no modo 'system'
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
    try {
      const theme = JSON.parse(storedTheme);
      if (theme.appearance === "system") {
        // Verifica preferência do sistema
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        
        // Adiciona listener para mudanças na preferência do sistema
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
          if (e.matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        });
      }
    } catch (e) {
      console.error("Erro ao analisar tema armazenado:", e);
    }
  }
};

// Executa a inicialização do tema escuro
initializeDarkMode();

function Router() {
  return (
    <Switch>
      {/* Rotas em inglês */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/edit/:id?" component={PropertyEditPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/owners" component={OwnersPage} />
      <Route path="/owners/edit/:id?" component={OwnerEditPage} />
      <Route path="/owners/:id" component={OwnerDetailPage} />
      <Route path="/reservations" component={ReservationsPage} />
      <Route path="/reservations/new" component={ReservationNewPage} />
      <Route path="/reservations/:id" component={ReservationDetailPage} />
      <Route path="/upload-pdf" component={PDFUploadPage} />
      <Route path="/cleaning-teams" component={CleaningTeamsPage} />
      <Route path="/cleaning-teams/new" component={() => <div>New Cleaning Team (Coming Soon)</div>} />
      <Route path="/cleaning-teams/:id" component={() => <div>Cleaning Team Details (Coming Soon)</div>} />
      <Route path="/cleaning-reports" component={CleaningReportsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/reports/owner-report" component={OwnerReportPage} />
      <Route path="/reports/monthly-invoice" component={MonthlyInvoicePage} />
      <Route path="/reports/trends" component={TrendsReportPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/assistant" component={AssistantPage} />
      <Route path="/demo-data" component={DemoDataPage} />
      <Route path="/maintenance/pending" component={MaintenancePending} />
      <Route path="/maintenance/request" component={MaintenanceRequest} />
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
      
      {/* Rotas em português */}
      <Route path="/painel" component={Dashboard} />
      <Route path="/propriedades" component={PropertiesPage} />
      <Route path="/propriedades/editar/:id?" component={PropertyEditPage} />
      <Route path="/propriedades/:id" component={PropertyDetailPage} />
      <Route path="/proprietarios" component={OwnersPage} />
      <Route path="/proprietarios/editar/:id?" component={OwnerEditPage} />
      <Route path="/proprietarios/:id" component={OwnerDetailPage} />
      <Route path="/reservas" component={ReservationsPage} />
      <Route path="/reservas/nova" component={ReservationNewPage} />
      <Route path="/reservas/:id" component={ReservationDetailPage} />
      <Route path="/upload-pdf" component={PDFUploadPage} />
      <Route path="/enviar-pdf" component={PDFUploadPage} />
      <Route path="/equipas-limpeza" component={CleaningTeamsPage} />
      <Route path="/equipas-limpeza/nova" component={() => <div>Nova Equipa de Limpeza (Em breve)</div>} />
      <Route path="/equipas-limpeza/:id" component={() => <div>Detalhes da Equipa de Limpeza (Em breve)</div>} />
      <Route path="/relatorios-limpeza" component={CleaningReportsPage} />
      <Route path="/relatorios" component={ReportsPage} />
      <Route path="/relatorios/proprietario" component={OwnerReportPage} />
      <Route path="/relatorios/faturacao-mensal" component={MonthlyInvoicePage} />
      <Route path="/relatorios/tendencias" component={TrendsReportPage} />
      <Route path="/configuracoes" component={SettingsPage} />
      <Route path="/assistente" component={AssistantPage} />
      <Route path="/dados-demo" component={DemoDataPage} />
      <Route path="/manutencao/pendentes" component={MaintenancePending} />
      <Route path="/manutencao/solicitacao" component={MaintenanceRequest} />
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
      
      {/* Página não encontrada */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
