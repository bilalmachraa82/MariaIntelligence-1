import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Property, type Reservation, type Activity } from "@shared/schema";
import { motion } from "framer-motion";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import {
  Calendar,
  Clock,
  ArrowRight,
  User,
  Home,
  FileText,
  Bell,
  CheckCircle,
  CalendarDays,
  Users,
  ClipboardList,
  ArrowUpRight,
  LogOut,
  Sparkles,
  AlertTriangle,
  Phone,
  Wrench,
  CheckSquare,
  Loader2,
} from "lucide-react";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1 + 0.2,
      duration: 0.5,
    },
  }),
};

// Daily tasks interface
interface DailyTask {
  id: string;
  title: string;
  description: string;
  time?: string;
  propertyName?: string;
  propertyId?: number;
  guestName?: string;
  status: "pending" | "completed" | "in-progress" | "upcoming" | "attention";
  type: "check-in" | "check-out" | "cleaning" | "maintenance" | "task";
  icon: React.ReactNode;
  priority: "high" | "medium" | "low";
}

interface DailyTasksDashboardProps {
  minimal?: boolean;
}

export default function DailyTasksDashboard({ minimal = false }: DailyTasksDashboardProps) {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  
  // Obtendo as reservas do dashboard através de API específica
  const { data: dashboardData, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['/api/reservations/dashboard'],
    retry: 2
  });
  
  // Obtendo tarefas e atividades
  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities'],
    retry: 1
  });
  
  // Formatação de data e hora para exibição
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  // Função para navegar para página de detalhes
  const navigateToDetail = (type: string, id: number | string) => {
    if (type === "reservation") {
      setLocation(`/reservations/${id}`);
    } else if (type === "property") {
      setLocation(`/properties/${id}`);
    }
  };
  
  // Extraindo dados do resultado da query
  const todayCheckIns = useMemo(() => {
    if (!dashboardData || !dashboardData.checkIns) return [];
    return dashboardData.checkIns;
  }, [dashboardData]);
  
  const todayCheckOuts = useMemo(() => {
    if (!dashboardData || !dashboardData.checkOuts) return [];
    return dashboardData.checkOuts;
  }, [dashboardData]);
  
  const cleaningTasks = useMemo(() => {
    if (!dashboardData || !dashboardData.cleaningTasks) return [];
    return dashboardData.cleaningTasks;
  }, [dashboardData]);
  
  const maintenanceTasks = useMemo(() => {
    if (!activitiesData?.maintenance) return [];
    return activitiesData.maintenance;
  }, [activitiesData]);
  
  const otherTasks = useMemo(() => {
    if (!activitiesData?.tasks) return [];
    return activitiesData.tasks;
  }, [activitiesData]);
  
  // Contagem de estatísticas para exibição nos cards
  const taskStatistics = useMemo(() => {
    return {
      checkIns: todayCheckIns.length,
      checkOuts: todayCheckOuts.length,
      cleaningTasks: cleaningTasks.length,
      maintenanceTasks: maintenanceTasks.length + otherTasks.length
    };
  }, [todayCheckIns, todayCheckOuts, cleaningTasks, maintenanceTasks, otherTasks]);
  
  // Função para obter o badge de status de acordo com o estado da tarefa
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            {t("dailyTasks.completedStatus", "Concluído")}
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            {t("dailyTasks.inProgressStatus", "Em Andamento")}
          </Badge>
        );
      case 'attention':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            {t("dailyTasks.attentionStatus", "Urgente")}
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
            {t("dailyTasks.upcomingStatus", "Agendado")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
            {t("dailyTasks.pendingStatus", "Pendente")}
          </Badge>
        );
    }
  };

  return (
    <div className={`mx-auto ${minimal ? 'p-0' : 'px-3 sm:px-6 lg:px-8 py-4 sm:py-6'} space-y-4 sm:space-y-6 max-w-[1600px]`}>
      {/* Header - Otimizado para mobile */}
      {!minimal ? (
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
              onClick={() => setLocation(t("routes.reports", "/relatorios"))}
            >
              <ArrowRight className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t("dailyTasks.viewAll", "Ver Estatísticas")}
            </Button>
          </motion.div>
        </div>
      </motion.div>
      ) : null}

      {/* Task Statistics - Otimizado para mobile */}
      {!minimal ? (
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{t("dailyTasks.maintenanceIssues", "Manutenções")}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary mt-1">{taskStatistics.maintenanceTasks}</h3>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 sm:p-3 rounded-full">
                <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      ) : null}

      {/* Main Content - Otimizado para mobile */}
      {!minimal ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Check-ins Column */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <Card className="h-full bg-background/70 backdrop-blur-sm border-blue-200/30">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <CardTitle className="text-base sm:text-lg">{t("dailyTasks.checkins", "Check-ins")}</CardTitle>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                  {todayCheckIns.length}
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">{t("dailyTasks.checkinsDescription", "Chegadas de hóspedes para hoje e amanhã")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-32rem)] sm:h-[calc(100vh-30rem)] px-3 sm:px-4 pt-1 pb-2">
                {isLoadingReservations ? (
                  <div className="space-y-4 py-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : todayCheckIns.length > 0 ? (
                  <div className="space-y-3 py-1">
                    {todayCheckIns.map((checkin, index) => {
                      const { time, date } = formatDateTime(checkin.checkInDate);
                      const isToday = date === new Date().toLocaleDateString();
                      
                      return (
                        <div 
                          key={`checkin-${checkin.id}`}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative group"
                        >
                          <div className={`absolute left-0 top-0 w-1 h-full rounded-l-lg ${isToday ? 'bg-blue-500' : 'bg-purple-400'}`}></div>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 mt-0.5 border">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {checkin.guestName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'G'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm truncate">{checkin.guestName}</h4>
                                {isToday ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs whitespace-nowrap">
                                    {t("dailyTasks.today", "Hoje")} • {time}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs whitespace-nowrap">
                                    {t("dailyTasks.tomorrow", "Amanhã")} • {time}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                <span className="inline-flex items-center">
                                  <Home className="h-3 w-3 mr-1 text-muted-foreground" />
                                  {checkin.propertyName}
                                </span>
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs w-full"
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
                    <p className="text-muted-foreground text-sm">
                      {t("dailyTasks.noCheckins", "Não há check-ins agendados para hoje")}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 justify-center py-2 sm:py-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-xs h-7 sm:h-8"
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
          <Card className="h-full bg-background/70 backdrop-blur-sm border-rose-200/30">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                  <CardTitle className="text-base sm:text-lg">{t("dailyTasks.checkouts", "Check-outs")}</CardTitle>
                </div>
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs sm:text-sm">
                  {todayCheckOuts.length}
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">{t("dailyTasks.checkoutsDescription", "Saídas de hóspedes para hoje")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-32rem)] sm:h-[calc(100vh-30rem)] px-3 sm:px-4 pt-1 pb-2">
                {isLoadingReservations ? (
                  <div className="space-y-4 py-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : todayCheckOuts.length > 0 ? (
                  <div className="space-y-3 py-1">
                    {todayCheckOuts.map((checkout) => {
                      const { time } = formatDateTime(checkout.checkOutDate);
                      
                      return (
                        <div 
                          key={`checkout-${checkout.id}`}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative group"
                        >
                          <div className="absolute left-0 top-0 w-1 h-full rounded-l-lg bg-rose-500"></div>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 mt-0.5 border">
                              <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                                {checkout.guestName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'G'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm truncate">{checkout.guestName}</h4>
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs whitespace-nowrap">
                                  {time}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                <span className="inline-flex items-center">
                                  <Home className="h-3 w-3 mr-1 text-muted-foreground" />
                                  {checkout.propertyName}
                                </span>
                              </p>
                              
                              {/* Cleaning section */}
                              <div className="mt-3 pt-2 border-t border-dashed border-muted">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium flex items-center">
                                    <Sparkles className="h-3 w-3 mr-1 text-emerald-500" />
                                    {t("dailyTasks.cleaning", "Limpeza")}
                                  </span>
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                    {t("dailyTasks.pendingStatus", "Pendente")}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => navigateToDetail("reservation", checkout.id)}
                                >
                                  {t("dailyTasks.viewDetails", "Ver Detalhes")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 px-2 text-xs bg-emerald-500 hover:bg-emerald-600"
                                >
                                  {t("dailyTasks.scheduleClean", "Agendar Limpeza")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Cleaning tasks for properties without checkouts */}
                    {cleaningTasks.length > todayCheckOuts.length && (
                      <>
                        <Separator className="my-3" />
                        <h3 className="text-sm font-medium px-1 flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          {t("dailyTasks.additionalCleanings", "Limpezas Adicionais")}
                        </h3>
                        
                        {cleaningTasks
                          .filter((task, index) => index >= todayCheckOuts.length)
                          .map((task) => (
                            <div 
                              key={task.id}
                              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative"
                            >
                              <div className="absolute left-0 top-0 w-1 h-full rounded-l-lg bg-emerald-500"></div>
                              <div className="flex items-center gap-2">
                                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
                                  <Sparkles className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{task.title}</h4>
                                  <p className="text-xs text-muted-foreground">{task.propertyName}</p>
                                </div>
                                {getStatusBadge(task.status)}
                              </div>
                            </div>
                          ))
                        }
                      </>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      {t("dailyTasks.noCheckouts", "Não há check-outs agendados para hoje")}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 justify-center py-2 sm:py-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-xs h-7 sm:h-8"
                onClick={() => setLocation("/cleaning-teams")}
              >
                {t("dailyTasks.viewAllCleanings", "Ver Todas as Limpezas")}
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Maintenance & Other Tasks Column */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Card className="h-full bg-background/70 backdrop-blur-sm border-amber-200/30">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  <CardTitle className="text-base sm:text-lg">{t("dailyTasks.maintenance", "Manutenção & Tarefas")}</CardTitle>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs sm:text-sm">
                  {maintenanceTasks.length + otherTasks.length}
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">{t("dailyTasks.maintenanceDescription", "Reparos e tarefas pendentes")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-32rem)] sm:h-[calc(100vh-30rem)] px-3 sm:px-4 pt-1 pb-2">
                {isLoadingActivities ? (
                  <div className="space-y-4 py-2">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3 py-1">
                    {/* Maintenance Tasks */}
                    {maintenanceTasks.length > 0 && (
                      <>
                        <h3 className="text-xs sm:text-sm font-medium px-1 mt-1 mb-2 flex items-center gap-2">
                          <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                          {t("dailyTasks.maintenanceIssues", "Problemas de Manutenção")}
                        </h3>
                        
                        {maintenanceTasks.map((task) => (
                          <div 
                            key={task.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative"
                          >
                            <div className={`absolute left-0 top-0 w-1 h-full rounded-l-lg ${task.status === 'attention' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${task.status === 'attention' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                {task.status === 'attention' ? (
                                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                ) : (
                                  <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-sm">{task.title}</h4>
                                  {getStatusBadge(task.status)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                  <Home className="h-3 w-3 mr-1" />
                                  {task.propertyName}
                                </p>
                                
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => navigateToDetail("property", task.propertyId!)}
                                  >
                                    {t("dailyTasks.viewProperty", "Ver Imóvel")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 px-2 text-xs"
                                  >
                                    {t("dailyTasks.markResolved", "Marcar Resolvido")}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* Other Tasks */}
                    {otherTasks.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <h3 className="text-xs sm:text-sm font-medium px-1 mt-1 mb-2 flex items-center gap-2">
                          <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                          {t("dailyTasks.otherTasks", "Outras Tarefas")}
                        </h3>
                        
                        {otherTasks.map((task) => (
                          <div 
                            key={task.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative"
                          >
                            <div className="absolute left-0 top-0 w-1 h-full rounded-l-lg bg-purple-500"></div>
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                {task.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-sm">{task.title}</h4>
                                  {getStatusBadge(task.status)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {maintenanceTasks.length === 0 && otherTasks.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground text-sm">
                          {t("dailyTasks.noMaintenanceTasks", "Não há tarefas de manutenção pendentes")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 justify-center py-2 sm:py-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-xs h-7 sm:h-8"
                onClick={() => setLocation("/maintenance/pending")}
              >
                {t("dailyTasks.viewAllTasks", "Ver Todas as Tarefas")}
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      ) : (
        <div className="p-4 flex justify-center items-center">
          {minimal && (
            <Button 
              variant="outline" 
              onClick={() => setLocation("/dashboard-full")}
              className="whitespace-nowrap text-xs sm:text-sm md:text-base font-medium h-8 sm:h-10"
              size="sm"
            >
              <ArrowRight className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {t("dailyTasks.viewAll", "Ver Dashboard Completo")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}