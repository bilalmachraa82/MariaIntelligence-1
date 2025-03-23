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
      <img 
        src="/logo.png" 
        alt="Maria Faz Logo" 
        className={cn("object-contain", sizes[size])}
      />
      {showText && (
        <span className={cn("font-semibold hidden sm:inline-block", textSizes[size])}>
          Maria Faz
        </span>
      )}
    </div>
  );
}