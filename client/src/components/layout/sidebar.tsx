import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { normalizeUrl } from "@/lib/url-utils";
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
  Calculator,
  Menu,
  Database
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

  // Links principais - funcionalidades mais usadas diariamente
  const mainLinks: NavLink[] = [
    {
      title: "Início",
      href: isPortuguese ? "/painel" : "/dashboard",
      altHref: "/",
      icon: Home,
      description: "Visão geral do sistema",
    },
    {
      title: "Reservas",
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays,
      description: "Gestão de reservas e check-ins",
    },
    {
      title: "Propriedades",
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2,
      description: "Gestão de imóveis",
    },
    {
      title: "Proprietários",
      href: isPortuguese ? "/proprietarios" : "/owners",
      icon: UserCog,
      description: "Gestão de proprietários",
    },
    {
      title: "Relatórios",
      href: isPortuguese ? "/relatorios" : "/reports",
      icon: BarChart3,
      description: "Análises e estatísticas",
    },
  ];
  
  // Ferramentas e serviços (sem duplicações)
  const serviceLinks: NavLink[] = [
    {
      title: "Orçamentos",
      href: isPortuguese ? "/orcamentos" : "/quotations",
      icon: Calculator,
      description: "Orçamentos para serviços",
    },
    {
      title: "Equipas de Limpeza",
      href: isPortuguese ? "/equipas-limpeza" : "/cleaning-teams",
      icon: Brush,
      description: "Gestão de equipas",
    },
    {
      title: "Scanner",
      href: "/simple-ocr",
      icon: FileUp,
      description: "Digitalização de documentos",
    },
    {
      title: "Assistente IA",
      href: isPortuguese ? "/assistente" : "/assistant",
      icon: Bot,
      description: "Suporte inteligente",
    },
  ];
  
  // Configurações simplificadas
  const settingsLinks: NavLink[] = [
    {
      title: "Configurações",
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings,
      description: "Configurações gerais",
    },
  ];
  

  
  // Links para Desenvolvimento e Utilidades
  const utilityLinks: NavLink[] = [
    {
      title: t("navigation.demoData", "Dados Demo"),
      href: isPortuguese ? "/dados-demo" : "/demo-data",
      icon: Database,
      description: "Gerenciar dados para demonstração do sistema",
    },
  ];

  // Determina se um link está ativo (considerando também rotas alternativas)
  const isLinkActive = (linkHref: string, altHref?: string) => {
    // Normaliza os URLs antes de comparar usando nossa utilidade central
    const normalizedLocation = normalizeUrl(location);
    const normalizedLinkHref = normalizeUrl(linkHref);
    const normalizedAltHref = altHref ? normalizeUrl(altHref) : undefined;

    if (normalizedLocation === normalizedLinkHref) return true;
    if (normalizedAltHref && normalizedLocation === normalizedAltHref) return true;
    return false;
  };

  // Função para fechar a sidebar em dispositivos móveis após clicar em um link
  const handleLinkClick = (href: string) => {
    // Usa a função normalizeUrl do nosso utilitário para garantir URLs limpas
    const cleanHref = normalizeUrl(href);
    
    // Navega para a URL normalizada
    setLocation(cleanHref);
    
    // Em dispositivos móveis, fecha a barra lateral após clicar
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
          className="fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-full shadow-md"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-primary dark:text-primary-light" />
        </Button>
      )}

      {/* Barra lateral */}
      <aside
        className={cn(
          "transition-all duration-300 ease-in-out",
          isMobile 
            ? cn(
                "fixed inset-y-0 left-0 z-40 w-72 transform bg-white dark:bg-gray-900 shadow-lg",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )
            : "hidden md:flex md:w-64 flex-shrink-0 flex-col bg-white dark:bg-gray-900 border-r border-secondary-200 dark:border-gray-800",
          className
        )}
      >
        <div className="flex items-center justify-center h-16 border-b border-secondary-200 dark:border-gray-800">
          <h1 className="text-xl font-semibold text-primary-700 dark:text-primary">Maria Faz</h1>
        </div>
        
        {/* Frase inspiracional */}
        <div className="px-4 py-2 text-center">
          <p className="text-xs italic text-gray-500 dark:text-gray-400">
            "Limpeza é o primeiro passo para a felicidade." - Marie Kondo
          </p>
        </div>

        <ScrollArea className="flex-grow">
          <nav className="px-3 py-6 space-y-8">
            {/* Seção Principal */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("navigation.categories.main")}
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
                              : "text-maria-dark dark:text-white hover:bg-maria-primary-light hover:bg-opacity-30 dark:hover:bg-maria-primary dark:hover:bg-opacity-20"
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
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("navigation.categories.tools")}
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
                              : "text-maria-dark dark:text-white hover:bg-maria-accent-light hover:bg-opacity-30 dark:hover:bg-maria-accent dark:hover:bg-opacity-20"
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
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("navigation.categories.management")}
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
                              : "text-maria-dark dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
            
            {/* Seção Desenvolvimento/Utilidades */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                <Database className="mr-1 h-3 w-3" />
                {t("navigation.categories.utilities", "Utilidades")}
              </h3>
              <div className="mt-2 space-y-1">
                {utilityLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                              : "text-maria-dark dark:text-white hover:bg-purple-100 hover:bg-opacity-30 dark:hover:bg-purple-900 dark:hover:bg-opacity-20"
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

        <div className="p-4 border-t border-maria-primary-light border-opacity-30 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-maria-primary to-maria-accent flex items-center justify-center text-white font-semibold shadow-sm">
                  MF
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800 dark:text-white">Admin</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">admin@mariafaz.pt</p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-maria-primary hover:bg-opacity-10 dark:hover:bg-maria-primary dark:hover:bg-opacity-20"
                  >
                    <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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
