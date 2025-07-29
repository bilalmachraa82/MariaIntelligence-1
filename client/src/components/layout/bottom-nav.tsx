import React from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Home,
  Building2,
  CalendarDays,
  BadgeDollarSign,
  Bot,
  Search,
  FileText,
  ScanSearch,
  Settings,
  Brush
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
      name: t("navigation.reports.financial", "Relatórios"),
      href: isPortuguese ? "/relatorios" : "/reports",
      icon: FileText
    },
    {
      name: t("navigation.documentScan", "Scanner"),
      href: "/upload-pdf",
      altHref: "/pdf-upload",
      icon: ScanSearch
    },
    {
      name: t("navigation.settings", "Config."),
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings
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
    
    // Caso específico para scanner
    if ((href === "/digitalizar" || href === "/scan" || href === "/pdf-upload") &&
        (location.includes("/digitalizar") || location.includes("/scan") || 
         location.includes("/pdf-upload"))) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-40">
      <div className="grid grid-cols-5 h-full px-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.altHref);
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex flex-col items-center justify-center h-full p-1 w-full rounded-lg transition-all",
                active 
                  ? "text-primary bg-primary/5" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30 active:bg-muted/50"
              )}
            >
              <div className={cn(
                "rounded-full p-1.5 transition-all",
                active ? "bg-primary/10" : ""
              )}>
                <item.icon className={cn(
                  "h-5 w-5", 
                  active ? "text-primary" : ""
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium truncate max-w-full mt-0.5",
                active ? "font-semibold" : ""
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Indicador de versão móvel otimizada */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary/10 text-primary text-[9px] font-medium py-0.5 px-2 rounded-full">
        {t("navigation.mobileOptimized", "Mobile Otimizado")}
      </div>
    </div>
  );
}