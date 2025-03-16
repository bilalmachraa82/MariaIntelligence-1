import React from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Home,
  Building2,
  CalendarDays,
  BadgeDollarSign,
  Bot
} from "lucide-react";

export function BottomNav() {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");
  
  // Define os itens mais importantes para navegação rápida
  const navItems = [
    {
      name: t("navigation.home", "Visão Geral"),
      href: isPortuguese ? "/painel" : "/dashboard",
      altHref: "/",
      icon: Home
    },
    {
      name: t("navigation.bookings", "Reservas"),
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays
    },
    {
      name: t("navigation.properties", "Imóveis"),
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2
    },
    {
      name: t("navigation.finances", "Finanças"),
      href: isPortuguese ? "/relatorios" : "/reports",
      icon: BadgeDollarSign
    },
    {
      name: t("navigation.assistant", "Maria IA"),
      href: isPortuguese ? "/assistente" : "/assistant",
      icon: Bot
    }
  ];

  // Verifica se um link está ativo
  const isActive = (href: string, altHref?: string) => {
    if (location === href) return true;
    if (altHref && location === altHref) return true;
    
    // Verifica subpáginas
    if (href !== "/" && location.startsWith(`${href}/`)) return true;
    
    // Casos específicos para finanças
    if ((href === "/relatorios" || href === "/reports") && 
        (location.includes("/relatorios") || location.includes("/reports") || 
         location.includes("/pagamentos") || location.includes("/payments") ||
         location.includes("/financeiro") || location.includes("/financial"))) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-40">
      <div className="grid grid-cols-5 h-full">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={cn(
              "flex flex-col items-center justify-center h-full p-1 w-full",
              isActive(item.href, item.altHref) 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 mb-1", 
              isActive(item.href, item.altHref) ? "text-primary" : ""
            )} />
            <span className="text-xs font-medium truncate max-w-full">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}