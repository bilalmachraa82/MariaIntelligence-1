import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Activity, ArrowRight, Users, FileText, BarChart3, Euro, TrendingUp, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DashboardStats {
  totalRevenue: number;
  totalReservations: number;
  totalProperties: number;
  totalOwners: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function CleanDashboard() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();

  // Buscar estatísticas reais
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/statistics'],
  });

  // Buscar atividades recentes reais
  const { data: activities, isLoading: activitiesLoading } = useQuery<{activities: RecentActivity[]}>({
    queryKey: ['/api/activities', { limit: 5 }],
  });

  // Buscar reservas de hoje (check-ins e check-outs)
  const { data: todayReservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations/dashboard'],
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pb-16 md:pb-0"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Cabeçalho */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center">
              <Home className="mr-3 h-8 w-8 text-primary" />
              Maria Faz
            </h1>
            <p className="text-muted-foreground mt-2">
              Olá Carina! {new Date().toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Estatísticas Principais */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Resumo Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="h-8 w-16 bg-muted rounded mx-auto mb-2 animate-pulse" />
                        <div className="h-4 w-20 bg-muted rounded mx-auto animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
                        <Euro className="h-5 w-5 mr-1" />
                        {stats?.totalRevenue?.toFixed(2) || '0.00'}
                      </div>
                      <p className="text-sm text-muted-foreground">Receita Total</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {stats?.totalReservations || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Reservas</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {stats?.totalProperties || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Propriedades</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {stats?.totalOwners || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Proprietários</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Reservas de Hoje */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Agenda de Hoje
                </CardTitle>
                <CardDescription>Check-ins e check-outs programados</CardDescription>
              </CardHeader>
              <CardContent>
                {reservationsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayReservations?.checkIns?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Check-ins</h4>
                        {todayReservations.checkIns.map((reservation: any) => (
                          <div key={reservation.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div>
                              <p className="font-medium">{reservation.guestName}</p>
                              <p className="text-sm text-muted-foreground">{reservation.propertyName}</p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              €{reservation.totalAmount}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {todayReservations?.checkOuts?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2">Check-outs</h4>
                        {todayReservations.checkOuts.map((reservation: any) => (
                          <div key={reservation.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div>
                              <p className="font-medium">{reservation.guestName}</p>
                              <p className="text-sm text-muted-foreground">{reservation.propertyName}</p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              €{reservation.totalAmount}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!todayReservations?.checkIns?.length && !todayReservations?.checkOuts?.length) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma atividade programada para hoje</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Atividades Recentes */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : activities?.activities?.length > 0 ? (
                  <div className="space-y-3">
                    {activities.activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString('pt-PT')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma atividade recente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Ações Rápidas */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation("/reservations")}
                  >
                    <Calendar className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Reservas</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation("/properties")}
                  >
                    <Home className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Propriedades</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation("/owners")}
                  >
                    <Users className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Proprietários</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation("/reports/owner-report")}
                  >
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Relatórios</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation("/ocr")}
                  >
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Scanner</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => setLocation("/assistant")}
                  >
                    <Activity className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Assistente</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}