import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  Home,
  Calendar,
  BarChart,
  Lightbulb as LightbulbIcon
} from "lucide-react";

// Interface para mensagens (exportada para uso em outros componentes)
export interface Message {
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

interface ChatBubbleProps {
  message: Message;
  onFeedback?: (id: string, type: "positive" | "negative") => void;
}

/**
 * Componente ChatBubble aprimorado com suporte a Markdown
 * Inclui limite de caracteres configurável com opção de expandir
 * Suporta feedback do usuário (positivo/negativo)
 * Exibe contexto quando disponível (propriedade, reserva, etc.)
 */
export const ChatBubble = ({ message, onFeedback }: ChatBubbleProps) => {
  const { t } = useTranslation();
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);
  const messageLength = message.content.length;
  
  // Aumento do limite de caracteres antes do truncamento (de 300 para 600)
  const isLongMessage = messageLength > 600;
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Componentes personalizados para o ReactMarkdown
  const markdownComponents = {
    // Estilização para listas
    ul: (props: any) => <ul className="list-disc pl-6 my-2" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-6 my-2" {...props} />,
    li: (props: any) => <li className="my-1" {...props} />,
    
    // Estilização para links
    a: (props: any) => (
      <a 
        className="text-primary underline hover:text-primary/80 transition-colors" 
        target="_blank" 
        rel="noopener noreferrer" 
        {...props}
      />
    ),
    
    // Estilização para cabeçalhos
    h1: (props: any) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
    h2: (props: any) => <h2 className="text-md font-bold mt-3 mb-2" {...props} />,
    h3: (props: any) => <h3 className="font-bold mt-2 mb-1" {...props} />,
    
    // Estilização para código e blocos de código
    code: (props: any) => (
      <code className="bg-muted rounded px-1 py-0.5 text-sm font-mono" {...props} />
    ),
    pre: (props: any) => (
      <pre className="bg-muted p-2 rounded-md my-2 overflow-x-auto text-sm font-mono" {...props} />
    ),
    
    // Estilização para tabelas (se houver)
    table: (props: any) => <table className="border-collapse my-3 w-full" {...props} />,
    thead: (props: any) => <thead className="bg-muted/50" {...props} />,
    th: (props: any) => <th className="border border-border p-1 text-sm" {...props} />,
    td: (props: any) => <td className="border border-border p-1 text-sm" {...props} />,
    
    // Estilização para parágrafos e outros elementos
    p: (props: any) => <p className="my-2" {...props} />,
    blockquote: (props: any) => (
      <blockquote className="border-l-4 border-primary/30 pl-3 italic my-2" {...props} />
    ),
    hr: () => <hr className="my-4 border-border" />,
    
    // Enfatização de texto
    em: (props: any) => <em className="italic" {...props} />,
    strong: (props: any) => <strong className="font-bold" {...props} />,
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
        <div className={`text-sm mb-2 prose dark:prose-invert prose-sm max-w-none ${isLongMessage && !expanded ? 'line-clamp-8' : ''}`}>
          {isUser ? (
            <div>{message.content}</div>
          ) : (
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          )}
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
                  <ThumbsUp className={cn(
                    "h-3 w-3", 
                    message.feedback === "positive" ? "text-green-500 fill-green-500" : ""
                  )} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => onFeedback(message.id!, "negative")}
                >
                  <ThumbsDown className={cn(
                    "h-3 w-3", 
                    message.feedback === "negative" ? "text-red-500 fill-red-500" : ""
                  )} />
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