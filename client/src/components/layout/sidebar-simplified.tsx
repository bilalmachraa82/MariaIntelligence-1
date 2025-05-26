import React from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Calendar,
  Building2,
  Users,
  Euro,
  PiggyBank,
  FileText,
  BarChart3,
  FileUp,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wrench
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export function SidebarSimplified({ collapsed, onToggleCollapse, isMobile = false }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");

  const checkIfActive = (href: string) => {
    if (href === "/" || href === "/painel" || href === "/dashboard") {
      return location === "/" || location === "/painel" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  // Menu principal - 7 itens essenciais
  const mainNavItems: NavItem[] = [
    {
      name: "Início",
      href: isPortuguese ? "/painel" : "/dashboard",
      icon: Home,
      iconColor: "text-blue-500"
    },
    {
      name: "Reservas",
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: Calendar,
      iconColor: "text-purple-500"
    },
    {
      name: "Imóveis",
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2,
      iconColor: "text-indigo-500"
    },
    {
      name: "Proprietários",
      href: isPortuguese ? "/proprietarios" : "/owners",
      icon: Users,
      iconColor: "text-orange-500"
    },

    {
      name: "Finanças",
      href: "/pagamentos/entrada",
      icon: Euro,
      iconColor: "text-green-500"
    },
    {
      name: "Relatórios",
      href: isPortuguese ? "/relatorios" : "/reports",
      icon: BarChart3,
      iconColor: "text-emerald-500"
    }
  ];

  // Ferramentas - 3 itens principais
  const toolsNavItems: NavItem[] = [
    {
      name: "Scanner",
      href: "/simple-ocr",
      icon: FileUp,
      iconColor: "text-rose-500"
    },
    {
      name: "Maria IA",
      href: isPortuguese ? "/assistente" : "/assistant",
      icon: Bot,
      iconColor: "text-violet-500"
    },
    {
      name: "Configurações",
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings,
      iconColor: "text-gray-500"
    }
  ];

  const SidebarItem = ({ icon: Icon, name, href, iconColor }: NavItem) => {
    const isActive = checkIfActive(href);
    
    return (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start h-10 px-3",
          collapsed && "px-2 justify-center",
          isActive && "bg-secondary text-secondary-foreground"
        )}
        onClick={() => navigate(href)}
      >
        <Icon className={cn(
          "h-4 w-4",
          collapsed ? "mx-0" : "mr-3",
          isActive ? "text-primary" : iconColor
        )} />
        {!collapsed && <span className="truncate">{name}</span>}
      </Button>
    );
  };

  // Versão colapsada (apenas ícones)
  if (collapsed) {
    return (
      <aside className="fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-[60px] border-r border-border bg-background">
        <div className="flex h-full flex-col">
          <div className="flex flex-col items-center justify-center py-2 border-b border-border">
            <img 
              src="/logo.png" 
              alt="Maria Faz Logo" 
              className="h-8 w-auto mb-1" 
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mt-1"
              onClick={onToggleCollapse}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            <div className="space-y-1 px-2">
              {mainNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={checkIfActive(item.href) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn(
                    "h-4 w-4", 
                    checkIfActive(item.href) ? "text-primary" : item.iconColor
                  )} />
                </Button>
              ))}
              
              <Separator className="my-2" />
              
              {toolsNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={checkIfActive(item.href) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn(
                    "h-4 w-4", 
                    checkIfActive(item.href) ? "text-primary" : item.iconColor
                  )} />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Versão expandida
  return (
    <aside className={cn(
      !isMobile && "fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-[240px] border-r border-border",
      "bg-background"
    )}>
      <div className="flex h-full flex-col">
        {!isMobile && (
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Maria Faz Logo" 
                className="h-7 w-auto mr-2" 
              />
              <span className="text-sm font-semibold">Maria Faz</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <ScrollArea className="flex-1 py-4">
          <div className="px-3 space-y-1">
            {/* Menu Principal */}
            <div className="mb-6">
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Principal
              </h3>
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <SidebarItem key={item.href} {...item} />
                ))}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* Ferramentas */}
            <div>
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ferramentas
              </h3>
              <div className="space-y-1">
                {toolsNavItems.map((item) => (
                  <SidebarItem key={item.href} {...item} />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}