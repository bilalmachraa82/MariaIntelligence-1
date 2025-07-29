import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import DailyTasksDashboard from "@/components/dashboard/daily-tasks-dashboard-responsive";
import NewModernDashboard from "@/components/dashboard/new-modern-dashboard";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Calendar, CheckCircle2, Home } from "lucide-react";

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
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
              <Home className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              {t("dashboard.fullDashboard", "Dashboard Completo")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.welcomeName", "Olá Carina")} - {t("dashboard.fullDashboardDescription", "Visualização detalhada de todas as atividades")}
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
        
        {/* Tabs para organização do conteúdo */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="daily" className="flex items-center justify-center">
              <Calendar className="h-4 w-4 mr-2" />
              {t("dashboard.dailyTasks", "Tarefas do Dia")}
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center justify-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t("dashboard.financialSummary", "Resumo Financeiro")}
            </TabsTrigger>
          </TabsList>
          
          {/* Conteúdo da tab de Tarefas Diárias */}
          <TabsContent value="daily" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                    {t("dashboard.dailyTasks", "Tarefas do Dia")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.todaysSchedule", "Agenda de Hoje")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <DailyTasksDashboard minimal={false} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Conteúdo da tab Financeira */}
          <TabsContent value="financial" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                    {t("dashboard.financialSummary", "Resumo Financeiro")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.financialView", "Visão Financeira")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NewModernDashboard minimal={false} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}