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
  Bot,
  FileUp,
  Brush,
  UserCog,
  LogOut,
  Menu
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Interface para Link com descrição
  interface NavLink {
    title: string;
    href: string;
    icon: React.ElementType;
    description: string;
    altHref?: string;
  }

  // Links dinâmicos baseados no idioma organizados por categoria
  const mainLinks: NavLink[] = [
    {
      title: t("navigation.dashboard"),
      href: isPortuguese ? "/painel" : "/dashboard",
      altHref: "/", // Ambos redirecionam para a mesma página
      icon: Home,
      description: "Visão geral do sistema",
    },
    {
      title: t("navigation.properties"),
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2,
      description: "Gerencie todas as propriedades",
    },
    {
      title: t("navigation.reservations"),
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays,
      description: "Controle suas reservas",
    },
    {
      title: t("navigation.owners"),
      href: isPortuguese ? "/proprietarios" : "/owners",
      icon: UserCog,
      description: "Gerenciar proprietários",
    },
  ];
  
  const toolsLinks: NavLink[] = [
    {
      title: t("navigation.pdfUpload"),
      href: isPortuguese ? "/upload-pdf" : "/pdf-upload",
      icon: FileUp,
      description: "Upload e processamento de PDFs",
    },
    {
      title: t("navigation.aiAssistant"),
      href: isPortuguese ? "/assistente" : "/assistant",
      icon: Bot,
      description: "Assistente inteligente Maria",
    },
  ];
  
  const managementLinks: NavLink[] = [
    {
      title: t("navigation.cleaningTeams"),
      href: isPortuguese ? "/equipas-limpeza" : "/cleaning-teams",
      icon: Brush,
      description: "Equipas de limpeza",
    },
    {
      title: t("navigation.reports"),
      href: isPortuguese ? "/relatorios" : "/reports",
      icon: BarChart3,
      description: "Estatísticas e relatórios",
    },
    {
      title: t("navigation.settings"),
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings,
      description: "Configurações do sistema",
    },
  ];

  // Determina se um link está ativo (considerando também rotas alternativas)
  const isLinkActive = (linkHref: string, altHref?: string) => {
    if (location === linkHref) return true;
    if (altHref && location === altHref) return true;
    return false;
  };

  // Função para fechar a sidebar em dispositivos móveis após clicar em um link
  const handleLinkClick = (href: string) => {
    setLocation(href);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Botão de menu para dispositivos móveis */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-white rounded-full shadow-md"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-maria-primary" />
        </Button>
      )}

      {/* Barra lateral */}
      <aside
        className={cn(
          "transition-all duration-300 ease-in-out",
          isMobile 
            ? cn(
                "fixed inset-y-0 left-0 z-40 w-72 transform bg-white shadow-lg",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )
            : "hidden md:flex md:w-64 flex-shrink-0 flex-col bg-white border-r border-secondary-200",
          className
        )}
      >
        <div className="flex items-center justify-center h-16 border-b border-secondary-200">
          <h1 className="text-xl font-semibold text-primary-700">Maria Faz</h1>
        </div>

        <ScrollArea className="flex-grow">
          <nav className="px-3 py-6 space-y-8">
            {/* Seção Principal */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-maria-gray uppercase tracking-wider">
                Principal
              </h3>
              <div className="mt-2 space-y-1">
                {mainLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-maria-primary-light to-maria-primary text-white"
                              : "text-maria-dark hover:bg-maria-primary-light hover:bg-opacity-30"
                          )}
                          onClick={() => handleLinkClick(link.href)}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          {link.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{link.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            
            {/* Seção Ferramentas */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-maria-gray uppercase tracking-wider">
                Ferramentas
              </h3>
              <div className="mt-2 space-y-1">
                {toolsLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-maria-accent-light to-maria-accent text-white"
                              : "text-maria-dark hover:bg-maria-accent-light hover:bg-opacity-30"
                          )}
                          onClick={() => handleLinkClick(link.href)}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          {link.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{link.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            
            {/* Seção Gestão */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-maria-gray uppercase tracking-wider">
                Gestão
              </h3>
              <div className="mt-2 space-y-1">
                {managementLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-maria-dark-light to-maria-dark text-white"
                              : "text-maria-dark hover:bg-gray-100"
                          )}
                          onClick={() => handleLinkClick(link.href)}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          {link.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{link.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-maria-primary-light border-opacity-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-maria-primary to-maria-accent flex items-center justify-center text-white font-semibold shadow-sm">
                  MF
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-maria-dark">Admin</p>
                <p className="text-xs font-medium text-maria-gray">admin@mariafaz.pt</p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-maria-primary hover:bg-opacity-10"
                  >
                    <LogOut className="h-4 w-4 text-maria-gray" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Terminar sessão</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </aside>
    </>
  );
}
