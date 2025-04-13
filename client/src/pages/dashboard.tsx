import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import NewModernDashboard from "@/components/dashboard/new-modern-dashboard";
import DailyTasksDashboard from "@/components/dashboard/daily-tasks-dashboard-responsive";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Activity, ArrowRight, Check, LogOut, Sparkles } from "lucide-react";
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
        {/* Título e data atual em destaque para mobile first */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-3"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              {t("dashboard.welcome", "Olá Maria!")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </motion.div>
        
        {/* Principais tarefas do dia - Cards grandes e clicáveis para mobile first */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4"
        >
          {/* Check-ins de hoje */}
          <motion.div variants={itemVariants}>
            <Card className="h-full bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-100 dark:border-blue-900/40 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full mr-3">
                    <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("dashboard.checkins", "Check-ins de Hoje")}</h3>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                  onClick={() => setLocation("/reservations")}
                >
                  {t("dashboard.viewCheckins", "Ver Check-ins")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Check-outs de hoje */}
          <motion.div variants={itemVariants}>
            <Card className="h-full bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-background border-rose-100 dark:border-rose-900/40 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-full mr-3">
                    <LogOut className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("dashboard.checkouts", "Check-outs de Hoje")}</h3>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/40"
                  onClick={() => setLocation("/reservations")}
                >
                  {t("dashboard.viewCheckouts", "Ver Check-outs")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Limpezas agendadas */}
          <motion.div variants={itemVariants}>
            <Card className="h-full bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background border-emerald-100 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-full mr-3">
                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-lg">{t("dashboard.cleanings", "Limpezas Agendadas")}</h3>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                  onClick={() => setLocation("/cleaning-teams")}
                >
                  {t("dashboard.viewCleanings", "Ver Limpezas")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Lista detalhada de tarefas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-4"
        >
          <DailyTasksDashboard />
        </motion.div>
        
        {/* Visualização financeira simplificada */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">{t("dashboard.financialSummary", "Resumo Financeiro")}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                console.log("Redirecionando para:", t("routes.reports", "/relatorios"));
                setLocation(t("routes.reports", "/relatorios"));
              }}
              className="text-muted-foreground hover:text-primary bg-blue-100 dark:bg-blue-900/20"
            >
              {t("dashboard.viewDetails", "Ver Detalhes")}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Card className="bg-background/70 border-border/30">
            <CardContent className="p-4">
              <NewModernDashboard minimal={true} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Componente de citação inspiradora no final */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 mb-4"
        >
          <InspirationQuote 
            context="dashboard"
            variant="subtle"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
