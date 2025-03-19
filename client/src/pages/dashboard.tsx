import { useState } from "react";
import { useTranslation } from "react-i18next";
import NewModernDashboard from "@/components/dashboard/new-modern-dashboard";
import DailyTasksDashboard from "@/components/dashboard/daily-tasks-dashboard";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InspirationQuote } from "@/components/ui/inspiration-quote";

export default function DashboardPage() {
  const { t } = useTranslation();
  // Definimos o modo padrão como "daily" para mostrar as tarefas diárias primeiro
  const [mode, setMode] = useState<"daily" | "finance">("daily");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4">
        {/* Componente de citação inspiradora */}
        <div className="mb-6">
          <InspirationQuote 
            context={mode === "daily" ? "dashboard" : "finance"}
            variant="subtle"
          />
        </div>
        
        <Tabs 
          defaultValue="daily" 
          className="w-full"
          onValueChange={(value) => setMode(value as "daily" | "finance")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="daily" className="text-base py-3">
              {t("dashboard.dailyTasks", "Tarefas do Dia")}
            </TabsTrigger>
            <TabsTrigger value="finance" className="text-base py-3">
              {t("dashboard.financialView", "Visão Financeira")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="m-0">
            <DailyTasksDashboard />
          </TabsContent>
          
          <TabsContent value="finance" className="m-0">
            <NewModernDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
