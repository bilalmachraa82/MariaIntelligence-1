import React from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Home,
  Calendar,
  Building2,
  Euro,
  Settings
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function BottomNavSimplified() {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");

  const checkIfActive = (href: string) => {
    if (href === "/" || href === "/painel" || href === "/dashboard") {
      return location === "/" || location === "/painel" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  // 5 itens principais para navegação móvel
  const navItems: NavItem[] = [
    {
      name: "Início",
      href: isPortuguese ? "/painel" : "/dashboard",
      icon: Home
    },
    {
      name: "Reservas",
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: Calendar
    },
    {
      name: "Imóveis",
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2
    },
    {
      name: "Finanças",
      href: "/pagamentos/entrada",
      icon: Euro
    },
    {
      name: "Config",
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = checkIfActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive 
                  ? "text-primary bg-secondary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 mb-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}