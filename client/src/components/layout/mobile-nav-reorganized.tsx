import React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Home,
  Building2,
  CalendarDays,
  ChartBar,
  ReceiptText,
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
      icon: Home
    },
    {
      name: t("navigation.properties", "Imóveis"),
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2
    },
    {
      name: t("navigation.bookings", "Reservas"),
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays
    },
    {
      name: t("navigation.reports.financial", "Finanças"),
      href: isPortuguese ? "/relatorios/proprietario" : "/reports/owner-report",
      icon: ChartBar
    },
    {
      name: t("navigation.operations", "Operações"),
      href: isPortuguese ? "/equipas-limpeza" : "/cleaning-teams",
      icon: HardHat
    }
  ];

  // Determina se um link está ativo
  const isActive = (href: string, altHref?: string) => {
    if (location === href) return true;
    if (altHref && location === altHref) return true;
    
    // Verifica subpáginas
    if (location.startsWith(`${href}/`)) return true;
    
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-secondary-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.href}
            className={cn(
              "flex flex-col items-center justify-center px-1 py-1 rounded-md w-1/5",
              isActive(item.href, item.altHref)
                ? "text-primary dark:text-primary-light"
                : "text-secondary-500 dark:text-secondary-400"
            )}
            onClick={() => navigate(item.href)}
          >
            <item.icon
              className={cn(
                "w-5 h-5 mb-1",
                isActive(item.href, item.altHref)
                  ? "text-primary dark:text-primary-light"
                  : "text-secondary-500 dark:text-secondary-400"
              )}
            />
            <span className="text-[10px] font-medium truncate">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}