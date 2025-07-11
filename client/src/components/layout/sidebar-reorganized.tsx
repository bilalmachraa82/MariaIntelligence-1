import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Home,
  Building2,
  CalendarDays,
  FileText,
  BarChart3,
  Users,
  FileUp,
  ClipboardCheck,
  Wrench,
  PaintBucket,
  BadgeDollarSign,
  PiggyBank,
  CreditCard,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  Bot,
  HardHat,
  ChevronLeft,
  Menu,
  X,
  BellRing,
  Globe,
  Key,
  Euro
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePendingApprovals } from "@/hooks/use-pending-approvals";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

// Interface para itens de navegação
interface NavItem {
  name: string;
  href: string;
  altHref?: string;
  icon: React.FC<{ className?: string }>;
  iconColor?: string;
}

interface SidebarItemProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  href: string;
  altHref?: string;
  isActive: boolean;
  onClick: () => void;
  iconColor?: string;
  children?: React.ReactNode;
  isSubItem?: boolean;

  showPendingBadge?: boolean;
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SidebarReorganized({ 
  collapsed = false, 
  onToggleCollapse,
  isMobile = false,
  closeDrawer
}: { 
  collapsed?: boolean, 
  onToggleCollapse?: () => void,
  isMobile?: boolean,
  closeDrawer?: () => void
}) {
  const [location, useNavigate] = useLocation();
  
  // Função de navegação personalizada que também fecha o drawer quando necessário
  // Normaliza URLs para evitar barras duplicadas
  const navigate = (href: string) => {
    // Se não inicia com barra, adiciona uma no início
    let normalizedHref = href.startsWith('/') ? href : '/' + href;
    
    // Separa a URL em protocolo e caminho (se for uma URL completa)
    const hasProtocol = normalizedHref.includes('://');
    let protocol = '';
    let path = normalizedHref;
    
    if (hasProtocol) {
      const parts = normalizedHref.split('://');
      protocol = parts[0] + '://';
      path = parts[1];
    }
    
    // Remove barras duplicadas apenas na parte do caminho, preservando o protocolo
    path = path.replace(/\/+/g, '/');
    
    // Reconstrói a URL normalizada
    normalizedHref = hasProtocol ? protocol + path : path;
    
    // Navega para a URL normalizada
    useNavigate(normalizedHref);
    
    // Fecha o drawer se estiver em modo mobile e a função closeDrawer estiver disponível
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Estado para controle dos menus expansíveis
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    finances: true,
    operations: false,
    settings: false
  });

  // Auto-expand section if a child is active
  useEffect(() => {
    if (location.includes('relatorio') || location.includes('report') || 
        location.includes('pagamento') || location.includes('payment') ||
        location.includes('financial') || location.includes('documento')) {
      setOpenSections(prev => ({ ...prev, finances: true }));
    }
    
    if (location.includes('cleaning') || location.includes('limpeza') || 
        location.includes('maintenance') || location.includes('manutencao') || 
        location.includes('owner') || location.includes('proprietario')) {
      setOpenSections(prev => ({ ...prev, operations: true }));
    }
    
    // Expandir configurações quando na página de propriedades
    if (location.includes('propriedades') || location.includes('properties')) {
      setOpenSections(prev => ({ ...prev, settings: true }));
    }
  }, [location]);

  // Toggle para uma seção específica
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Determina se um link está ativo
  const checkIfActive = (href: string, altHref?: string) => {
    if (location === href) return true;
    if (altHref && location === altHref) return true;
    
    // Verifica subpáginas
    if (location.startsWith(`${href}/`)) return true;
    
    // Verifica padrões específicos para finanças
    if ((href.includes('relatorios') || href.includes('reports')) && 
        (location.includes('relatorios') || location.includes('reports'))) {
      return true;
    }
    
    if ((href.includes('pagamentos/entrada') || href.includes('payments/incoming')) &&
        (location.includes('pagamentos/entrada') || location.includes('payments/incoming'))) {
      return true;
    }
    
    if ((href.includes('pagamentos/saida') || href.includes('payments/outgoing')) &&
        (location.includes('pagamentos/saida') || location.includes('payments/outgoing'))) {
      return true;
    }
    
    // Menu "Documentos" removido pois era redundante com outros menus
    
    if ((href.includes('quotations') || href.includes('orcamentos')) &&
        (location.includes('quotations') || location.includes('orcamentos'))) {
      return true;
    }
    
    // Verifica padrões específicos para operações
    if ((href.includes('equipas-limpeza') || href.includes('cleaning-teams')) &&
        (location.includes('equipas-limpeza') || location.includes('cleaning-teams'))) {
      return true;
    }
    
    if ((href.includes('manutencao') || href.includes('maintenance')) &&
        (location.includes('manutencao') || location.includes('maintenance'))) {
      return true;
    }
    
    if ((href.includes('proprietarios') || href.includes('owners')) &&
        (location.includes('proprietarios') || location.includes('owners'))) {
      return true;
    }
    
    return false;
  };

  // Componente simplificado para cada item da barra lateral
  const SidebarItem = ({ 
    icon: Icon, 
    label, 
    href, 
    altHref, 
    isActive, 
    onClick,
    iconColor = "text-gray-500 dark:text-gray-400",
    children,
    isSubItem = false,
    showPendingBadge = false
  }: SidebarItemProps) => {
    const { count } = showPendingBadge ? usePendingApprovals() : { count: 0 };
    
    return (
      <>
        <div className="relative">
          <button
            className={cn(
              "flex items-center w-full gap-2 px-2.5 rounded-md transition-colors",
              // Ajusta o tamanho e espaçamento baseado no modo mobile
              isMobile ? "py-2.5 text-base" : "py-2 text-sm",
              // Estilo quando ativo
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground font-semibold"
                : "text-foreground hover:bg-accent hover:text-accent-foreground",
              // Recuo para subitens
              isSubItem && (isMobile ? "pl-10 text-sm" : "pl-8 text-xs"),
              // Fonte mais forte em mobile
              isMobile && "font-medium"
            )}
            onClick={onClick}
          >
            {!isSubItem && (
              <Icon className={cn(
                isMobile ? "h-6 w-6" : "h-5 w-5", 
                isActive ? "text-primary dark:text-primary-foreground" : iconColor
              )} />
            )}
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{label}</span>
                {showPendingBadge && count > 0 && (
                  <Badge variant="destructive" className="ml-auto mr-1">
                    {count}
                  </Badge>
                )}
              </>
            )}
          </button>
        </div>
        {children}
      </>
    );
  };

  // Componente para seções da barra lateral
  const SidebarSection = ({ title, children }: SidebarSectionProps) => {
    if (collapsed) {
      return <>{children}</>;
    }
    
    return (
      <div className="mb-3">
        <div className="px-3 py-2">
          <h3 className={cn(
            "font-semibold text-muted-foreground uppercase tracking-wider",
            isMobile ? "text-sm" : "text-xs"
          )}>
            {title}
          </h3>
        </div>
        {children}
      </div>
    );
  };

  // Itens principais da navegação - Foco nas tarefas diárias mais comuns
  const mainNavItems = [
    {
      name: "Início",
      href: "/painel",
      altHref: "/dashboard",
      icon: Home,
      iconColor: "text-blue-500"
    },
    {
      name: "Reservas",
      href: "/reservas",
      altHref: "/reservations",
      icon: CalendarDays,
      iconColor: "text-purple-500"
    },
    // Propriedades movidas para o menu principal por ser uma funcionalidade central
    {
      name: "Imóveis",
      href: "/propriedades",
      altHref: "/properties",
      icon: Building2,
      iconColor: "text-indigo-500"
    },
    // Proprietários movidos para o menu principal por ser uma entidade principal
    {
      name: "Proprietários",
      href: "/proprietarios",
      altHref: "/owners",
      icon: Users,
      iconColor: "text-orange-500"
    },
    // Acesso direto aos relatórios adicionado ao menu principal
    {
      name: t("navigation.reports.financial", "Relatórios"),
      href: isPortuguese ? "/relatorios" : "/reports",
      altHref: isPortuguese ? "/reports" : "/relatorios",
      icon: BarChart3,
      iconColor: "text-emerald-500"
    }
  ];

  // Ferramentas e Scanner - Acesso rápido às ferramentas de trabalho diário
  const toolsNavItems = [
    {
      name: "Scanner",
      href: "/simple-ocr",
      altHref: "/upload-pdf",
      icon: FileUp,
      iconColor: "text-rose-500",
      description: "Digitalizar e processar documentos"
    },
    {
      name: "Maria IA",
      href: "/assistente",
      altHref: "/assistant",
      icon: Bot,
      iconColor: "text-violet-500",
      description: "Assistente inteligente"
    }
  ];

  // Finanças - Menu simplificado com itens diretos, sem aninhamento duplo
  const financeNavItems = [
    // Item de pagamentos
    {
      name: t("navigation.payments.expenses", "Despesas"),
      href: "/pagamentos/saida",
      altHref: "/payments/outgoing",
      icon: Euro,
      iconColor: "text-red-500"
    },
    // Item de recebimentos
    {
      name: t("navigation.payments.income", "Recebimentos"),
      href: "/pagamentos/entrada",
      altHref: "/payments/incoming",
      icon: PiggyBank,
      iconColor: "text-green-500"
    },
    // Item de orçamentos
    {
      name: "Orçamentos",
      href: "/quotations",
      altHref: "/orcamentos",
      icon: FileText,
      iconColor: "text-blue-500"
    },
    // Item de relatórios
    {
      name: t("navigation.reports.financial", "Relatórios"),
      href: isPortuguese ? "/relatorios" : "/reports",
      altHref: isPortuguese ? "/reports" : "/relatorios",
      icon: BarChart3,
      iconColor: "text-emerald-500"
    }
  ];

  // Operações - Serviços e manutenção - simplificados como links diretos
  const operationsNavItems = [
    // Equipe de limpeza
    {
      name: t("navigation.cleaning.teams", "Equipas de Limpeza"),
      href: "/equipas-limpeza",
      altHref: "/cleaning-teams",
      icon: PaintBucket,
      iconColor: "text-cyan-500"
    },
    // Agendamentos de limpeza
    {
      name: t("navigation.cleaning.schedules", "Agendamentos"),
      href: "/equipas-limpeza/agendamentos",
      altHref: "/cleaning-teams/schedules",
      icon: CalendarDays,
      iconColor: "text-cyan-500"
    },
    // Relatório de limpezas e pagamentos
    {
      name: t("navigation.cleaning.reports", "Relatórios e Pagamentos"),
      href: "/relatorios-limpeza",
      altHref: "/cleaning-reports",
      icon: FileSpreadsheet,
      iconColor: "text-cyan-500"
    },
    // Manutenção pendente
    {
      name: t("navigation.maintenance.pending", "Manutenção Pendente"),
      href: "/manutencao/pendentes",
      altHref: "/maintenance/pending",
      icon: Wrench,
      iconColor: "text-amber-500"
    },
    // Solicitação de manutenção
    {
      name: t("navigation.maintenance.request", "Solicitar Manutenção"),
      href: "/manutencao/solicitacao",
      altHref: "/maintenance/request",
      icon: FileText,
      iconColor: "text-amber-500"
    }
  ];

  // Utilidades - Simplificado com links diretos
  const otherNavItems = [
    // Configurações gerais
    {
      name: t("navigation.settings", "Configurações Gerais"),
      href: "/configuracoes",
      altHref: "/settings",
      icon: Settings,
      iconColor: "text-gray-500"
    },
    // Notificações
    {
      name: t("settings.tabs.notifications", "Notificações"),
      href: "/configuracoes?tab=notifications",
      altHref: "/settings?tab=notifications",
      icon: BellRing,
      iconColor: "text-amber-400"
    },
    // Idioma
    {
      name: t("settings.tabs.language", "Idioma"),
      href: "/configuracoes?tab=language",
      altHref: "/settings?tab=language",
      icon: Globe,
      iconColor: "text-blue-500"
    },
    // Integrações
    {
      name: t("settings.tabs.integrations", "Integrações"),
      href: "/configuracoes?tab=api",
      altHref: "/settings?tab=api",
      icon: Key,
      iconColor: "text-teal-500"
    },
    // Opção de Dados Demo removida conforme solicitado
  ];

  // Se modo colapsado, apenas mostre ícones
  if (collapsed) {
    return (
      <aside className="fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-[60px] border-r border-border bg-background transition-all duration-300 ease-in-out">
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
            <div className="space-y-2 px-2">
              {/* Main items */}
              {mainNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={checkIfActive(item.href, item.altHref) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn("h-5 w-5", 
                    checkIfActive(item.href, item.altHref) 
                      ? "text-primary" 
                      : item.iconColor
                  )} />
                </Button>
              ))}
              
              <Separator className="my-2" />
              
              {/* Finance icon - navegação quando colapsado */}
              <div className="relative">
                <Button
                  variant={financeNavItems.some(item => checkIfActive(item.href, item.altHref)) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => {
                    // Navega para o primeiro item da categoria finanças quando em modo colapsado
                    if (financeNavItems.length > 0) {
                      navigate(financeNavItems[0].href);
                    }
                  }}
                >
                  <Euro className="h-5 w-5 text-green-500" />
                </Button>
              </div>
              
              {/* Operation icon - navegação quando colapsado  */}
              <div className="relative">
                <Button
                  variant={operationsNavItems.some(item => checkIfActive(item.href, item.altHref)) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => {
                    // Navega para o primeiro item da categoria operações quando em modo colapsado
                    if (operationsNavItems.length > 0) {
                      navigate(operationsNavItems[0].href);
                    }
                  }}
                >
                  <HardHat className="h-5 w-5 text-amber-500" />
                </Button>
              </div>
              
              <Separator className="my-2" />
              
              {/* Tools */}
              {toolsNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={checkIfActive(item.href, item.altHref) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn("h-5 w-5", 
                    checkIfActive(item.href) 
                      ? "text-primary" 
                      : item.iconColor
                  )} />
                </Button>
              ))}
              
              <Separator className="my-2" />
              
              {/* Utilities */}
              {otherNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={checkIfActive(item.href, item.altHref) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn("h-5 w-5", 
                    checkIfActive(item.href) 
                      ? "text-primary" 
                      : item.iconColor
                  )} />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Versão expandida do menu
  return (
    <aside className={cn(
      !isMobile && "fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-[210px] border-r border-border",
      "bg-background transition-all duration-300 ease-in-out"
    )}>
      <div className="flex h-full flex-col">
        {!isMobile && (
          <div className="flex items-center justify-between p-2 border-b border-border">
            <div className="flex items-center ml-2">
              <img 
                src="/logo.png" 
                alt="Maria Faz Logo" 
                className="h-7 w-auto mr-2" 
              />
              <span className="text-sm font-medium">Maria Faz</span>
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
        
        <ScrollArea className={cn(
          "flex-1", 
          isMobile ? "py-4" : "py-2"
        )}>
          <div className="px-2">
            <SidebarSection title={t("navigation.categories.main", "Principal")}>
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    altHref={item.altHref}
                    isActive={checkIfActive(item.href, item.altHref)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                    showPendingBadge={item.href === "/reservas"}
                  />
                ))}
              </div>
            </SidebarSection>
            
            <Separator className="my-3" />
            
            <SidebarSection title={t("navigation.categories.finances", "Finanças")}>
              <div className="space-y-1">
                {financeNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    altHref={item.altHref}
                    isActive={checkIfActive(item.href, item.altHref)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                  />
                ))}
              </div>
            </SidebarSection>
            
            <SidebarSection title={t("navigation.categories.operations", "Operações")}>
              <div className="space-y-1">
                {operationsNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    altHref={item.altHref}
                    isActive={checkIfActive(item.href, item.altHref)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                  />
                ))}
              </div>
            </SidebarSection>
            
            <Separator className="my-3" />
            
            <SidebarSection title={t("navigation.categories.tools", "Ferramentas")}>
              <div className="space-y-1">
                {toolsNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    isActive={checkIfActive(item.href, item.altHref)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                  />
                ))}
              </div>
            </SidebarSection>
            
            <Separator className="my-3" />
            
            <SidebarSection title={t("navigation.categories.utilities", "Utilidades")}>
              <div className="space-y-1">
                {otherNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    altHref={item.altHref}
                    isActive={checkIfActive(item.href, item.altHref)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                  />
                ))}
              </div>
            </SidebarSection>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}