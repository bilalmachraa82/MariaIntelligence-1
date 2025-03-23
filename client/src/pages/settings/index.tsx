import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, HelpCircle, BellRing, User, Globe, Key, AlertCircle, CheckCircle, Activity, Building2, Users, PaintBucket, BarChart3, CalendarDays } from "lucide-react";
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

  // Função de configuração de API removida - agora a chave é gerenciada internamente

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
  
  // Definição dos tipos de teste fora da função para reutilização
  interface TestResult {
    name: string;
    success: boolean;
    details?: any;
    error?: string;
  }
  
  interface TestResponse {
    success: boolean;
    timestamp: string;
    tests: TestResult[];
  }

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
      console.log("Iniciando testes de integração");
      const data = await apiRequest<TestResponse>("/api/test-integrations");
      
      console.log("Resposta completa:", data);
      
      if (data && data.tests && Array.isArray(data.tests)) {
        // Extrai os resultados de cada teste pelo nome
        const mistralTest = data.tests.find((test: TestResult) => test.name === "Mistral AI");
        const dbTest = data.tests.find((test: TestResult) => test.name === "Base de Dados");
        const ocrTest = data.tests.find((test: TestResult) => test.name === "OCR (Processamento de PDFs)");
        const ragTest = data.tests.find((test: TestResult) => test.name === "RAG (Retrieval Augmented Generation)");
        
        console.log("Testes individuais:", {
          mistralTest,
          dbTest,
          ocrTest,
          ragTest
        });
        
        // Processa qualquer mensagem de erro
        const errorMessages = data.tests
          .filter((test: TestResult) => !test.success && test.error)
          .map((test: TestResult) => `${test.name}: ${test.error}`)
          .join("\n");
        
        // Atualiza o estado com os resultados dos testes
        setTestResults({
          mistral: mistralTest?.success || false,
          database: dbTest?.success || false,
          ocr: ocrTest?.success || false,
          rag: ragTest?.success || false,
          message: errorMessages,
        });
        
        // Se todos os testes foram bem-sucedidos
        const allTestsSuccessful = mistralTest?.success && dbTest?.success && ocrTest?.success && ragTest?.success;
        
        if (allTestsSuccessful) {
          toast({
            title: "Testes de integração bem-sucedidos",
            description: "Todas as integrações estão funcionando corretamente.",
            variant: "default",
          });
        } else {
          toast({
            title: "Problemas na integração",
            description: "Algumas integrações não estão funcionando corretamente. Verifique os detalhes abaixo.",
            variant: "destructive",
          });
        }
      } else {
        // Se a resposta não tiver o formato esperado
        console.error("Formato de resposta inválido:", data);
        throw new Error("Formato de resposta inválido");
      }
    } catch (error) {
      console.error("Erro ao processar resposta:", error);
      
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
      <div className="flex flex-col sm:flex-row sm:justify-between mb-2 sm:mb-0 gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("common.back")}
          </Button>
          <h2 className="text-xl sm:text-2xl font-bold truncate">{t("settings.title")}</h2>
        </div>
        <Button variant="outline" size="sm" className="self-start sm:self-auto w-full sm:w-auto" onClick={() => window.open("https://mariatoolbox.com/docs", "_blank")}>
          <HelpCircle className="h-4 w-4 mr-1" />
          <span className="whitespace-nowrap">{t("common.help")}</span>
        </Button>
      </div>

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList className="flex flex-wrap overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <TabsTrigger value="properties" className="min-w-fit">
            <Building2 className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">{t("navigation.properties", "Imóveis")}</span>
          </TabsTrigger>
          <TabsTrigger value="cleaning-teams" className="min-w-fit">
            <Users className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">{t("navigation.cleaning.teams", "Equipas de Limpeza")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="min-w-fit">
            <BellRing className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">{t("settings.tabs.notifications")}</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="min-w-fit">
            <Settings className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">{t("settings.tabs.general")}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="min-w-fit">
            <User className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">{t("settings.tabs.account")}</span>
          </TabsTrigger>
          <TabsTrigger value="language" className="min-w-fit">
            <Globe className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">{t("settings.tabs.language")}</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="min-w-fit">
            <Key className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">{t("settings.tabs.integrations")}</span>
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
                <Switch 
                  id="dark-mode" 
                  checked={isDarkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
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
                  className={`cursor-pointer hover:border-primary transition-colors ${currentLanguage === 'pt-PT' || currentLanguage === 'pt' ? 'border-primary bg-primary-50/30' : ''}`}
                  onClick={() => changeLanguage('pt-PT')}
                >
                  <CardContent className="pt-4 sm:pt-6 flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3 sm:mr-4 bg-gray-100 flex items-center justify-center text-xl">
                      🇵🇹
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-base sm:text-lg truncate">Português (Portugal)</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Idioma padrão do sistema</p>
                      <Badge className="mt-1" variant="outline">Recomendado</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer hover:border-primary transition-colors ${currentLanguage === 'en-GB' || currentLanguage === 'en' ? 'border-primary bg-primary-50/30' : ''}`}
                  onClick={() => changeLanguage('en-GB')}
                >
                  <CardContent className="pt-4 sm:pt-6 flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3 sm:mr-4 bg-gray-100 flex items-center justify-center text-xl">
                      🇬🇧
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-base sm:text-lg truncate">English (UK)</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Alternativa em inglês</p>
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
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>API Mistral configurada internamente</AlertTitle>
                  <AlertDescription>
                    A chave da API Mistral está configurada internamente no sistema por razões de segurança e não pode ser modificada através da interface. Esta abordagem garante maior segurança no acesso à API e consistência na integração. Se você precisar atualizar a chave ou tiver problemas com a integração, entre em contato com o suporte técnico.
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestIntegrations} 
                  variant="default" 
                  disabled={isTestingIntegrations}
                  className="flex items-center gap-1 w-full sm:w-auto"
                >
                  <Activity className="h-4 w-4" />
                  <span className="whitespace-nowrap">{isTestingIntegrations ? "Testando..." : "Testar Integrações"}</span>
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("navigation.properties", "Imóveis")}</CardTitle>
              <CardDescription>
                Gerenciamento de propriedades e imóveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4">
                <h3 className="text-lg font-medium">Lista de Imóveis</h3>
                <Button 
                  onClick={() => navigate("/propriedades/novo")}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <span className="mr-1">+</span> Adicionar Novo Imóvel
                </Button>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/propriedades")}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Ver Todos os Imóveis
                </Button>
                <Button 
                  onClick={() => navigate("/propriedades/estatisticas")}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Estatísticas de Imóveis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning-teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("navigation.cleaning.teams", "Equipas de Limpeza")}</CardTitle>
              <CardDescription>
                Gestão de equipas e agendamentos de limpeza
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4">
                <h3 className="text-lg font-medium">Equipas de Limpeza</h3>
                <Button 
                  onClick={() => navigate("/equipas-limpeza/nova")}
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <span className="mr-1">+</span> Adicionar Nova Equipa
                </Button>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/equipas-limpeza")}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ver Todas as Equipas
                </Button>
                <Button 
                  onClick={() => navigate("/equipas-limpeza/agendamentos")}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <BellRing className="h-4 w-4 mr-2" />
                  Agendamentos de Limpeza
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}