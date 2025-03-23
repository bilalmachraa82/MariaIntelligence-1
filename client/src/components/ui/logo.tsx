import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

/**
 * Componente Logo oficial do Maria Faz
 * Pode ser usado em diferentes tamanhos e com ou sem texto
 */
export function Logo({ className, size = "md", showText = true }: LogoProps) {
  // Definir tamanhos baseado na prop size
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Temporariamente usando um placeholder de logo enquanto resolvemos o problema de importação */}
      <div 
        className={cn("bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold", sizes[size])}
        style={{ aspectRatio: "1/1", width: "auto" }}
      >
        M
      </div>
      {showText && (
        <span className={cn("font-semibold hidden sm:inline-block", textSizes[size])}>
          Maria Faz
        </span>
      )}
    </div>
  );
}