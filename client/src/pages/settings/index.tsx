import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, HelpCircle, BellRing, User, Globe, Key } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [mistralApiKey, setMistralApiKey] = useState("");

  const handleSaveGeneral = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas preferências gerais foram atualizadas.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notificações atualizadas",
      description: "Suas preferências de notificação foram atualizadas.",
    });
  };

  const handleSaveAPI = () => {
    if (mistralApiKey.trim()) {
      localStorage.setItem("MISTRAL_API_KEY", mistralApiKey);
      toast({
        title: "Chave API salva",
        description: "Sua chave da API Mistral foi salva com sucesso.",
      });
    } else {
      toast({
        title: "Erro ao salvar chave",
        description: "Por favor insira uma chave API válida.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold">Configurações</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open("https://mariatoolbox.com/docs", "_blank")}>
          <HelpCircle className="h-4 w-4 mr-1" />
          Ajuda
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-1" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellRing className="h-4 w-4 mr-1" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-1" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-1" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências Gerais</CardTitle>
              <CardDescription>
                Gerencie suas preferências gerais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <select
                  id="language"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <select
                  id="timezone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
                  <option value="America/New_York">América/Nova York (GMT-5)</option>
                  <option value="Europe/Lisbon">Europa/Lisboa (GMT+0)</option>
                  <option value="Europe/Madrid">Europa/Madrid (GMT+1)</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="dark-mode" />
                <Label htmlFor="dark-mode">Modo Escuro</Label>
              </div>
              
              <Button onClick={handleSaveGeneral}>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por E-mail</p>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações sobre reservas e eventos via e-mail
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications"
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>

                {emailNotifications && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-reservations" defaultChecked className="rounded" />
                      <Label htmlFor="email-reservations">Novas Reservas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-cancellations" defaultChecked className="rounded" />
                      <Label htmlFor="email-cancellations">Cancelamentos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-reports" defaultChecked className="rounded" />
                      <Label htmlFor="email-reports">Relatórios Semanais</Label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por SMS</p>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações importantes por SMS
                    </p>
                  </div>
                  <Switch 
                    id="sms-notifications"
                    checked={smsNotifications} 
                    onCheckedChange={setSmsNotifications} 
                  />
                </div>

                {smsNotifications && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sms-reservations" defaultChecked className="rounded" />
                      <Label htmlFor="sms-reservations">Novas Reservas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sms-cancellations" defaultChecked className="rounded" />
                      <Label htmlFor="sms-cancellations">Cancelamentos</Label>
                    </div>
                  </div>
                )}
              </div>
              
              <Button onClick={handleSaveNotifications}>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Nome Completo</Label>
                  <Input id="full-name" defaultValue="Maria Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue="maria@mariatoolbox.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" type="tel" defaultValue="+55 11 9xxxx-xxxx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input id="company" defaultValue="Maria Faz Gerenciamento" />
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">Alterar Senha</Button>
              </div>
              
              <Button className="w-full">Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de API</CardTitle>
              <CardDescription>
                Configure suas integrações com APIs externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mistral-api">Chave da API Mistral</Label>
                <Input 
                  id="mistral-api" 
                  type="password" 
                  placeholder="Insira sua chave da API Mistral"
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usada para processamento de OCR em documentos. <a href="https://mistral.ai/api/" className="text-primary underline" target="_blank" rel="noopener noreferrer">Obtenha uma chave aqui</a>.
                </p>
              </div>
              
              <Button onClick={handleSaveAPI}>Salvar Chave API</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}