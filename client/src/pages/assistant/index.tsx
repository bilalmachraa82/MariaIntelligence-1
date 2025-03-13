import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, MessageSquare, Clock, ArrowDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Interface para as mensagens
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MISTRAL_API_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

// Componente de página do assistente IA com integração Mistral
export default function AssistantPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: t("aiAssistant.welcomeMessage", "Olá! Sou o assistente da Maria Faz. Em que posso ajudar hoje?"), 
      timestamp: new Date() 
    }
  ]);
  const [hasMistralKey, setHasMistralKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Verificar se a chave da API está disponível
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await apiRequest<{ available: boolean }>("/api/check-mistral-key");
        setHasMistralKey(response.available);
      } catch (error) {
        console.error("Erro ao verificar a chave da API Mistral:", error);
        setHasMistralKey(false);
      }
    };
    
    checkApiKey();
  }, []);

  // Rolar para a última mensagem quando novas mensagens são adicionadas
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Função para enviar mensagem ao assistente com Mistral AI
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Adiciona mensagem do usuário
    const userMessage = { role: "user" as const, content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setMessage("");
    
    try {
      // Se não tiver a chave da API, use uma mensagem padrão
      if (!hasMistralKey) {
        setTimeout(() => {
          const assistantMessage = { 
            role: "assistant" as const, 
            content: t("aiAssistant.noApiKeyMessage", "Para usar todas as funcionalidades do assistente, por favor configure a chave da API Mistral nas configurações."), 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      // Se tiver a chave, envie a solicitação para a API
      const response = await apiRequest<{ reply: string }>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({
          message: message,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });
      
      const assistantMessage = { 
        role: "assistant" as const, 
        content: response.reply || t("aiAssistant.errorMessage", "Desculpe, não consegui processar sua solicitação."), 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao processar a mensagem com Mistral AI:", error);
      toast({
        title: t("aiAssistant.error", "Erro"),
        description: t("aiAssistant.errorDescription", "Não foi possível conectar ao assistente. Tente novamente."),
        variant: "destructive"
      });
      
      const errorMessage = { 
        role: "assistant" as const, 
        content: t("aiAssistant.errorMessage", "Desculpe, encontrei um problema. Tente novamente mais tarde."), 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Exemplo de sugestões rápidas para o usuário em português de Portugal
  const suggestions = [
    { id: 1, text: "Qual é a taxa de ocupação das minhas propriedades?" },
    { id: 2, text: "Qual foi a receita total no último mês?" },
    { id: 3, text: "Qual é a minha propriedade com melhor desempenho?" },
    { id: 4, text: "Quais são os próximos check-ins agendados?" },
    { id: 5, text: "Fala-me um pouco sobre ti. Que tipo de personalidade tens?" },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Bot className="mr-2 h-6 w-6" />
        {t("aiAssistant.title")}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-[calc(100vh-10rem)]">
            <CardHeader className="border-b p-4">
              <CardTitle>{t("aiAssistant.chatTitle", "Maria Faz Assistant")}</CardTitle>
              <CardDescription>{t("aiAssistant.chatDescription", "Pergunte sobre suas propriedades, reservas e relatórios")}</CardDescription>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col h-[calc(100%-10rem)]">
              <ScrollArea className="flex-grow px-4 py-2">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 
                          'bg-primary text-primary-foreground' : 
                          'bg-muted'
                        }`}
                      >
                        <div className="text-sm mb-1">{msg.content}</div>
                        <div className="text-xs opacity-70 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-lg bg-muted animate-pulse">
                        <div className="text-sm mb-1 flex items-center">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce mr-1"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75 mr-1"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter className="p-4 border-t">
              <div className="flex w-full gap-2 items-center">
                <Input 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("aiAssistant.placeholder")}
                  disabled={isLoading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("aiAssistant.suggestions.title")}</CardTitle>
              <CardDescription>{t("aiAssistant.suggestionsDescription", "Perguntas sugeridas")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestions.map((suggestion) => (
                  <Button 
                    key={suggestion.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setMessage(suggestion.text);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t("aiAssistant.features.title")}</CardTitle>
              <CardDescription>{t("aiAssistant.featuresDescription", "O que o assistente pode fazer")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ArrowDown className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>{t("aiAssistant.features.analytics")}</span>
                </li>
                <li className="flex items-start">
                  <ArrowDown className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>{t("aiAssistant.features.recommendations")}</span>
                </li>
                <li className="flex items-start">
                  <ArrowDown className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>{t("aiAssistant.features.forecasting")}</span>
                </li>
                <li className="flex items-start">
                  <ArrowDown className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>{t("aiAssistant.features.automation")}</span>
                </li>
              </ul>
              
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {t("aiAssistant.mistralInfo", "Este assistente utiliza a tecnologia Mistral AI para responder a todas as suas perguntas sobre gestão de propriedades, com personalidade otimista e conhecimento especializado.")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}