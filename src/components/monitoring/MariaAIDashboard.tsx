/**
 * 📊 Maria AI Monitoring Dashboard
 * Real-time monitoring de todos os agents e KPIs do sistema
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  lastActivity: string;
  tasksCompleted: number;
  performance: number;
  capabilities: string[];
}

interface SystemKPIs {
  pdfProcessingTime: number; // seconds
  chatResponseTime: number; // seconds
  systemUptime: number; // percentage
  userSatisfaction: number; // score out of 5
  errorRate: number; // percentage
  activeUsers: number;
  totalReservations: number;
  aiValidationAccuracy: number; // percentage
}

export default function MariaAIDashboard() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [kpis, setKpis] = useState<SystemKPIs | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [agentsResponse, kpisResponse, alertsResponse] = await Promise.all([
        fetch('/api/maria-ai/agents/status'),
        fetch('/api/maria-ai/kpis'),
        fetch('/api/maria-ai/alerts')
      ]);

      const agentsData = await agentsResponse.json();
      const kpisData = await kpisResponse.json();
      const alertsData = await alertsResponse.json();

      setAgents(agentsData.agents || []);
      setKpis(kpisData.kpis || null);
      setAlerts(alertsData.alerts || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsLoading(false);
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getKPIStatus = (value: number, target: number, higherIsBetter: boolean = true) => {
    const percentage = higherIsBetter ? (value / target) * 100 : (target / value) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">🤖 Carregando Maria AI Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👑 Maria AI Dashboard</h1>
          <p className="text-gray-600">Monitorização em tempo real do swarm inteligente</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          17 Agents Ativos
        </Badge>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription>
            🚨 {alerts.length} alertas ativos: {alerts.map(a => a.message).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs Principais */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PDF Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getKPIStatus(kpis.pdfProcessingTime, 5, false)}`}>
                {kpis.pdfProcessingTime}s
              </div>
              <p className="text-xs text-gray-500">Target: &lt;5s</p>
              <Progress value={Math.min((5 / kpis.pdfProcessingTime) * 100, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Chat Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getKPIStatus(kpis.chatResponseTime, 2, false)}`}>
                {kpis.chatResponseTime}s
              </div>
              <p className="text-xs text-gray-500">Target: &lt;2s</p>
              <Progress value={Math.min((2 / kpis.chatResponseTime) * 100, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getKPIStatus(kpis.systemUptime, 99.9, true)}`}>
                {kpis.systemUptime}%
              </div>
              <p className="text-xs text-gray-500">Target: &gt;99.9%</p>
              <Progress value={kpis.systemUptime} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getKPIStatus(kpis.userSatisfaction, 4.5, true)}`}>
                {kpis.userSatisfaction}/5
              </div>
              <p className="text-xs text-gray-500">Target: &gt;4.5/5</p>
              <Progress value={(kpis.userSatisfaction / 5) * 100} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team 1 - Data Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Team 1 - Data Processing
            </CardTitle>
            <CardDescription>OCR, Validation, RAG, ML</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.filter(a => ['OCR-Agent', 'Validation-Agent', 'RAG-Agent', 'ML-Agent'].includes(a.name)).map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(agent.status)}`} />
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div>Tasks: {agent.tasksCompleted}</div>
                    <div className={`font-medium ${agent.performance >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {agent.performance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team 2 - Business Logic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💼 Team 2 - Business Logic
            </CardTitle>
            <CardDescription>Reservation, Financial, Property, Reporting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.filter(a => ['Reservation-Agent', 'Financial-Agent', 'Property-Agent', 'Reporting-Agent'].includes(a.name)).map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(agent.status)}`} />
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div>Tasks: {agent.tasksCompleted}</div>
                    <div className={`font-medium ${agent.performance >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {agent.performance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team 3 - Infrastructure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏗️ Team 3 - Infrastructure
            </CardTitle>
            <CardDescription>Hostinger, Database, Security, Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.filter(a => ['Hostinger-MCP-Agent', 'Database-Agent', 'Security-Agent', 'Performance-Agent'].includes(a.name)).map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(agent.status)}`} />
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div>Tasks: {agent.tasksCompleted}</div>
                    <div className={`font-medium ${agent.performance >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {agent.performance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team 4 - User Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎨 Team 4 - User Experience
            </CardTitle>
            <CardDescription>UI, Mobile, Chat, Notification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.filter(a => ['UI-Agent', 'Mobile-Agent', 'Chat-Agent', 'Notification-Agent'].includes(a.name)).map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(agent.status)}`} />
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div>Tasks: {agent.tasksCompleted}</div>
                    <div className={`font-medium ${agent.performance >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {agent.performance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maria AI Queen Status */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            👑 Maria AI - Central Coordinator
          </CardTitle>
          <CardDescription>Agent coordenador principal do swarm</CardDescription>
        </CardHeader>
        <CardContent>
          {agents.filter(a => a.name === 'Maria-AI-Queen').map(agent => (
            <div key={agent.id} className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{agent.tasksCompleted}</div>
                <div className="text-sm text-gray-600">Coordenações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{agent.performance}%</div>
                <div className="text-sm text-gray-600">Performance</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getAgentStatusColor(agent.status)} text-white rounded px-2`}>
                  {agent.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}