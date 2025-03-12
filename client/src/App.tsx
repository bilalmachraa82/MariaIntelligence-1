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
import { Layout } from "@/components/layout/layout";
import { useTranslation } from "react-i18next";

// Imports das páginas de equipes de limpeza
import CleaningTeamsPage from "@/pages/cleaning-teams";
import CleaningReportsPage from "@/pages/cleaning-reports";
import OwnerReportPage from "@/pages/reports/owner-report";

function Router() {
  return (
    <Switch>
      {/* Rotas em inglês */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/properties/edit/:id?" component={PropertyEditPage} />
      <Route path="/owners" component={OwnersPage} />
      <Route path="/owners/:id" component={OwnerDetailPage} />
      <Route path="/owners/edit/:id?" component={OwnerEditPage} />
      <Route path="/reservations" component={ReservationsPage} />
      <Route path="/reservations/:id" component={ReservationDetailPage} />
      <Route path="/reservations/new" component={ReservationNewPage} />
      <Route path="/cleaning-teams" component={CleaningTeamsPage} />
      <Route path="/cleaning-teams/:id" component={() => <div>Cleaning Team Details (Coming Soon)</div>} />
      <Route path="/cleaning-teams/new" component={() => <div>New Cleaning Team (Coming Soon)</div>} />
      <Route path="/cleaning-reports" component={CleaningReportsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/reports/owner-report" component={OwnerReportPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/assistant" component={() => <div>AI Assistant (Coming Soon)</div>} />
      
      {/* Rotas em português */}
      <Route path="/painel" component={Dashboard} />
      <Route path="/propriedades" component={PropertiesPage} />
      <Route path="/propriedades/:id" component={PropertyDetailPage} />
      <Route path="/propriedades/editar/:id?" component={PropertyEditPage} />
      <Route path="/proprietarios" component={OwnersPage} />
      <Route path="/proprietarios/:id" component={OwnerDetailPage} />
      <Route path="/proprietarios/editar/:id?" component={OwnerEditPage} />
      <Route path="/reservas" component={ReservationsPage} />
      <Route path="/reservas/:id" component={ReservationDetailPage} />
      <Route path="/reservas/nova" component={ReservationNewPage} />
      <Route path="/equipas-limpeza" component={CleaningTeamsPage} />
      <Route path="/equipas-limpeza/:id" component={() => <div>Detalhes da Equipa de Limpeza (Em breve)</div>} />
      <Route path="/equipas-limpeza/nova" component={() => <div>Nova Equipa de Limpeza (Em breve)</div>} />
      <Route path="/relatorios-limpeza" component={CleaningReportsPage} />
      <Route path="/relatorios" component={ReportsPage} />
      <Route path="/relatorios/proprietario" component={OwnerReportPage} />
      <Route path="/configuracoes" component={SettingsPage} />
      <Route path="/assistente" component={() => <div>Assistente IA (Em breve)</div>} />
      
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
