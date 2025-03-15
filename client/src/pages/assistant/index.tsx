import { useState, useEffect, useRef, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Bot, 
  MessageSquare, 
  Clock, 
  ArrowDown, 
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
  BadgeInfo,
  BookOpen,
  Search,
  Tag,
  PieChart,
  Gauge,
  Calendar
} from "lucide-react";
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

// Interface para as mensagens
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id?: string;
  feedback?: "positive" | "negative" | null;
  context?: {
    type: "property" | "reservation" | "owner" | "report" | "suggestion";
    data: any;
  };
}

// Interfaces para os componentes do assistente
interface ChatBubbleProps {
  message: Message;
  onFeedback?: (id: string, type: "positive" | "negative") => void;
}

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

// Componente de bolha de chat melhorado
const ChatBubble = ({ message, onFeedback }: ChatBubbleProps) => {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);
  const messageLength = message.content.length;
  const isLongMessage = messageLength > 300;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2">
          <Avatar className="h-8 w-8 border border-primary/20">
            <AvatarImage src="/maria-assistant.png" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              MF
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div 
        className={cn(
          "max-w-[85%] p-3 rounded-lg shadow-sm",
          isUser ? 
            "bg-primary text-primary-foreground rounded-tr-none" : 
            "bg-muted/70 border border-border/50 rounded-tl-none"
        )}
      >
        <div className={`text-sm mb-2 ${isLongMessage && !expanded ? 'line-clamp-4' : ''}`}>
          {message.content}
        </div>
        
        {isLongMessage && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-2 py-0 h-6 text-xs" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? t("aiAssistant.showLess", "Mostrar menos") : t("aiAssistant.showMore", "Mostrar mais")}
          </Button>
        )}
        
        {message.context && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              {message.context.type === "property" && <Home className="h-3 w-3" />}
              {message.context.type === "reservation" && <Calendar className="h-3 w-3" />}
              {message.context.type === "report" && <BarChart className="h-3 w-3" />}
              {message.context.type === "suggestion" && <LightbulbIcon className="h-3 w-3" />}
              {message.context.type === "property" && t("aiAssistant.contextProperty", "Propriedade")}
              {message.context.type === "reservation" && t("aiAssistant.contextReservation", "Reserva")}
              {message.context.type === "report" && t("aiAssistant.contextReport", "Relatório")}
              {message.context.type === "suggestion" && t("aiAssistant.contextSuggestion", "Sugestão")}
            </Badge>
          </div>
        )}
        
        <div className="text-xs opacity-70 flex items-center justify-between mt-1">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatTime(message.timestamp)}
          </div>
          
          {!isUser && message.id && onFeedback && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => onFeedback(message.id!, "positive")}
                >
                  <ThumbsUp className={cn("h-3 w-3", message.feedback === "positive" ? "text-green-500 fill-green-500" : "")} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => onFeedback(message.id!, "negative")}
                >
                  <ThumbsDown className={cn("h-3 w-3", message.feedback === "negative" ? "text-red-500 fill-red-500" : "")} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-2">
          <Avatar className="h-8 w-8 border border-primary/20">
            <AvatarImage src="/user-avatar.png" />
            <AvatarFallback className="bg-primary/10 text-primary">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </motion.div>
  );
};

