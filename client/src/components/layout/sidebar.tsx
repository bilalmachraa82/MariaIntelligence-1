import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building2, 
  CalendarDays, 
  Users, 
  BarChart3, 
  Settings,
  Bot 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");

  // Links dinâmicos baseados no idioma
  const links = [
    {
      title: t("navigation.dashboard"),
      href: isPortuguese ? "/painel" : "/dashboard",
      altHref: "/", // Ambos redirecionam para a mesma página
      icon: Home,
    },
    {
      title: t("navigation.properties"),
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2,
    },
    {
      title: t("navigation.reservations"),
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays,
    },
    {
      title: t("navigation.owners"),
      href: isPortuguese ? "/proprietarios" : "/owners",
      icon: Users,
    },
    {
      title: t("navigation.reports"),
      href: isPortuguese ? "/relatorios" : "/reports",
      icon: BarChart3,
    },
    {
      title: t("navigation.aiAssistant"),
      href: isPortuguese ? "/assistente" : "/assistant",
      icon: Bot,
    },
    {
      title: t("navigation.settings"),
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings,
    },
  ];

  // Determina se um link está ativo (considerando também rotas alternativas)
  const isLinkActive = (linkHref: string, altHref?: string) => {
    if (location === linkHref) return true;
    if (altHref && location === altHref) return true;
    return false;
  };

  return (
    <aside
      className={cn(
        "hidden md:flex md:w-64 flex-shrink-0 flex-col bg-white border-r border-secondary-200",
        className
      )}
    >
      <div className="flex items-center justify-center h-16 border-b border-secondary-200">
        <h1 className="text-xl font-semibold text-primary-700">Maria Faz</h1>
      </div>

      <ScrollArea className="flex-grow">
        <nav className="px-2 py-4 space-y-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md group",
                  isLinkActive(link.href, link.altHref)
                    ? "bg-primary-50 text-primary-700"
                    : "text-secondary-700 hover:bg-secondary-100"
                )}
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.title}
              </a>
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-secondary-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-semibold">
              MF
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-secondary-700">Admin</p>
            <p className="text-xs font-medium text-secondary-500">admin@mariafaz.pt</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
