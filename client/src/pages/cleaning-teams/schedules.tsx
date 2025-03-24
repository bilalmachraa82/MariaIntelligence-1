import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

// Interface para dados de prestadores de serviço
interface CleaningServiceProvider {
  id: number;
  name: string;
  nif: string;
  email?: string;
  address?: string;
}

// Interface para dados de agendamento
interface ScheduleItem {
  id: number;
  providerId: number;
  providerName: string;
  propertyId: number;
  propertyName: string;
  date: Date;
  status: 'scheduled' | 'completed';
  type: 'check-in' | 'check-out';
  notes?: string;
}

// Dados reais dos prestadores de serviço
const serviceProviders: CleaningServiceProvider[] = [
  {
    id: 1,
    name: 'ANA CRISTINA PARADA DE ALMEIDA TEIXEIRA',
    nif: '208914560',
    address: 'R FILIPE FOLQUE Nº 12 - 5º ESQº 2810-215 ALMADA'
  },
  {
    id: 2,
    name: 'MELANIE NEVES CARVALHO PEREIRA',
    nif: '245862021',
    address: 'R MESTRE JOSÉ AGOSTINHO LOTE 16 2450-502 NAZARÉ'
  },
  {
    id: 3,
    name: 'VERA LUCIA BOTELHO RODRIGUES',
    nif: '214791904',
    address: '8100-118 QUERENÇA'
  }
];

// Dados de exemplo para demonstração
const demoSchedules: ScheduleItem[] = [
  {
    id: 1,
    providerId: 1,
    providerName: 'ANA CRISTINA PARADA DE ALMEIDA TEIXEIRA',
    propertyId: 7,
    propertyName: 'Alfama Charme',
    date: new Date(2025, 2, 25, 10, 0), // 25 de Março de 2025, 10:00
    status: 'scheduled',
    type: 'check-out',
    notes: 'Limpeza completa após saída de hóspedes'
  },
  {
    id: 2,
    providerId: 2,
    providerName: 'MELANIE NEVES CARVALHO PEREIRA',
    propertyId: 13,
    propertyName: 'Vila Verde',
    date: new Date(2025, 2, 26, 14, 0), // 26 de Março de 2025, 14:00
    status: 'scheduled',
    type: 'check-in',
    notes: 'Preparação para entrada de novos hóspedes'
  },
  {
    id: 3,
    providerId: 3,
    providerName: 'VERA LUCIA BOTELHO RODRIGUES',
    propertyId: 9,
    propertyName: 'Graça Elegante',
    date: new Date(2025, 2, 24, 12, 0), // 24 de Março de 2025, 12:00
    status: 'completed',
    type: 'check-in',
    notes: 'Limpeza completa para entrada de hóspedes'
  }
];

export default function CleaningSchedulesPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedView, setSelectedView] = useState('calendar'); // 'calendar' ou 'list'
  
  // Estado para filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Funções para filtragem dos agendamentos
  const getFilteredSchedules = () => {
    return demoSchedules.filter(schedule => {
      const teamMatch = !selectedTeam || selectedTeam === 'all' || schedule.providerId.toString() === selectedTeam;
      const statusMatch = !statusFilter || statusFilter === 'all' || schedule.status === statusFilter;
      const typeMatch = !typeFilter || typeFilter === 'all' || schedule.type === typeFilter;
      
      // Se a visualização for calendário, filtrar pela data selecionada
      const dateMatch = selectedView !== 'calendar' || 
        (selectedDate && format(schedule.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));
      
      return teamMatch && statusMatch && typeMatch && dateMatch;
    });
  };

  // Formatar data e hora
  const formatDateTime = (date: Date) => {
    return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
  };

  // Renderizar o badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendado</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelado</Badge>;
      default:
        return null;
    }
  };

  // Renderizar o badge de tipo
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'check-in':
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700">Check-in</Badge>;
      case 'check-out':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700">Check-out</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700">Manutenção</Badge>;
      default:
        return null;
    }
  };

  // Dados filtrados
  const filteredSchedules = getFilteredSchedules();

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/settings")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Voltar')}
        </Button>
        <h2 className="text-2xl font-bold text-secondary-900 ml-2">
          {t('cleaningTeams.schedules.title', 'Agendamentos de Limpeza')}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('cleaningTeams.schedules.filters', 'Filtros')}</CardTitle>
          <CardDescription>
            {t('cleaningTeams.schedules.filtersDescription', 'Filtre os agendamentos por equipa, status e tipo')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="team">{t('cleaningTeams.select', 'Selecionar Prestador')}</Label>
              <Select
                value={selectedTeam}
                onValueChange={setSelectedTeam}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t('cleaningTeams.selectTeam', 'Todos os prestadores')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os prestadores</SelectItem>
                  {serviceProviders.map(provider => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">{t('cleaningTeams.schedules.status', 'Status')}</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t('cleaningTeams.schedules.allStatuses', 'Todos os status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="scheduled">Agendados</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">{t('cleaningTeams.schedules.type', 'Tipo')}</Label>
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t('cleaningTeams.schedules.allTypes', 'Todos os tipos')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="check-in">Check-in</SelectItem>
                  <SelectItem value="check-out">Check-out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar" value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="calendar">{t('cleaningTeams.schedules.calendarView', 'Visualização de Calendário')}</TabsTrigger>
          <TabsTrigger value="list">{t('cleaningTeams.schedules.listView', 'Visualização em Lista')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('cleaningTeams.schedules.calendarTitle', 'Calendário de Agendamentos')}</CardTitle>
              <CardDescription>
                {t('cleaningTeams.schedules.calendarDescription', 'Selecione uma data para ver os agendamentos')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    {selectedDate 
                      ? `Agendamentos para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                      : 'Selecione uma data no calendário'
                    }
                  </h3>
                  
                  {filteredSchedules.length > 0 ? (
                    <div className="space-y-4">
                      {filteredSchedules.map(schedule => (
                        <Card key={schedule.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-base font-semibold">{schedule.propertyName}</h4>
                                <p className="text-sm text-muted-foreground">{schedule.providerName}</p>
                              </div>
                              <div className="flex space-x-2">
                                {renderStatusBadge(schedule.status)}
                                {renderTypeBadge(schedule.type)}
                              </div>
                            </div>
                            <p className="text-sm mb-2">
                              {formatDateTime(schedule.date)}
                            </p>
                            {schedule.notes && (
                              <p className="text-sm text-muted-foreground mt-2 italic">
                                {schedule.notes}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum agendamento encontrado para esta data.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('cleaningTeams.schedules.listTitle', 'Lista de Agendamentos')}</CardTitle>
              <CardDescription>
                {t('cleaningTeams.schedules.listDescription', 'Visualize todos os agendamentos futuros')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSchedules.length > 0 ? (
                <div className="space-y-4">
                  {filteredSchedules.map(schedule => (
                    <Card key={schedule.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-base font-semibold">{schedule.propertyName}</h4>
                            <p className="text-sm text-muted-foreground">{schedule.providerName}</p>
                          </div>
                          <div className="flex space-x-2">
                            {renderStatusBadge(schedule.status)}
                            {renderTypeBadge(schedule.type)}
                          </div>
                        </div>
                        <p className="text-sm mb-2">
                          {formatDateTime(schedule.date)}
                        </p>
                        {schedule.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {schedule.notes}
                          </p>
                        )}
                        <div className="flex justify-end mt-3 space-x-2">
                          <Button variant="outline" size="sm">Editar</Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Cancelar</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento encontrado com os filtros atuais.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}