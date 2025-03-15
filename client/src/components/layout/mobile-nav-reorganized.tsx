import React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Home,
  Building2,
  CalendarDays,
  BarChart3,
  LayoutGrid,
  Bot,
  Settings,
  BadgeDollarSign,
  HardHat
} from "lucide-react";

export function MobileNavReorganized() {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");

  const navItems = [
    {
      name: t("navigation.home", "Home"),
      href: isPortuguese ? "/painel" : "/dashboard",
      altHref: "/",
      icon: Home,
      color: "text-blue-500"
    },
    {
      name: t("navigation.properties", "Imóveis"),
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2,
      color: "text-indigo-500"
    },
    {
      name: t("navigation.bookings", "Reservas"),
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays,
      color: "text-purple-500"
    },
    {
      name: t("navigation.reports.financial", "Finanças"),
      href: isPortuguese ? "/relatorios/proprietario" : "/reports/owner-report",
      icon: BadgeDollarSign,
      color: "text-green-500"
    },
    {
      name: t("navigation.operations", "Operações"),
      href: isPortuguese ? "/equipas-limpeza" : "/cleaning-teams",
      icon: HardHat,
      color: "text-amber-500"
    }
  ];

  // Determina se um link está ativo
  const isActive = (href: string, altHref?: string) => {
    if (location === href) return true;
    if (altHref && location === altHref) return true;
    
    // Verifica subpáginas
    if (location.startsWith(`${href}/`)) return true;
    
    // Verifica padrões específicos para seções
    if (href.includes('financeiro') || href.includes('owner-report')) {
      return location.includes('relatorios') || location.includes('reports') || 
             location.includes('pagamentos') || location.includes('payments');
    }
    
    if (href.includes('limpeza') || href.includes('cleaning')) {
      return location.includes('limpeza') || location.includes('cleaning') || 
             location.includes('manutencao') || location.includes('maintenance');
    }
    
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden shadow-lg">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item.href, item.altHref);
          return (
            <button
              key={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-1 rounded-md w-1/5 transition-all duration-200",
                active 
                  ? cn("scale-110", item.color) 
                  : "text-gray-500 dark:text-gray-400"
              )}
              onClick={() => navigate(item.href)}
            >
              <div 
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full mb-1",
                  active 
                    ? cn("bg-white dark:bg-gray-800 shadow-md", item.color) 
                    : "bg-transparent"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    active 
                      ? item.color
                      : "text-gray-500 dark:text-gray-400"
                  )}
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium truncate",
                active ? "font-semibold" : ""
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Indicator for safe area on iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-900" />
    </div>
  );
}