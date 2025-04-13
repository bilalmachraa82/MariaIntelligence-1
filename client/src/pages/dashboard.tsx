import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import NewModernDashboard from "@/components/dashboard/new-modern-dashboard";
import DailyTasksDashboard from "@/components/dashboard/daily-tasks-dashboard-responsive";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Activity, ArrowRight, Check, LogOut, Sparkles, BarChart2 } from "lucide-react";
import { InspirationQuote } from "@/components/ui/inspiration-quote";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  
  // Definindo cards animados para entrada
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pb-16 md:pb-0" // Adiciona padding no fundo para dispositivos móveis (evitar sobreposição com a bottom nav)
    >
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        {/* Cabeçalho simplificado */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              {t("dashboard.welcome", "Olá Carina!")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </motion.div>
        
        {/* Principal: Área de acesso rápido simplificada */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Coluna 1: Ações principais */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("dashboard.quickActions", "Ações Rápidas")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Button 
                variant="outline" 
                className="w-full justify-start text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => setLocation("/reservations")}
              >
                <Check className="h-4 w-4 mr-2" />
                {t("dashboard.checkinsToday", "Check-ins de Hoje")}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                onClick={() => setLocation("/reservations")}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("dashboard.checkoutsToday", "Check-outs de Hoje")}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={() => setLocation("/cleaning-teams")}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("dashboard.scheduledCleanings", "Limpezas Agendadas")}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                onClick={() => setLocation("/dashboard-full")}
              >
                <Activity className="h-4 w-4 mr-2" />
                {t("dashboard.financialDashboard", "Dashboard Financeiro")}
              </Button>
            </CardContent>
          </Card>
          
          {/* Coluna 2 e 3: Resumo de tarefas simplificado */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t("dashboard.todaysSchedule", "Agenda de Hoje")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                <DailyTasksDashboard minimal={true} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Visualização financeira simplificada */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-8"
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{t("dashboard.financialSummary", "Resumo Financeiro")}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation("/dashboard-full")}
                  className="text-muted-foreground hover:text-primary"
                >
                  {t("dashboard.viewDetails", "Ver Detalhes")}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <NewModernDashboard minimal={true} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