// Componente para sugestões aprimorado
const SuggestionCard = ({ icon, title, description, onClick, gradient = "from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30" }: SuggestionCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`cursor-pointer rounded-xl p-4 shadow-sm border border-border/40 bg-gradient-to-br ${gradient}`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="mr-3 rounded-full bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
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
  
  // Estado das mensagens
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: t("aiAssistant.welcomeMessage", "Olá! Sou a Maria, assistente inteligente da plataforma Maria Faz. Como posso ajudar hoje?"), 
      timestamp: new Date(),
      id: generateId()
    }
  ]);

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
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Função para enviar mensagem ao assistente com Mistral AI
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Adiciona mensagem do usuário
    const userMessage: Message = { 
      role: "user", 
      content: message, 
      timestamp: new Date(),
      id: generateId()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setMessage("");
    
    try {
      // Se não tiver a chave da API, use uma mensagem padrão
      if (!hasMistralKey) {
        setTimeout(() => {
          const assistantMessage: Message = { 
            role: "assistant", 
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
          message: message,
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
        if (data.context.type === "property" && properties) {
          const property = properties.find(p => p.id === data.context.propertyId);
          if (property) {
            context = {
              type: "property",
              data: property
            };
          }
        } else if (data.context.type === "reservation" && reservations) {
          const reservation = reservations.find(r => r.id === data.context.reservationId);
          if (reservation) {
            context = {
              type: "reservation",
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
        role: "assistant", 
        content: data.reply || t("aiAssistant.errorMessage", "Desculpe, não consegui processar sua solicitação."), 
        timestamp: new Date(),
        id: generateId(),
        context
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
        role: "assistant", 
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
        role: "assistant", 
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
      { id: "b2", text: t("aiAssistant.suggestions.business.performance", "Qual propriedade teve o melhor desempenho?") },
      { id: "b3", text: t("aiAssistant.suggestions.business.occupancy", "Qual é a taxa de ocupação das propriedades?") },
      { id: "b4", text: t("aiAssistant.suggestions.business.trends", "Quais são as tendências de receita?") },
    ],
    properties: [
      { id: "p1", text: t("aiAssistant.suggestions.properties.list", "Lista das minhas propriedades") },
      { id: "p2", text: t("aiAssistant.suggestions.properties.maintenance", "Existem manutenções pendentes?") },
      { id: "p3", text: t("aiAssistant.suggestions.properties.cleaning", "Quando foi a última limpeza?") },
      { id: "p4", text: t("aiAssistant.suggestions.properties.recommendations", "Como melhorar minhas propriedades?") },
    ],
    reservations: [
      { id: "r1", text: t("aiAssistant.suggestions.reservations.upcoming", "Próximos check-ins agendados") },
      { id: "r2", text: t("aiAssistant.suggestions.reservations.cancellations", "Houve cancelamentos recentes?") },
      { id: "r3", text: t("aiAssistant.suggestions.reservations.availability", "Qual é a disponibilidade para o próximo mês?") },
      { id: "r4", text: t("aiAssistant.suggestions.reservations.longestStay", "Qual foi a estadia mais longa?") },
    ],
    assistant: [
      { id: "a1", text: t("aiAssistant.suggestions.assistant.personality", "Que tipo de personalidade você tem?") },
      { id: "a2", text: t("aiAssistant.suggestions.assistant.capabilities", "O que você pode fazer por mim?") },
      { id: "a3", text: t("aiAssistant.suggestions.assistant.dataSource", "De onde vêm suas informações?") },
      { id: "a4", text: t("aiAssistant.suggestions.assistant.improvement", "Como posso dar feedback sobre você?") },
    ],
  };
  
  // Sugestões rápidas para o chat
  const suggestions = [
    { 
      id: "s1", 
      icon: <BarChart className="h-4 w-4" />, 
      title: t("aiAssistant.quickSuggestions.analytics", "Análises de Desempenho"), 
      description: t("aiAssistant.quickSuggestions.analyticsDesc", "Descubra o desempenho dos seus negócios"),
      gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30"
    },
    { 
      id: "s2", 
      icon: <Home className="h-4 w-4" />, 
      title: t("aiAssistant.quickSuggestions.properties", "Gestão de Propriedades"), 
      description: t("aiAssistant.quickSuggestions.propertiesDesc", "Informações sobre suas propriedades"),
      gradient: "from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30"
    },
    { 
      id: "s3", 
      icon: <FileQuestion className="h-4 w-4" />, 
      title: t("aiAssistant.quickSuggestions.help", "Ajuda & Tutoriais"), 
      description: t("aiAssistant.quickSuggestions.helpDesc", "Aprenda como usar a plataforma"),
      gradient: "from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30"
    },
    { 
      id: "s4", 
      icon: <Tag className="h-4 w-4" />, 
      title: t("aiAssistant.quickSuggestions.market", "Tendências de Mercado"), 
      description: t("aiAssistant.quickSuggestions.marketDesc", "Informações sobre o mercado"),
      gradient: "from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30"
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
    setMessage(text);
    if (activeTab !== "chat") {
      setActiveTab("chat");
    }
  };
  
  const handleQuickSuggestionClick = (id: string) => {
    let suggestionText = "";
    
    switch (id) {
      case "s1":
        suggestionText = t("aiAssistant.quickPrompts.analytics", "Mostra-me um resumo do desempenho das minhas propriedades este mês.");
        break;
      case "s2":
        suggestionText = t("aiAssistant.quickPrompts.properties", "Quais propriedades precisam de manutenção ou atenção?");
        break;
      case "s3":
        suggestionText = t("aiAssistant.quickPrompts.help", "Como posso melhorar a taxa de ocupação das minhas propriedades?");
        break;
      case "s4":
        suggestionText = t("aiAssistant.quickPrompts.market", "Quais são as tendências atuais de preços no mercado de aluguel de curta duração?");
        break;
    }
    
    setMessage(suggestionText);
    setActiveTab("chat");
  };
  
  // Limpar conversa
  const clearConversation = () => {
    setMessages([
      { 
        role: "assistant", 
        content: t("aiAssistant.welcomeMessage", "Olá! Sou a Maria, assistente inteligente da plataforma Maria Faz. Como posso ajudar hoje?"), 
        timestamp: new Date(),
        id: generateId()
      }
    ]);
    
    toast({
      title: t("aiAssistant.conversationCleared", "Conversa reiniciada"),
      description: t("aiAssistant.conversationClearedDesc", "Sua conversa anterior foi apagada."),
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
                  {t("aiAssistant.uploadDocument", "Anexar documento")}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("aiAssistant.tabs.chat", "Chat")}
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LightbulbIcon className="h-4 w-4 mr-2" />
                {t("aiAssistant.tabs.suggestions", "Sugestões")}
              </TabsTrigger>
              {isMobile && (
                <TabsTrigger value="tools" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Settings className="h-4 w-4 mr-2" />
                  {t("aiAssistant.tabs.tools", "Ferramentas")}
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
                        {t("aiAssistant.chatTitle", "Maria Faz Assistant")}
                      </CardTitle>
                      <CardDescription>{t("aiAssistant.chatDescription", "Pergunte sobre suas propriedades, reservas e relatórios")}</CardDescription>
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
                        {messages.map((msg, index) => (
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
                      title={t("aiAssistant.attachFile", "Anexar arquivo")}
                      disabled={isLoading}
                    >
                      <UploadCloud className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    
                    <Input 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t("aiAssistant.placeholder", "Digite sua mensagem aqui...")}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    
                    <Button 
                      onClick={sendMessage} 
                      disabled={!message.trim() || isLoading}
                      size="icon"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    
                    {/* Input oculto para upload de arquivo */}
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
                    <TabsList className="mb-4 grid grid-cols-4 h-auto">
                      <TabsTrigger value="business" className="text-xs">
                        <BarChart className="h-3 w-3 mr-1" />
                        {t("aiAssistant.categories.business", "Negócios")}
                      </TabsTrigger>
                      <TabsTrigger value="properties" className="text-xs">
                        <Home className="h-3 w-3 mr-1" />
                        {t("aiAssistant.categories.properties", "Propriedades")}
                      </TabsTrigger>
                      <TabsTrigger value="reservations" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {t("aiAssistant.categories.reservations", "Reservas")}
                      </TabsTrigger>
                      <TabsTrigger value="assistant" className="text-xs">
                        <Bot className="h-3 w-3 mr-1" />
                        {t("aiAssistant.categories.assistant", "Assistente")}
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
            
            {isMobile && (
              <TabsContent value="tools" className="m-0">
                <Card className="h-[calc(100vh-14rem)]">
                  <CardHeader>
                    <CardTitle>{t("aiAssistant.tools.title", "Ferramentas")}</CardTitle>
                    <CardDescription>{t("aiAssistant.tools.description", "Ações e configurações do assistente")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={clearConversation}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t("aiAssistant.clearConversation", "Limpar conversa")}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={triggerFileUpload}
                    >
                      <UploadCloud className="h-4 w-4 mr-2" />
                      {t("aiAssistant.uploadDocument", "Anexar documento")}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        
        <div className="hidden md:block">
          {/* Card de contexto - Sugestões rápidas */}
          <div className="space-y-6">
            <ContextCard
              title={t("aiAssistant.quickSuggestions.title", "Sugestões Rápidas")}
              icon={<LightbulbIcon className="h-4 w-4 text-amber-500" />}
            >
              <div className="grid grid-cols-1 gap-3">
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
            </ContextCard>
            
            {/* Card de contexto - Informações */}
            <ContextCard
              title={t("aiAssistant.features.title", "Recursos")}
              icon={<BadgeInfo className="h-4 w-4 text-blue-500" />}
            >
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <Gauge className="h-4 w-4 mr-2 mt-0.5 text-emerald-500" />
                  <span>{t("aiAssistant.features.analytics", "Análises de desempenho e estatísticas em tempo real")}</span>
                </li>
                <li className="flex items-start">
                  <FileQuestion className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                  <span>{t("aiAssistant.features.recommendations", "Recomendações personalizadas baseadas em dados")}</span>
                </li>
                <li className="flex items-start">
                  <Search className="h-4 w-4 mr-2 mt-0.5 text-violet-500" />
                  <span>{t("aiAssistant.features.knowledgebase", "Acesso à base de conhecimento e FAQs")}</span>
                </li>
                <li className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
                  <span>{t("aiAssistant.features.documents", "Processamento inteligente de documentos")}</span>
                </li>
              </ul>
            </ContextCard>
          </div>
        </div>
      </div>
    </div>
  );
}