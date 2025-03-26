import { useState, useEffect, useRef, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { ChatBubble, Message } from "@/components/chat/chat-bubble";
import { VoiceRecorderButton } from "@/components/chat/voice-recorder-button";
import { 
  Send, 
  Bot, 
  MessageSquare, 
  Clock, 
  ArrowDown,
  ArrowRight, 
  AlertTriangle, 
  Image, 
  FileText, 
  Mic, 
  RefreshCw, 
  UploadCloud, 
  Settings, 
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BarChart,
  FileQuestion,
  LightbulbIcon,
  Braces,
  Home,
  ChevronRight,
  Plus,
  Gauge,
  Search,
  Tag,
  BadgeInfo,
  BookOpen,
  PieChart,
  Calendar,
  Book,
  LogOut,
  Wrench
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProperties } from "@/hooks/use-properties";
import { useReservations } from "@/hooks/use-reservations";

// Interfaces para os componentes do assistente
interface SuggestionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient?: string;
}

interface ContextCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

const MISTRAL_API_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

// Componente para sugestões aprimorado
const SuggestionCard = ({ icon, title, description, onClick, gradient = "from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30" }: SuggestionCardProps) => {
  return (
    <div
      className={`w-full p-4 rounded-md shadow-sm border border-border/40 bg-gradient-to-br ${gradient} cursor-pointer transition-all hover:shadow-md`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-full bg-primary/10 p-2 text-primary flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-base font-semibold truncate">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 pl-11">{description}</p>
    </div>
  );
};

// Componente para cartões de contexto
const ContextCard = ({ title, icon, children, className }: ContextCardProps) => {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex flex-col space-y-1.5 p-4 pb-2">
        <h3 className="flex items-center gap-2 font-semibold leading-none tracking-tight text-sm">
          {icon}
          {title}
        </h3>
      </div>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </div>
  );
};

