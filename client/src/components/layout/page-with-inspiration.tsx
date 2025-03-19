import { ReactNode } from "react";
import { InspirationQuote } from "@/components/ui/inspiration-quote";

/**
 * Interface para propriedades do componente PageWithInspiration
 */
interface PageWithInspirationProps {
  /** Contexto para selecionar citações relevantes */
  context: "dashboard" | "reservations" | "properties" | "finance" | "reports" | "general";
  /** Variação visual da mensagem */
  quoteVariant?: "default" | "minimal" | "subtle" | "highlight";
  /** Posição da mensagem (antes ou depois do conteúdo) */
  quotePosition?: "before" | "after";
  /** Se verdadeiro, muda a citação a cada intervalo de tempo */
  rotating?: boolean;
  /** Classes CSS adicionais para o contenedor principal */
  className?: string;
  /** Conteúdo da página */
  children: ReactNode;
}

/**
 * Componente que adiciona mensagens inspiradoras a uma página
 * Este componente pode ser usado como um wrapper para qualquer página
 * onde se deseja adicionar mensagens inspiradoras
 */
export function PageWithInspiration({
  context = "general",
  quoteVariant = "default",
  quotePosition = "before",
  rotating = false,
  className = "",
  children
}: PageWithInspirationProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Exibe a citação antes do conteúdo se quotePosition for "before" */}
      {quotePosition === "before" && (
        <InspirationQuote 
          context={context} 
          variant={quoteVariant} 
          rotating={rotating} 
        />
      )}
      
      {/* Conteúdo principal */}
      {children}
      
      {/* Exibe a citação depois do conteúdo se quotePosition for "after" */}
      {quotePosition === "after" && (
        <InspirationQuote 
          context={context} 
          variant={quoteVariant} 
          rotating={rotating} 
        />
      )}
    </div>
  );
}