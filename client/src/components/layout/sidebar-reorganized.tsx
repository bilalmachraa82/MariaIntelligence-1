import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building2, 
  CalendarDays, 
  Users, 
  ChartBar, 
  Settings,
  Bot,
  FileUp,
  Brush,
  LogOut,
  Menu,
  Wrench,
  ReceiptText,
  CreditCard,
  Banknote,
  Database,
  BarChart4,
  FileText,
  HardHat,
  Wallet,
  ScrollText
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
}

export function SidebarReorganized({ className }: SidebarProps) {
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
    badge?: string; // Para indicadores como "Novo"
  }

  // Links dinâmicos baseados no idioma - CORE (essenciais e mais usados)
  const coreLinks: NavLink[] = [
    {
      title: t("navigation.dashboard"),
      href: isPortuguese ? "/painel" : "/dashboard",
      altHref: "/", // Ambos redirecionam para a mesma página
      icon: Home,
      description: "Visão geral rápida do sistema",
    },
    {
      title: t("navigation.properties", "Imóveis"),
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2,
      description: "Gerenciar propriedades",
    },
    {
      title: t("navigation.bookings", "Reservas"),
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays,
      description: "Gerenciar reservas e calendário",
    },
  ];
  
  // FINANÇAS (tudo relacionado a dinheiro)
  const financeLinks: NavLink[] = [
    {
      title: t("navigation.reports.financial", "Financeiro"),
      href: isPortuguese ? "/relatorios/proprietario" : "/reports/owner-report",
      icon: ChartBar,
      description: "Resumo financeiro completo",
    },
    {
      title: t("navigation.reports.invoices", "Faturas"),
      href: isPortuguese ? "/relatorios/faturacao-mensal" : "/reports/monthly-invoice",
      icon: ReceiptText,
      description: "Faturação mensal",
    },
    {
      title: t("navigation.payments.income", "Entradas"),
      href: isPortuguese ? "/pagamentos/entrada" : "/payments/incoming",
      icon: Wallet,
      description: "Pagamentos recebidos",
    },
    {
      title: t("navigation.payments.expenses", "Saídas"),
      href: isPortuguese ? "/pagamentos/saida" : "/payments/outgoing",
      icon: CreditCard,
      description: "Pagamentos a fornecedores",
    }
  ];
  
  // OPERAÇÕES (processos de trabalho)
  const operationsLinks: NavLink[] = [
    {
      title: t("navigation.cleaning", "Limpeza"),
      href: isPortuguese ? "/equipas-limpeza" : "/cleaning-teams",
      icon: Brush,
      description: "Gestão de equipas de limpeza",
    },
    {
      title: t("navigation.maintenance", "Manutenção"),
      href: isPortuguese ? "/manutencao/pendentes" : "/maintenance/pending",
      icon: HardHat,
      description: "Tarefas de manutenção",
    },
    {
      title: t("navigation.owners", "Proprietários"),
      href: isPortuguese ? "/proprietarios" : "/owners",
      icon: Users,
      description: "Gestão de proprietários",
    }
  ];
  
  // FERRAMENTAS (auxiliares)
  const toolsLinks: NavLink[] = [
    {
      title: t("navigation.assistant", "Maria IA"),
      href: isPortuguese ? "/assistente" : "/assistant",
      icon: Bot,
      description: "Assistente virtual inteligente",
      badge: "AI"
    },
    {
      title: t("navigation.documents", "Documentos"),
      href: isPortuguese ? "/upload-pdf" : "/pdf-upload",
      icon: FileUp,
      description: "Upload e processamento de documentos",
    },
    {
      title: t("navigation.reports.analytics", "Análises"),
      href: isPortuguese ? "/relatorios/tendencias" : "/reports/trends",
      icon: BarChart4,
      description: "Análises e tendências avançadas",
    },
  ];
  
  // CONFIGURAÇÕES (raramente acessadas)
  const settingsLinks: NavLink[] = [
    {
      title: t("navigation.settings", "Configurações"),
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings,
      description: "Configurações do sistema",
    },
    {
      title: t("navigation.demoData", "Dados Demo"),
      href: isPortuguese ? "/dados-demo" : "/demo-data",
      icon: Database,
      description: "Gerenciar dados para demonstração",
    },
  ];

  // Determina se um link está ativo (considerando também rotas alternativas)
  const isLinkActive = (linkHref: string, altHref?: string) => {
    if (location === linkHref) return true;
    if (altHref && location === altHref) return true;
    
    // Verificar subpáginas (quando estiver em uma página filha da rota pai)
    const isSubpage = location.startsWith(linkHref + "/");
    return isSubpage;
  };

  // Função para fechar a sidebar em dispositivos móveis após clicar em um link
  const handleLinkClick = (href: string) => {
    // Remover barras duplicadas, se houverem
    const cleanHref = href.replace(/([^:]\/)\/+/g, "$1");
    setLocation(cleanHref);
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
                "fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-gray-900 shadow-lg",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )
            : "hidden md:flex md:w-56 flex-shrink-0 flex-col bg-white dark:bg-gray-900 border-r border-secondary-200 dark:border-gray-800",
          className
        )}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-center h-16 border-b border-secondary-200 dark:border-gray-800">
          <h1 className="text-xl font-semibold text-primary-700 dark:text-primary">Maria Faz</h1>
        </div>

        <ScrollArea className="flex-grow">
          <nav className="px-2 py-4 space-y-6">
            {/* Seção CORE */}
            <div>
              <div className="mt-1 space-y-1">
                {coreLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-maria-primary-light to-maria-primary text-white"
                              : "text-maria-dark dark:text-white hover:bg-maria-primary-light hover:bg-opacity-20 dark:hover:bg-maria-primary dark:hover:bg-opacity-20"
                          )}
                          onClick={() => handleLinkClick(link.href)}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          <span className="truncate">{link.title}</span>
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
            
            {/* Seção FINANÇAS */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                <Banknote className="mr-1 h-3 w-3" />
                {t("navigation.categories.finances", "Finanças")}
              </h3>
              <div className="mt-1 space-y-1">
                {financeLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                              : "text-maria-dark dark:text-white hover:bg-green-100 hover:bg-opacity-30 dark:hover:bg-green-900 dark:hover:bg-opacity-20"
                          )}
                          onClick={() => handleLinkClick(link.href)}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          <span className="truncate">{link.title}</span>
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
            
            {/* Seção OPERAÇÕES */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                <HardHat className="mr-1 h-3 w-3" />
                {t("navigation.categories.operations", "Operações")}
              </h3>
              <div className="mt-1 space-y-1">
                {operationsLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
                              : "text-maria-dark dark:text-white hover:bg-indigo-100 hover:bg-opacity-30 dark:hover:bg-indigo-900 dark:hover:bg-opacity-20"
                          )}
                          onClick={() => handleLinkClick(link.href)}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          <span className="truncate">{link.title}</span>
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
            
            {/* Seção FERRAMENTAS */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                <Wrench className="mr-1 h-3 w-3" />
                {t("navigation.categories.tools", "Ferramentas")}
              </h3>
              <div className="mt-1 space-y-1">
                {toolsLinks.map((link) => (
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
                          <span className="truncate">{link.title}</span>
                          {link.badge && (
                            <span className="ml-auto bg-maria-primary-light text-white text-xs px-1.5 py-0.5 rounded-full">
                              {link.badge}
                            </span>
                          )}
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
            
            {/* Configurações */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                <Settings className="mr-1 h-3 w-3" />
                {t("navigation.categories.settings", "Configurações")}
              </h3>
              <div className="mt-1 space-y-1">
                {settingsLinks.map((link) => (
                  <TooltipProvider key={link.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md group cursor-pointer transition-all",
                            isLinkActive(link.href, link.altHref)
                              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                              : "text-maria-dark dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                          onClick={() => handleLinkClick(link.href)}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          <span className="truncate">{link.title}</span>
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
        
        {/* Rodapé da sidebar */}
        <div className="p-4 mt-auto border-t border-secondary-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="block font-medium">Maria Faz</span>
              <span className="block">© 2025</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}