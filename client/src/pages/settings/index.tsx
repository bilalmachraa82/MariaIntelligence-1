import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { ArrowLeft, Settings, Globe, Bot, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  // Verificar estado da conexão com IA
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    toast({
      title: "Idioma alterado",
      description: `Idioma alterado para ${language === 'pt-PT' ? 'Português' : 'English'}`,
    });
  };

  const testAIConnection = async () => {
    setIsCheckingAI(true);
    try {
      const response = await fetch('/api/check-gemini-key');
      const data = await response.json();
      setAiConnected(data.available);
      
      toast({
        title: data.available ? "IA Conectada" : "IA Desconectada",
        description: data.available ? 
          "Assistente IA está funcionando perfeitamente" : 
          "Configure a chave API do Gemini nas configurações da IA",
        variant: data.available ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível verificar o estado da IA",
        variant: "destructive"
      });
    } finally {
      setIsCheckingAI(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back", "Voltar")}
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            {t("settings.title", "Configurações")}
          </h1>
          <p className="text-muted-foreground text-sm">
            Personalize a sua experiência com a Maria Faz
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("settings.tabs.general", "Geral")}
          </TabsTrigger>
          <TabsTrigger value="language" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Idioma
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            {t("settings.tabs.ai", "Assistente IA")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t("settings.general.title", "Configurações Gerais")}
              </CardTitle>
              <CardDescription>
                {t("settings.general.description", "Personalize as configurações básicas da aplicação")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("settings.general.timezone", "Fuso Horário")}
                </label>
                <Select defaultValue="Europe/Lisbon">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar fuso horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Lisbon">Europa/Lisboa (GMT+0)</SelectItem>
                    <SelectItem value="Europe/London">Europa/Londres (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">América/Nova York (GMT-5)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Ásia/Tóquio (GMT+9)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("settings.general.timezoneDescription", "Selecione o seu fuso horário para exibir datas e horários corretos")}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("settings.language.title", "Idioma")}
              </CardTitle>
              <CardDescription>
                Selecione o idioma da interface da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("settings.language.selectLanguage", "Selecionar Idioma")}
                </label>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-PT">🇵🇹 Português (Portugal)</SelectItem>
                    <SelectItem value="en-US">🇺🇸 English (United States)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O idioma será aplicado imediatamente em toda a aplicação
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {t("settings.integrations.title", "Assistente IA")}
              </CardTitle>
              <CardDescription>
                {t("settings.integrations.description", "Configure o assistente IA Gemini para análise de documentos e ajuda")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Google Gemini 2.5 Flash Preview</span>
                    <Badge variant={aiConnected ? "default" : "secondary"}>
                      {aiConnected ? 
                        t("settings.integrations.connected", "Conectado") : 
                        t("settings.integrations.disconnected", "Desconectado")
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Análise inteligente de documentos e assistente virtual
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={testAIConnection}
                  disabled={isCheckingAI}
                >
                  {isCheckingAI ? "A verificar..." : t("settings.integrations.testConnection", "Testar Conexão")}
                </Button>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Como configurar o Assistente IA:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Aceda ao <strong>Assistente Maria</strong> no menu principal</li>
                  <li>Clique em <strong>"Configurar Chave da API Gemini"</strong></li>
                  <li>Obtenha a sua chave em <strong>https://ai.google.dev/</strong></li>
                  <li>Cole a chave e teste a conexão</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}