// Componente de página do assistente IA com integração Mistral
export default function AssistantPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const isMobile = useIsMobile();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dados do sistema
  const { data: properties } = useProperties();
  const { data: reservations } = useReservations();
  
  // Estado para a mensagem de feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [hasMistralKey, setHasMistralKey] = useState(false);
  
  // ID único para as mensagens
  const generateId = () => Math.random().toString(36).substring(2, 9);
  
  // Estado das mensagens com persistência no localStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    // Tenta recuperar mensagens do localStorage
    const savedMessages = localStorage.getItem('chat-messages');
    
    if (savedMessages) {
      try {
        // Parse as mensagens salvas
        const parsedMessages = JSON.parse(savedMessages);
        
        // Converter strings de data de volta para objetos Date
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (error) {
        console.error("Erro ao recuperar mensagens do chat:", error);
      }
    }
    
    // Retorna mensagem de boas-vindas se não houver mensagens salvas
    return [{ 
      role: "assistant" as const, 
      content: t("aiAssistant.welcomeMessage", "Olá! Sou a Maria, assistente inteligente da plataforma Maria Faz. Como posso ajudar hoje?"), 
      timestamp: new Date(),
      id: generateId()
    }];
  });

  // Verificar se a chave da API está disponível
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // Use o método GET explicitamente para a verificação da chave
        const response = await fetch("/api/check-mistral-key", {
          method: "GET",
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setHasMistralKey(data.available);
        
        if (!data.available) {
          setShowFeedback(true);
          setFeedbackMessage(t("aiAssistant.configureApiKey", "Configure a chave da API Mistral nas configurações para acessar todos os recursos do assistente."));
        }
      } catch (error) {
        console.error("Erro ao verificar a chave da API Mistral:", error);
        setHasMistralKey(false);
      }
    };
    
    checkApiKey();
  }, [t]);

  // Rolar para a última mensagem quando novas mensagens são adicionadas
  // E salvar as mensagens no localStorage
  useEffect(() => {
    // Rolagem suave para a última mensagem
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Salvar mensagens no localStorage para persistência entre navegações
    try {
      // Converter as mensagens para um formato serializável
      const messagesToSave = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString() // Converter Date para string ISO
      }));
      
      localStorage.setItem('chat-messages', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error("Erro ao salvar mensagens do chat:", error);
    }
  }, [messages]);

  // Função para enviar mensagem ao assistente com Mistral AI
  const sendMessage = async (messageToSend?: string | React.MouseEvent<HTMLButtonElement>) => {
    // Se for um evento (click do botão), usamos o estado atual da mensagem
    // Se for uma string, usamos o valor passado
    // Caso contrário, usamos o estado atual da mensagem
    let textToSend = message;
    
    if (typeof messageToSend === 'string') {
      textToSend = messageToSend;
    }
    
    if (!textToSend.trim()) return;
    
    // Adiciona mensagem do usuário
    const userMessage: Message = { 
      role: "user" as const, 
      content: textToSend, 
      timestamp: new Date(),
      id: generateId()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    // Só limpa o campo de mensagem se estamos usando o valor do estado atual
    if (messageToSend === undefined) {
      setMessage("");
    }
    
    try {
      // Se não tiver a chave da API, use uma mensagem padrão
      if (!hasMistralKey) {
        setTimeout(() => {
          const assistantMessage: Message = { 
            role: "assistant" as const, 
            content: t(
              "aiAssistant.noApiKeyMessage", 
              "Para usar todas as funcionalidades do assistente, por favor configure a chave da API Mistral nas configurações."
            ), 
            timestamp: new Date(),
            id: generateId()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      // Se tiver a chave, envie a solicitação para a API
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          language: i18n.language,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Processamento do contexto (se disponível)
      let context;
      if (data.context) {
        if (data.context.type === "property" && properties && Array.isArray(properties)) {
          const property = properties.find((p: any) => p.id === data.context.propertyId);
          if (property) {
            context = {
              type: "property" as "property" | "reservation" | "owner" | "report" | "suggestion",
              data: property
            };
          }
        } else if (data.context.type === "reservation" && reservations && Array.isArray(reservations)) {
          const reservation = reservations.find((r: any) => r.id === data.context.reservationId);
          if (reservation) {
            context = {
              type: "reservation" as "property" | "reservation" | "owner" | "report" | "suggestion",
              data: reservation
            };
          }
        } else if (data.context.type === "suggestion") {
          context = {
            type: "suggestion",
            data: data.context.data
          };
        }
      }
      
      const assistantMessage: Message = { 
        role: "assistant" as const, 
        content: data.reply || t("aiAssistant.errorMessage", "Desculpe, não consegui processar sua solicitação."), 
        timestamp: new Date(),
        id: generateId(),
        context: context as { type: "property" | "reservation" | "owner" | "report" | "suggestion"; data: any; } | undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao processar a mensagem com Mistral AI:", error);
      toast({
        title: t("aiAssistant.error", "Erro"),
        description: t("aiAssistant.errorDescription", "Não foi possível conectar ao assistente. Tente novamente."),
        variant: "destructive"
      });
      
      const errorMessage: Message = { 
        role: "assistant" as const, 
        content: t("aiAssistant.errorMessage", "Desculpe, encontrei um problema. Tente novamente mais tarde."), 
        timestamp: new Date(),
        id: generateId()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Salvar feedback da mensagem
  const handleMessageFeedback = async (messageId: string, type: "positive" | "negative") => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, feedback: type };
      }
      return msg;
    });
    
    setMessages(updatedMessages);
    
    // Aqui você pode enviar o feedback para o servidor/API
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          type,
          content: updatedMessages.find(m => m.id === messageId)?.content
        })
      });
      
      toast({
        title: t("aiAssistant.feedbackSent", "Obrigado pelo feedback"),
        description: type === "positive" 
          ? t("aiAssistant.positiveFeedback", "Seu feedback positivo ajuda a melhorar o assistente.") 
          : t("aiAssistant.negativeFeedback", "Desculpe pela resposta inadequada. Trabalharemos para melhorar."),
        variant: type === "positive" ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
    }
  };
  
  // Processar upload de arquivo
  const handleFileUpload = (file: File) => {
    // Implementar processamento de arquivo
    toast({
      title: t("aiAssistant.fileUploaded", "Arquivo enviado"),
      description: t("aiAssistant.fileProcessing", "Processando arquivo: ") + file.name,
    });
    
    // Simulação de processamento - em produção, substituir por real API
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      const assistantMessage: Message = { 
        role: "assistant" as const, 
        content: t(
          "aiAssistant.fileProcessed", 
          `Recebi seu arquivo "${file.name}". O que gostaria de saber sobre ele?`
        ), 
        timestamp: new Date(),
        id: generateId(),
        context: {
          type: "suggestion",
          data: { fileName: file.name, fileType: file.type }
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }, 1500);
  };

  // Categorias de sugestões
  const suggestionCategories = {
    business: [
      { id: "b1", text: t("aiAssistant.suggestions.business.revenue", "Qual foi a receita total no último mês?") },
      { id: "b2", text: t("aiAssistant.suggestions.business.performance", "Qual imóvel teve o melhor desempenho?") },
      { id: "b3", text: t("aiAssistant.suggestions.business.occupancy", "Qual é a taxa de ocupação dos imóveis?") },
      { id: "b4", text: t("aiAssistant.suggestions.business.trends", "Quais são as tendências de receita?") },
    ],
    properties: [
      { id: "p1", text: t("aiAssistant.suggestions.properties.list", "Lista dos meus imóveis") },
      { id: "p2", text: t("aiAssistant.suggestions.properties.maintenance", "Existem manutenções pendentes?") },
      { id: "p3", text: t("aiAssistant.suggestions.properties.cleaning", "Quando foi a última limpeza?") },
      { id: "p4", text: t("aiAssistant.suggestions.properties.recommendations", "Como posso melhorar os meus imóveis?") },
    ],
    reservations: [
      { id: "r1", text: t("aiAssistant.suggestions.reservations.upcoming", "Próximos check-ins agendados") },
      { id: "r2", text: t("aiAssistant.suggestions.reservations.cancellations", "Houve cancelamentos recentes?") },
      { id: "r3", text: t("aiAssistant.suggestions.reservations.availability", "Qual é a disponibilidade para o próximo mês?") },
      { id: "r4", text: t("aiAssistant.suggestions.reservations.longestStay", "Qual foi a estadia mais longa?") },
    ],
    assistant: [
      { id: "a1", text: t("aiAssistant.suggestions.assistant.personality", "Que tipo de personalidade tens?") },
      { id: "a2", text: t("aiAssistant.suggestions.assistant.capabilities", "O que podes fazer por mim?") },
      { id: "a3", text: t("aiAssistant.suggestions.assistant.dataSource", "De onde vêm as tuas informações?") },
      { id: "a4", text: t("aiAssistant.suggestions.assistant.improvement", "Como posso dar-te feedback?") },
    ],
  };
  
  // Sugestões rápidas focadas em tarefas práticas
  const suggestions = [
    { 
      id: "s1", 
      icon: <Calendar className="h-5 w-5" />, 
      title: t("aiAssistant.quickTasks.nextCheckins", "Próximos Check-ins"), 
      description: t("aiAssistant.quickTasks.checkinsDesc", "Quais são os próximos check-ins agendados?"),
      gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30",
      prompt: t("aiAssistant.quickPrompts.nextCheckins", "Quais são os próximos check-ins agendados para hoje e amanhã?")
    },
    { 
      id: "s2", 
      icon: <ArrowRight className="h-5 w-5" />, 
      title: t("aiAssistant.quickTasks.nextCheckouts", "Próximos Check-outs"), 
      description: t("aiAssistant.quickTasks.checkoutsDesc", "Check-outs previstos para hoje"),
      gradient: "from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30",
      prompt: t("aiAssistant.quickPrompts.nextCheckouts", "Quais são os check-outs previstos para hoje?")
    },
    { 
      id: "s3", 
      icon: <Sparkles className="h-5 w-5" />, 
      title: t("aiAssistant.quickTasks.cleaning", "Limpezas Pendentes"), 
      description: t("aiAssistant.quickTasks.cleaningDesc", "Limpezas agendadas após check-outs"),
      gradient: "from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30",
      prompt: t("aiAssistant.quickPrompts.cleaning", "Quais são as limpezas pendentes após os check-outs de hoje?")
    },
    { 
      id: "s4", 
      icon: <FileText className="h-5 w-5" />, 
      title: t("aiAssistant.quickTasks.maintenance", "Manutenções"), 
      description: t("aiAssistant.quickTasks.maintenanceDesc", "Problemas reportados a resolver"),
      gradient: "from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30",
      prompt: t("aiAssistant.quickPrompts.maintenance", "Quais são as manutenções pendentes nos imóveis?")
    },
    { 
      id: "s5", 
      icon: <Clock className="h-5 w-5" />, 
      title: t("aiAssistant.quickTasks.today", "Tarefas para Hoje"), 
      description: t("aiAssistant.quickTasks.todayDesc", "Resumo de tudo para hoje"),
      gradient: "from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30",
      prompt: t("aiAssistant.quickPrompts.today", "Quais são todas as tarefas que preciso fazer hoje?")
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Funções para manipular sugestões
  const handleSuggestionClick = (text: string) => {
    if (activeTab !== "chat") {
      setActiveTab("chat");
    }
    // Enviar a mensagem diretamente, sem depender do estado
    setTimeout(() => sendMessage(text), 100);
  };
  
  const handleQuickSuggestionClick = (id: string) => {
    // Encontra a sugestão pelo id
    const suggestion = suggestions.find(s => s.id === id);
    
    if (suggestion) {
      // Se tiver um prompt específico, usa-o diretamente
      if (suggestion.prompt) {
        // Mudando para a aba de chat, se não estiver nela
        if (activeTab !== "chat") {
          setActiveTab("chat");
        }
        // Enviar a mensagem diretamente com o texto do prompt
        // Não usamos setTimeout aqui para garantir envio imediato
        sendMessage(suggestion.prompt);
      } else {
        console.warn(`Sugestão com ID ${id} não possui prompt definido.`);
      }
    } else {
      console.warn(`Sugestão com ID ${id} não encontrada.`);
    }
  };
  
  // Limpar conversa e localStorage
  const clearConversation = () => {
    // Criar nova mensagem de boas-vindas
    const welcomeMessage: Message = { 
      role: "assistant" as const, 
      content: t("aiAssistant.welcomeMessage", "Olá! Sou a Maria, a tua assistente inteligente da Maria Faz. Como posso ajudar-te hoje?"), 
      timestamp: new Date(),
      id: generateId()
    };
    
    // Atualizar estado
    setMessages([welcomeMessage]);
    
    // Limpar localStorage também
    try {
      localStorage.removeItem('chat-messages');
    } catch (error) {
      console.error("Erro ao limpar histórico de chat do localStorage:", error);
    }
    
    toast({
      title: t("aiAssistant.conversationCleared", "Conversa reiniciada"),
      description: t("aiAssistant.conversationClearedDesc", "A tua conversa anterior foi apagada."),
    });
  };
  
  // Trigger upload de arquivo
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle do upload de arquivo
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Sparkles className="mr-2 h-6 w-6 text-primary" />
          {t("aiAssistant.title", "Maria Assistant")}
        </h1>
        
        <div className="flex gap-2">
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  {t("aiAssistant.options", "Opções")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={clearConversation}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("aiAssistant.clearConversation", "Limpar conversa")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={triggerFileUpload}>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  {t("aiAssistant.uploadDocument", "Anexar ficheiro")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Mensagem de aviso sobre a chave API */}
      {showFeedback && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center gap-2"
        >
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>{feedbackMessage}</span>
          <Button 
            variant="ghost" 
            size="sm"
            className="ml-auto"
            onClick={() => setShowFeedback(false)}
          >
            {t("aiAssistant.dismiss", "Dispensar")}
          </Button>
        </motion.div>
      )}
      
      {/* Interface Principal - Layout responsivo */}
      <div className="grid grid-cols-1 gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{t("aiAssistant.tabs.chat", "Conversa")}</span>
            </TabsTrigger>
            <TabsTrigger value="quick-access" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{t("aiAssistant.tabs.quickAccess", "Atalhos")}</span>
            </TabsTrigger>
            {isMobile && (
              <TabsTrigger value="tools" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{t("aiAssistant.tabs.tools", "Opções")}</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="chat" className="m-0">
            <Card className="h-[calc(100vh-14rem)]">
              <CardHeader className="border-b p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      {t("aiAssistant.chatTitle", "Assistente Maria")}
                    </CardTitle>
                    <CardDescription>{t("aiAssistant.chatDescription", "Tira as tuas dúvidas sobre imóveis, reservas e relatórios")}</CardDescription>
                  </div>
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={clearConversation}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex flex-col h-[calc(100%-9rem)]">
                <ScrollArea className="flex-grow p-4">
                  <div className="space-y-6">
                    {/* Mensagens com o novo componente ChatBubble */}
                    <AnimatePresence>
                      {/* Mostra apenas as últimas 20 mensagens para melhorar o desempenho */}
                      {messages.slice(-20).map((msg, index) => (
                        <ChatBubble 
                          key={msg.id || index} 
                          message={msg} 
                          onFeedback={handleMessageFeedback}
                        />
                      ))}
                      
                      {/* Indicação de digitação */}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                MF
                              </AvatarFallback>
                            </Avatar>
                            <div className="max-w-[80%] p-3 rounded-lg bg-muted/70 border border-border/50 animate-pulse">
                              <div className="flex items-center gap-1 h-5">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Referência para rolagem automática */}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              
              <CardFooter className="p-4 border-t">
                <div className="flex w-full gap-2 items-center">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={triggerFileUpload}
                    title={t("aiAssistant.attachFile", "Anexar ficheiro")}
                    disabled={isLoading}
                  >
                    <UploadCloud className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("aiAssistant.placeholder", "Escreve a tua mensagem aqui...")}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  
                  <VoiceRecorderButton 
                    onMessageReceived={(text) => {
                      setMessage(text);
                      // Pequeno delay para garantir que o estado foi atualizado antes de enviar
                      setTimeout(() => sendMessage(text), 100);
                    }}
                    disabled={isLoading}
                    className="mr-1"
                  />
                  
                  <Button 
                    onClick={() => sendMessage()} 
                    disabled={!message.trim() || isLoading}
                    size="icon"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  
                  {/* Input oculto para upload de ficheiro */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="suggestions" className="m-0">
            <Card className="h-[calc(100vh-14rem)]">
              <CardHeader>
                <CardTitle>{t("aiAssistant.allSuggestions", "Todas as sugestões")}</CardTitle>
                <CardDescription>{t("aiAssistant.allSuggestionsDesc", "Explore sugestões por categoria para obter insights valiosos")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="business">
                  <TabsList className="mb-4 grid grid-cols-2 sm:grid-cols-4 h-auto gap-1">
                    <TabsTrigger value="business" className="text-xs px-2">
                      <BarChart className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{t("aiAssistant.categories.business", "Negócios")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="properties" className="text-xs px-2">
                      <Home className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{t("aiAssistant.categories.properties", "Propriedades")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="reservations" className="text-xs px-2">
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{t("aiAssistant.categories.reservations", "Reservas")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="assistant" className="text-xs px-2">
                      <Bot className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{t("aiAssistant.categories.assistant", "Assistente")}</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="business" className="m-0 space-y-2">
                    {suggestionCategories.business.map(item => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleSuggestionClick(item.text)}
                      >
                        <BarChart className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                        <span className="truncate">{item.text}</span>
                      </Button>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="properties" className="m-0 space-y-2">
                    {suggestionCategories.properties.map(item => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleSuggestionClick(item.text)}
                      >
                        <Home className="h-4 w-4 mr-2 flex-shrink-0 text-emerald-500" />
                        <span className="truncate">{item.text}</span>
                      </Button>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="reservations" className="m-0 space-y-2">
                    {suggestionCategories.reservations.map(item => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleSuggestionClick(item.text)}
                      >
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                        <span className="truncate">{item.text}</span>
                      </Button>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="assistant" className="m-0 space-y-2">
                    {suggestionCategories.assistant.map(item => (
                      <Button
                        key={item.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleSuggestionClick(item.text)}
                      >
                        <Bot className="h-4 w-4 mr-2 flex-shrink-0 text-violet-500" />
                        <span className="truncate">{item.text}</span>
                      </Button>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="quick-access" className="m-0">
            <Card className="relative max-h-[calc(100vh-10rem)] flex flex-col">
              <CardHeader>
                <CardTitle>{t("aiAssistant.quickSuggestions.title", "Atalhos")}</CardTitle>
                <CardDescription>{t("aiAssistant.quickSuggestions.subtitle", "Ações rápidas para as tuas tarefas mais comuns")}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto max-h-[calc(100vh-15rem)]">
                <div className="flex flex-col space-y-3 pb-2">
                  {suggestions.map(suggestion => (
                    <SuggestionCard
                      key={suggestion.id}
                      icon={suggestion.icon}
                      title={suggestion.title}
                      description={suggestion.description}
                      gradient={suggestion.gradient}
                      onClick={() => handleQuickSuggestionClick(suggestion.id)}
                    />
                  ))}
                </div>
                
                {/* Área para informações adicionais ou dicas de uso */}
                <div className="mt-8">
                  <div className="bg-muted/40 border border-primary/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">{t("aiAssistant.tip.title", "Dica")}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("aiAssistant.tip.message", "Podes usar a assistente para obter informações sobre os teus imóveis, ajuda com reservas e análises de desempenho. Basta perguntares de forma natural!")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {isMobile && (
            <TabsContent value="tools" className="m-0">
              <Card className="h-[calc(100vh-14rem)]">
                <CardHeader>
                  <CardTitle>{t("aiAssistant.tools.title", "Opções")}</CardTitle>
                  <CardDescription>{t("aiAssistant.tools.description", "Gerir a conversa e documentos")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={clearConversation}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("aiAssistant.clearConversation", "Nova conversa")}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={triggerFileUpload}
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    {t("aiAssistant.uploadDocument", "Enviar ficheiro")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}