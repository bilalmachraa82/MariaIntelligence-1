import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import DailyTasksDashboard from "@/components/dashboard/daily-tasks-dashboard-responsive";
import NewModernDashboard from "@/components/dashboard/new-modern-dashboard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function DashboardFullPage() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pb-16 md:pb-0" // Adiciona padding no fundo para dispositivos móveis
    >
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        {/* Cabeçalho com botão de volta */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              {t("dashboard.fullDashboard", "Dashboard Completo")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.fullDashboardDescription", "Visualização detalhada de todas as atividades")}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("dashboard.backToOverview", "Voltar à Visão Geral")}
          </Button>
        </motion.div>
        
        {/* Visualização financeira completa */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("dashboard.financialSummary", "Resumo Financeiro")}</CardTitle>
            </CardHeader>
            <CardContent>
              <NewModernDashboard minimal={false} />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Tarefas diárias completas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("dashboard.dailyTasks", "Tarefas do Dia")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DailyTasksDashboard minimal={false} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}