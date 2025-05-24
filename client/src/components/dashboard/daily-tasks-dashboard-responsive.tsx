import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  LogOut, 
  Sparkles, 
  Calendar,
  Home,
  Bell,
  ArrowRight,
  ArrowUpRight
} from "lucide-react";

// Interfaces
interface ExtendedReservation {
  id: number;
  guestName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  propertyName?: string;
  propertyId?: number;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: Date | null;
  entityId: number | null;
  entityType: string | null;
}

interface DailyTasksDashboardProps {
  minimal?: boolean;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.1, duration: 0.5 }
  })
};

export default function DailyTasksDashboard({ minimal = false }: DailyTasksDashboardProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  // Fetch reservations for dashboard
  const { data: todayReservations = {}, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['/api/reservations/dashboard'],
  });

  // Fetch activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities'],
  });

  // Extract data safely
  const todayCheckIns = (todayReservations as any)?.checkIns || [];
  const todayCheckOuts = (todayReservations as any)?.checkOuts || [];

  // Calculate task statistics - only real data
  const taskStatistics = {
    checkIns: todayCheckIns.length,
    checkOuts: todayCheckOuts.length,
    cleaningTasks: todayCheckOuts.length, // Real cleanings needed after checkout
    activities: (activities && typeof activities === 'object' && 'activities' in activities) 
      ? (activities.activities?.length || 0) : 0
  };

  // Utility functions
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { time: "N/A", date: "N/A" };
    
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('pt-PT')
    };
  };

  const navigateToDetail = (type: string, id: number) => {
    if (type === "reservation") {
      setLocation(`/reservations/${id}`);
    } else if (type === "property") {
      setLocation(`/properties/${id}`);
    }
  };

  return (
    <div className={`mx-auto ${minimal ? 'p-0' : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-6'} space-y-4 sm:space-y-6 max-w-[1600px]`}>
      {/* Header */}
      {!minimal && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-background/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border/30 shadow-md sm:shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-primary">
                {t("dailyTasks.title", "Tarefas do Dia")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                {t("dailyTasks.todayDate", "Hoje")}: {new Date().toLocaleDateString()}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-2 sm:gap-3"
            >
              <Button 
                variant="outline" 
                onClick={() => setLocation("/assistant")}
                className="whitespace-nowrap text-xs sm:text-sm md:text-base h-8 sm:h-10"
                size="sm"
              >
                <Bell className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t("dailyTasks.assistant", "Assistente")}
              </Button>
              
              <Button 
                variant="default"
                className="whitespace-nowrap text-xs sm:text-sm md:text-base h-8 sm:h-10"
                size="sm"
                onClick={() => setLocation("/relatorios")}
              >
                <ArrowRight className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t("dailyTasks.viewReports", "Ver Relatórios")}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Task Statistics */}
      {!minimal && (
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={1}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          <Card className="bg-background/70 backdrop-blur-sm shadow-sm border-primary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("dailyTasks.todayCheckins", "Check-ins Hoje")}</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-primary mt-1">{taskStatistics.checkIns}</h3>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-full">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/70 backdrop-blur-sm shadow-sm border-primary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("dailyTasks.todayCheckouts", "Check-outs Hoje")}</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-primary mt-1">{taskStatistics.checkOuts}</h3>
                </div>
                <div className="bg-rose-100 dark:bg-rose-900/30 p-2 sm:p-3 rounded-full">
                  <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/70 backdrop-blur-sm shadow-sm border-primary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("dailyTasks.pendingCleanings", "Limpezas")}</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-primary mt-1">{taskStatistics.cleaningTasks}</h3>
                </div>
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 sm:p-3 rounded-full">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/70 backdrop-blur-sm shadow-sm border-primary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("dailyTasks.activities", "Atividades")}</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-primary mt-1">{taskStatistics.activities}</h3>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-full">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content Grid - Only when not minimal */}
      {!minimal && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Check-ins Column */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <Card className="overflow-hidden bg-white shadow-sm border-0">
              <CardHeader className="pb-2 px-4 pt-4 bg-gradient-to-br from-blue-50 to-white border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-1.5 rounded-md">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-base font-semibold text-secondary-900">
                      {t("dailyTasks.checkins", "Check-ins")}
                    </CardTitle>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                    {todayCheckIns.length}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-secondary-500 mt-1">
                  {t("dailyTasks.checkinsDescription", "Chegadas de hóspedes para hoje e amanhã")}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] px-4 pt-2 pb-2">
                  {isLoadingReservations ? (
                    <div className="space-y-4 py-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : todayCheckIns.length > 0 ? (
                    <div className="space-y-3 py-2">
                      {todayCheckIns.map((checkin: ExtendedReservation) => {
                        const { time, date } = formatDateTime(checkin.checkInDate);
                        const isToday = date === new Date().toLocaleDateString();
                        
                        return (
                          <div 
                            key={`checkin-${checkin.id}`}
                            className="rounded-lg bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden"
                          >
                            {isToday ? (
                              <div className="bg-blue-100 px-3 py-1 flex items-center">
                                <User className="h-3 w-3 text-blue-600 mr-2" />
                                <span className="text-xs font-medium text-blue-800">{t("dailyTasks.today", "Hoje")} • {time}</span>
                              </div>
                            ) : (
                              <div className="bg-purple-100 px-3 py-1 flex items-center">
                                <User className="h-3 w-3 text-purple-600 mr-2" />
                                <span className="text-xs font-medium text-purple-800">{t("dailyTasks.tomorrow", "Amanhã")} • {time}</span>
                              </div>
                            )}
                            
                            <div className="p-3">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-blue-700 mr-2">
                                      {checkin.guestName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'G'}
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm">
                                        {checkin.guestName}
                                      </h4>
                                      <p className="text-xs text-secondary-500 mt-0.5 flex items-center">
                                        <Home className="h-3 w-3 mr-1" />
                                        {checkin.propertyName}
                                      </p>
                                    </div>
                                  </div>
                                    
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs mt-2 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => navigateToDetail("reservation", checkin.id)}
                                  >
                                    {t("dailyTasks.viewDetails", "Ver Detalhes")}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-secondary-500 text-sm">
                        {t("dailyTasks.noCheckins", "Não há check-ins agendados para hoje")}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t justify-center py-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-xs h-7 text-blue-700"
                  onClick={() => setLocation("/reservations")}
                >
                  {t("dailyTasks.viewAllReservations", "Ver Todas as Reservas")}
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Check-outs & Cleaning Column */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <Card className="overflow-hidden bg-white shadow-sm border-0">
              <CardHeader className="pb-2 px-4 pt-4 bg-gradient-to-br from-red-50 to-white border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-red-100 p-1.5 rounded-md">
                      <LogOut className="h-4 w-4 text-red-600" />
                    </div>
                    <CardTitle className="text-base font-semibold text-secondary-900">
                      {t("dailyTasks.checkouts", "Check-outs")}
                    </CardTitle>
                  </div>
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">
                    {todayCheckOuts.length}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-secondary-500 mt-1">
                  {t("dailyTasks.checkoutsDescription", "Saídas de hóspedes para hoje")}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] px-4 pt-2 pb-2">
                  {isLoadingReservations ? (
                    <div className="space-y-4 py-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : todayCheckOuts.length > 0 ? (
                    <div className="space-y-3 py-2">
                      {todayCheckOuts.map((checkout: ExtendedReservation) => {
                        const { time } = formatDateTime(checkout.checkOutDate);
                        
                        return (
                          <div 
                            key={`checkout-${checkout.id}`}
                            className="rounded-lg bg-white border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all overflow-hidden"
                          >
                            <div className="bg-red-100 px-3 py-1 flex items-center justify-between">
                              <div className="flex items-center">
                                <LogOut className="h-3 w-3 text-red-600 mr-2" />
                                <span className="text-xs font-medium text-red-800">Check-out • {time}</span>
                              </div>
                              <div className="flex gap-1 items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
                                <Sparkles className="h-3 w-3" />
                                <span className="font-medium">Limpeza Pendente</span>
                              </div>
                            </div>
                            
                            <div className="p-3">
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-red-700 mr-2">
                                      {checkout.guestName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'G'}
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm">
                                        {checkout.guestName}
                                      </h4>
                                      <p className="text-xs text-secondary-500 mt-0.5 flex items-center">
                                        <Home className="h-3 w-3 mr-1" />
                                        {checkout.propertyName}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs border-red-200 text-red-700 hover:bg-red-50"
                                      onClick={() => navigateToDetail("reservation", checkout.id)}
                                    >
                                      {t("dailyTasks.viewDetails", "Ver Detalhes")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {t("dailyTasks.scheduleClean", "Agendar Limpeza")}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-secondary-500 text-sm">
                        {t("dailyTasks.noCheckouts", "Não há check-outs agendados para hoje")}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t justify-center py-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-xs h-7 text-red-700"
                  onClick={() => setLocation("/cleaning-teams")}
                >
                  {t("dailyTasks.viewAllCleanings", "Ver Todas as Limpezas")}
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Atividades Recentes Column */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <Card className="overflow-hidden bg-white shadow-sm border-0">
              <CardHeader className="pb-2 px-4 pt-4 bg-gradient-to-br from-purple-50 to-white border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-1.5 rounded-md">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <CardTitle className="text-base font-semibold text-secondary-900">
                      {t("dailyTasks.recentActivities", "Atividades Recentes")}
                    </CardTitle>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                    {(activities && typeof activities === 'object' && 'activities' in activities) 
                      ? (activities.activities?.length || 0) : 0}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-secondary-500 mt-1">
                  {t("dailyTasks.activitiesDescription", "Últimas atividades do sistema")}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] px-4 pt-2 pb-2">
                  {isLoadingActivities ? (
                    <div className="space-y-4 py-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (activities && typeof activities === 'object' && 'activities' in activities && activities.activities && activities.activities.length > 0) ? (
                    <div className="space-y-3 py-2">
                      {(activities as any).activities.slice(0, 5).map((activity: Activity) => (
                        <div 
                          key={activity.id}
                          className="rounded-lg bg-white border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all overflow-hidden"
                        >
                          <div className="bg-purple-100 px-3 py-1 flex items-center justify-between">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 text-purple-600 mr-2" />
                              <span className="text-xs font-medium text-purple-800">
                                {new Date(activity.createdAt || '').toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-3">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm">
                                      {activity.type === 'reservation_created' ? 'Nova Reserva' :
                                       activity.type === 'property_created' ? 'Nova Propriedade' :
                                       activity.type === 'assistant_interaction' ? 'Interação com IA' :
                                       activity.description}
                                    </h4>
                                    <p className="text-xs text-secondary-500 mt-0.5">
                                      {activity.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-secondary-500 text-sm">
                        {t("dailyTasks.noActivities", "Não há atividades recentes")}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="border-t justify-center py-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 text-xs h-7 text-purple-700"
                  onClick={() => setLocation("/activities")}
                >
                  {t("dailyTasks.viewAllActivities", "Ver Todas as Atividades")}
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Mobile Summary - Minimal version */}
      {minimal && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-secondary-900">
              {t("dailyTasks.todaysSummary", "Resumo de Hoje")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="text-xs"
            >
              {t("dailyTasks.fullDashboard", "Dashboard Completo")}
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{taskStatistics.checkIns}</div>
              <div className="text-xs text-secondary-500">{t("dailyTasks.checkins", "Check-ins")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{taskStatistics.checkOuts}</div>
              <div className="text-xs text-secondary-500">{t("dailyTasks.checkouts", "Check-outs")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{taskStatistics.cleaningTasks}</div>
              <div className="text-xs text-secondary-500">{t("dailyTasks.cleanings", "Limpezas")}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}