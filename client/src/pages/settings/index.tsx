import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, HelpCircle, BellRing, User, Globe, Key, AlertCircle, CheckCircle, Activity } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const [_, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [mistralApiKey, setMistralApiKey] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || "pt-PT");
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estado para testes de integração
  const [isTestingIntegrations, setIsTestingIntegrations] = useState(false);
  const [testResults, setTestResults] = useState<{
    mistral: boolean | null;
    database: boolean | null;
    ocr: boolean | null;
    rag: boolean | null;
    message: string;
  }>({
    mistral: null,
    database: null,
    ocr: null,
    rag: null,
    message: "",
  });

  useEffect(() => {
    // Tenta inicialmente recuperar a chave API do local storage
    const storedKey = localStorage.getItem("MISTRAL_API_KEY");
    if (storedKey) {
      setMistralApiKey(storedKey);
    }
    
    // Verifica se o modo escuro está ativado
    const darkModePreference = localStorage.getItem("darkMode");
    const isDark = darkModePreference === "true";
    setIsDarkMode(isDark);
    
    // Aplica o modo escuro se estiver ativado
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    
    // Atualiza o localStorage
    localStorage.setItem("darkMode", checked.toString());
    
    // Atualiza a classe no elemento html
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Atualiza o arquivo theme.json (simulado via localStorage)
    localStorage.setItem("theme", JSON.stringify({
      appearance: checked ? "dark" : "light",
      primary: "#E5A4A4",
      variant: "professional",
      radius: 0.8
    }));
  };

  const handleSaveGeneral = () => {
    toast({
      title: t("settings.general.saveSuccess"),
      description: t("settings.general.saveSuccessDesc"),
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: t("settings.notifications.saveSuccess"),
      description: t("settings.notifications.saveSuccessDesc"),
    });
  };

  const handleSaveAPI = () => {
    if (mistralApiKey.trim()) {
      localStorage.setItem("MISTRAL_API_KEY", mistralApiKey);
      toast({
        title: t("settings.integrations.mistralAI.saveSuccess"),
        description: t("settings.integrations.mistralAI.saveSuccessDesc"),
      });
    } else {
      toast({
        title: t("settings.integrations.mistralAI.saveError"),
        description: t("settings.integrations.mistralAI.saveErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    
    // Salva a preferência de idioma no localStorage
    localStorage.setItem("i18nextLng", lang);
    
    toast({
      title: t("settings.language.changeSuccess"),
      description: t("settings.language.changeSuccessDesc"),
    });
  };
  
  // Função para testar as integrações
  const handleTestIntegrations = async () => {
    setIsTestingIntegrations(true);
    setTestResults({
      mistral: null,
      database: null,
      ocr: null,
      rag: null,
      message: "",
    });
    
    try {
      const response = await apiRequest<{
        success: boolean;
        timestamp: string;
        tests: Array<{
          name: string;
          success: boolean;
          details?: any;
          error?: string;
        }>;
      }>({
        url: "/api/test-integrations",
        method: "GET",
      });
      
      // Extrai os resultados de cada teste pelo nome
      const mistralTest = response.tests.find(test => test.name === "Mistral AI");
      const dbTest = response.tests.find(test => test.name === "Base de Dados");
      const ocrTest = response.tests.find(test => test.name === "OCR (Processamento de PDFs)");
      const ragTest = response.tests.find(test => test.name === "RAG (Retrieval Augmented Generation)");
      
      // Processa qualquer mensagem de erro
      const errorMessages = response.tests
        .filter(test => !test.success && test.error)
        .map(test => `${test.name}: ${test.error}`)
        .join("\n");
      
      setTestResults({
        mistral: mistralTest?.success || false,
        database: dbTest?.success || false,
        ocr: ocrTest?.success || false,
        rag: ragTest?.success || false,
        message: errorMessages,
      });
      
      if (response.success) {
        toast({
          title: "Teste de integrações bem-sucedido",
          description: "Todas as integrações estão funcionando corretamente.",
          variant: "default",
        });
      } else {
        toast({
          title: "Problemas na integração",
          description: "Algumas integrações não estão funcionando. Verifique os detalhes abaixo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResults({
        mistral: false,
        database: false,
        ocr: false,
        rag: false,
        message: "Erro ao testar integrações. Verifique se o servidor está rodando.",
      });
      
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar as integrações. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsTestingIntegrations(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("common.back")}
          </Button>
          <h2 className="text-2xl font-bold">{t("settings.title")}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.open("https://mariatoolbox.com/docs", "_blank")}>
          <HelpCircle className="h-4 w-4 mr-1" />
          {t("common.help")}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-1" />
            {t("settings.tabs.general")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellRing className="h-4 w-4 mr-1" />
            {t("settings.tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-1" />
            {t("settings.tabs.account")}
          </TabsTrigger>
          <TabsTrigger value="language">
            <Globe className="h-4 w-4 mr-1" />
            {t("settings.tabs.language")}
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-1" />
            {t("settings.tabs.integrations")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.general.title")}</CardTitle>
              <CardDescription>
                {t("settings.general.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">              
              <div className="space-y-2">
                <Label htmlFor="timezone">{t("settings.general.timezone")}</Label>
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
                <Label htmlFor="dark-mode">{t("settings.general.darkMode")}</Label>
              </div>
              
              <Button onClick={handleSaveGeneral}>{t("common.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications.title")}</CardTitle>
              <CardDescription>
                {t("settings.notifications.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings.notifications.email")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.emailDescription")}
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
                      <Label htmlFor="email-reservations">{t("settings.notifications.newReservation")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-cancellations" defaultChecked className="rounded" />
                      <Label htmlFor="email-cancellations">{t("settings.notifications.cancelledReservation")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-reports" defaultChecked className="rounded" />
                      <Label htmlFor="email-reports">{t("settings.notifications.weeklyReports")}</Label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("settings.notifications.sms")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.smsDescription")}
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
                      <Label htmlFor="sms-reservations">{t("settings.notifications.newReservation")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sms-cancellations" defaultChecked className="rounded" />
                      <Label htmlFor="sms-cancellations">{t("settings.notifications.cancelledReservation")}</Label>
                    </div>
                  </div>
                )}
              </div>
              
              <Button onClick={handleSaveNotifications}>{t("common.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.account.title")}</CardTitle>
              <CardDescription>
                {t("settings.account.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">{t("settings.account.name")}</Label>
                  <Input id="full-name" defaultValue="Maria Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input id="email" type="email" defaultValue="maria@mariatoolbox.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("common.phone")}</Label>
                  <Input id="phone" type="tel" defaultValue="+55 11 9xxxx-xxxx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t("common.company")}</Label>
                  <Input id="company" defaultValue="Maria Faz Gerenciamento" />
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="outline" className="w-full">{t("settings.account.changePassword")}</Button>
              </div>
              
              <Button className="w-full">{t("common.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.language.title")}</CardTitle>
              <CardDescription>
                {t("settings.language.selectLanguage")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer hover:border-primary ${currentLanguage === 'pt-PT' ? 'border-primary bg-primary-50' : ''}`}
                  onClick={() => changeLanguage('pt-PT')}
                >
                  <CardContent className="pt-6 flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-4 bg-gray-100 flex items-center justify-center">
                      🇵🇹
                    </div>
                    <div>
                      <h3 className="font-medium">Português (Portugal)</h3>
                      <p className="text-sm text-muted-foreground">Português (PT)</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer hover:border-primary ${currentLanguage === 'en-US' ? 'border-primary bg-primary-50' : ''}`}
                  onClick={() => changeLanguage('en-US')}
                >
                  <CardContent className="pt-6 flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-4 bg-gray-100 flex items-center justify-center">
                      🇺🇸
                    </div>
                    <div>
                      <h3 className="font-medium">English (US)</h3>
                      <p className="text-sm text-muted-foreground">English (US)</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer hover:border-primary ${currentLanguage === 'fr-FR' ? 'border-primary bg-primary-50' : ''}`}
                  onClick={() => changeLanguage('fr-FR')}
                >
                  <CardContent className="pt-6 flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-4 bg-gray-100 flex items-center justify-center">
                      🇫🇷
                    </div>
                    <div>
                      <h3 className="font-medium">Français (France)</h3>
                      <p className="text-sm text-muted-foreground">Français (FR)</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer hover:border-primary ${currentLanguage === 'es-ES' ? 'border-primary bg-primary-50' : ''}`}
                  onClick={() => changeLanguage('es-ES')}
                >
                  <CardContent className="pt-6 flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-4 bg-gray-100 flex items-center justify-center">
                      🇪🇸
                    </div>
                    <div>
                      <h3 className="font-medium">Español (España)</h3>
                      <p className="text-sm text-muted-foreground">Español (ES)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.integrations.title")}</CardTitle>
              <CardDescription>
                {t("settings.integrations.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mistral-api">{t("settings.integrations.mistralAI.apiKey")}</Label>
                <Input 
                  id="mistral-api" 
                  type="password" 
                  placeholder={t("settings.integrations.mistralAI.apiKeyPlaceholder")}
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("settings.integrations.mistralAI.description")} <a href="https://mistral.ai/api/" className="text-primary underline" target="_blank" rel="noopener noreferrer">{t("settings.integrations.mistralAI.getApiKey")}</a>.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveAPI} className="flex-1">
                  {t("settings.integrations.mistralAI.save")}
                </Button>
                <Button 
                  onClick={handleTestIntegrations} 
                  variant="outline" 
                  disabled={isTestingIntegrations}
                  className="flex items-center gap-1"
                >
                  <Activity className="h-4 w-4" />
                  {isTestingIntegrations ? "Testando..." : "Testar Integrações"}
                </Button>
              </div>
              
              {/* Resultados do teste de integrações */}
              {(testResults.mistral !== null || testResults.message) && (
                <div className="mt-4 space-y-4">
                  <Separator />
                  <div>
                    <h3 className="font-medium text-lg mb-2">Resultados dos Testes</h3>
                    
                    {testResults.message && (
                      <Alert className="mb-4">
                        <AlertTitle>Mensagem do Sistema</AlertTitle>
                        <AlertDescription className="whitespace-pre-line">
                          {testResults.message}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-md border">
                        <div className="flex items-center gap-2 mb-1">
                          {testResults.mistral === true ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : testResults.mistral === false ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Activity className="h-5 w-5 text-gray-500" />
                          )}
                          <h4 className="font-medium">Mistral AI</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {testResults.mistral === true 
                            ? "API do Mistral conectada corretamente." 
                            : testResults.mistral === false 
                              ? "Falha na conexão com a API do Mistral." 
                              : "Teste pendente."}
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-md border">
                        <div className="flex items-center gap-2 mb-1">
                          {testResults.database === true ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : testResults.database === false ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Activity className="h-5 w-5 text-gray-500" />
                          )}
                          <h4 className="font-medium">Base de Dados</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {testResults.database === true 
                            ? "Conexão com a base de dados funcionando." 
                            : testResults.database === false 
                              ? "Falha na conexão com a base de dados." 
                              : "Teste pendente."}
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-md border">
                        <div className="flex items-center gap-2 mb-1">
                          {testResults.ocr === true ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : testResults.ocr === false ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Activity className="h-5 w-5 text-gray-500" />
                          )}
                          <h4 className="font-medium">OCR</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {testResults.ocr === true 
                            ? "Processamento de OCR funcionando." 
                            : testResults.ocr === false 
                              ? "Falha na integração de OCR." 
                              : "Teste pendente."}
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-md border">
                        <div className="flex items-center gap-2 mb-1">
                          {testResults.rag === true ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : testResults.rag === false ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Activity className="h-5 w-5 text-gray-500" />
                          )}
                          <h4 className="font-medium">RAG</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {testResults.rag === true 
                            ? "Sistema RAG funcionando corretamente." 
                            : testResults.rag === false 
                              ? "Falha no sistema RAG." 
                              : "Teste pendente."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}