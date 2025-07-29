import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InspirationQuote } from "@/components/ui/inspiration-quote";

/**
 * Interface para propriedades do componente StatsCardWithQuote
 */
interface StatsCardWithQuoteProps {
  /** Título do cartão */
  title: string;
  /** Descrição opcional do cartão */
  description?: string;
  /** Contexto para selecionar citações relevantes */
  quoteContext: "dashboard" | "reservations" | "properties" | "finance" | "reports" | "general";
  /** Conteúdo principal do cartão (valor, gráfico, etc.) */
  children: ReactNode;
  /** Classes CSS adicionais para o card */
  className?: string;
}

/**
 * Componente de cartão de estatísticas com citação motivacional
 * Combina a exibição de estatísticas com mensagens inspiradoras contextuais
 */
export function StatsCardWithQuote({
  title,
  description,
  quoteContext,
  children,
  className = "",
}: StatsCardWithQuoteProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Conteúdo principal (estatísticas, valores, etc.) */}
          <div>{children}</div>
          
          {/* Separador sutil */}
          <div className="h-px bg-muted/50 w-full my-2" />
          
          {/* Mensagem inspiradora */}
          <div className="pt-1">
            <InspirationQuote 
              context={quoteContext} 
              variant="minimal" 
              rotating={true}
              rotationInterval={20000}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}