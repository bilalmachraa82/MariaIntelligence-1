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
  ChevronLeft
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interface para itens com submenu
interface NavItem {
  name: string;
  href: string;
  altHref?: string;
  icon: React.FC<{ className?: string }>;
  iconColor?: string;
  submenu?: NavItem[];
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
  submenu?: NavItem[];
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SidebarReorganized({ collapsed = false, onToggleCollapse }: { collapsed?: boolean, onToggleCollapse?: () => void }) {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");
  
  // Estado para controle dos menus expansíveis
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    finances: true,
    operations: false
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
    
    if ((href.includes('documentos') || href.includes('documents')) &&
        (location.includes('documentos') || location.includes('financial/documents'))) {
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

  // Componente para cada item da barra lateral
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
    submenu
  }: SidebarItemProps) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    
    // Verificar se o submenu deve estar aberto baseado na navegação atual
    useEffect(() => {
      if (submenu && submenu.some((item) => {
        // Verificar se o item está ativo
        const itemIsActive = checkIfActive(item.href, item.altHref);
        return itemIsActive;
      })) {
        setIsSubmenuOpen(true);
      }
    }, [location, submenu]);
    
    const hasSubmenu = submenu && submenu.length > 0;
    
    return (
      <>
        <div className="relative">
          <button
            className={cn(
              "flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground font-semibold"
                : "text-foreground hover:bg-accent hover:text-accent-foreground",
              isSubItem && "pl-10 text-xs"
            )}
            onClick={hasSubmenu ? () => setIsSubmenuOpen(!isSubmenuOpen) : onClick}
          >
            {!isSubItem && <Icon className={cn("h-5 w-5", isActive ? "text-primary dark:text-primary-foreground" : iconColor)} />}
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{label}</span>
                {hasSubmenu && (
                  <ChevronRight className={cn("h-4 w-4 transition-transform", isSubmenuOpen ? "rotate-90" : "")} />
                )}
              </>
            )}
          </button>
          
          {hasSubmenu && isSubmenuOpen && !collapsed && (
            <div className="pl-4 mt-1 space-y-1">
              {submenu.map((subItem) => (
                <SidebarItem
                  key={subItem.href}
                  icon={subItem.icon}
                  label={subItem.name}
                  href={subItem.href}
                  isActive={checkIfActive(subItem.href, subItem.altHref)}
                  onClick={() => navigate(subItem.href)}
                  iconColor={subItem.iconColor || iconColor}
                  isSubItem
                />
              ))}
            </div>
          )}
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
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {children}
      </div>
    );
  };

  // Itens principais da navegação
  const mainNavItems = [
    {
      name: t("navigation.home", "Home"),
      href: isPortuguese ? "/painel" : "/dashboard",
      altHref: "/",
      icon: Home,
      iconColor: "text-blue-500"
    },
    {
      name: t("navigation.properties", "Imóveis"),
      href: isPortuguese ? "/propriedades" : "/properties",
      icon: Building2,
      iconColor: "text-indigo-500"
    },
    {
      name: t("navigation.bookings", "Reservas"),
      href: isPortuguese ? "/reservas" : "/reservations",
      icon: CalendarDays,
      iconColor: "text-purple-500"
    }
  ];

  // Finanças
  const financeNavItems = [
    // Relatórios financeiros
    {
      name: t("navigation.reports.financial", "Relatórios"),
      href: isPortuguese ? "/relatorios" : "/reports",
      icon: FileSpreadsheet,
      iconColor: "text-emerald-500",
      submenu: [
        {
          name: t("navigation.reports.owner", "Proprietários"),
          href: isPortuguese ? "/relatorios/proprietario" : "/reports/owner-report",
          icon: FileSpreadsheet,
        },
        {
          name: t("navigation.reports.monthly", "Faturas Mensais"),
          href: isPortuguese ? "/relatorios/faturacao-mensal" : "/reports/monthly-invoice",
          icon: FileSpreadsheet,
        },
        {
          name: t("navigation.reports.trends", "Tendências"),
          href: isPortuguese ? "/relatorios/tendencias" : "/reports/trends",
          icon: FileSpreadsheet,
        }
      ]
    },
    // Pagamentos
    {
      name: t("navigation.payments.income", "Recebimentos"),
      href: isPortuguese ? "/pagamentos/entrada" : "/payments/incoming",
      icon: PiggyBank,
      iconColor: "text-green-500"
    },
    {
      name: t("navigation.payments.expenses", "Despesas"),
      href: isPortuguese ? "/pagamentos/saida" : "/payments/outgoing",
      icon: CreditCard,
      iconColor: "text-red-500"
    },
    {
      name: t("navigation.documents", "Documentos"),
      href: isPortuguese ? "/documentos" : "/financial/documents",
      icon: FileText,
      iconColor: "text-yellow-500"
    }
  ];

  // Operações
  const operationsNavItems = [
    {
      name: t("navigation.cleaning", "Limpeza"),
      href: isPortuguese ? "/equipas-limpeza" : "/cleaning-teams",
      icon: PaintBucket,
      iconColor: "text-cyan-500"
    },
    {
      name: t("navigation.maintenance", "Manutenção"),
      href: isPortuguese ? "/manutencao/pendentes" : "/maintenance/pending",
      icon: Wrench,
      iconColor: "text-amber-500"
    },
    {
      name: t("navigation.owners", "Proprietários"),
      href: isPortuguese ? "/proprietarios" : "/owners",
      icon: Users,
      iconColor: "text-orange-500"
    }
  ];

  // Ferramentas
  const toolsNavItems = [
    {
      name: t("navigation.assistant", "Maria IA"),
      href: isPortuguese ? "/assistente" : "/assistant",
      icon: Bot,
      iconColor: "text-violet-500"
    },
    {
      name: t("navigation.pdfUpload", "Upload PDF"),
      href: "/upload-pdf", // Caminho consistente com o App.tsx
      icon: FileUp,
      iconColor: "text-rose-500"
    }
  ];

  // Outros
  const otherNavItems = [
    {
      name: t("navigation.settings", "Configurações"),
      href: isPortuguese ? "/configuracoes" : "/settings",
      icon: Settings,
      iconColor: "text-gray-500"
    },
    {
      name: t("navigation.demoData", "Dados Demo"),
      href: isPortuguese ? "/dados-demo" : "/demo-data",
      icon: ClipboardCheck,
      iconColor: "text-blue-400"
    }
  ];

  // Se modo colapsado, apenas mostre ícones
  if (collapsed) {
    return (
      <aside className="fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-[60px] border-r border-border bg-background transition-all duration-300 ease-in-out">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center p-2 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              className="mx-auto"
              onClick={onToggleCollapse}
            >
              <ChevronRight className="h-4 w-4" />
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
                  variant={financeNavItems.some(item => checkIfActive(item.href)) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => {
                    // Navega para o primeiro item do submenu quando em modo colapsado
                    if (financeNavItems.length > 0) {
                      navigate(financeNavItems[0].href);
                    }
                  }}
                >
                  <BadgeDollarSign className="h-5 w-5 text-green-500" />
                </Button>
              </div>
              
              {/* Operation icon - navegação quando colapsado  */}
              <div className="relative">
                <Button
                  variant={operationsNavItems.some(item => checkIfActive(item.href)) ? "secondary" : "ghost"}
                  size="icon"
                  className="w-full h-10"
                  onClick={() => {
                    // Navega para o primeiro item do submenu quando em modo colapsado
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
                  variant={checkIfActive(item.href) ? "secondary" : "ghost"}
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
                  variant={checkIfActive(item.href) ? "secondary" : "ghost"}
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
    <aside className="fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-[240px] border-r border-border bg-background transition-all duration-300 ease-in-out">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-2 border-b border-border">
          <span className="text-sm font-medium ml-2">Maria Faz</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 py-2">
          <div className="px-2">
            <SidebarSection title={t("navigation.categories.main", "Main")}>
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
                  />
                ))}
              </div>
            </SidebarSection>
            
            <Separator className="my-3" />
            
            <SidebarSection title={t("navigation.categories.finances", "Finances")}>
              <Collapsible 
                open={openSections.finances}
                onOpenChange={() => toggleSection('finances')}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center">
                    {/* Este wrapper permite clicar no ícone separadamente do texto */}
                    <button 
                      className={cn(
                        "flex-grow flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <BadgeDollarSign className="h-5 w-5 text-green-500" />
                      <span className="flex-1 truncate">{t("navigation.categories.finances", "Finances")}</span>
                      <ChevronRight className={cn("h-4 w-4 transition-transform", openSections.finances ? "rotate-90" : "")} />
                    </button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1">
                  <div className="space-y-1">
                    {financeNavItems.map((item) => (
                      <SidebarItem
                        key={item.href}
                        icon={item.icon}
                        label={item.name}
                        href={item.href}
                        isActive={checkIfActive(item.href)}
                        onClick={() => navigate(item.href)}
                        iconColor={item.iconColor}
                        isSubItem
                        submenu={item.submenu}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </SidebarSection>
            
            <SidebarSection title={t("navigation.categories.operations", "Operations")}>
              <Collapsible 
                open={openSections.operations}
                onOpenChange={() => toggleSection('operations')}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center">
                    {/* Este wrapper permite clicar no ícone separadamente do texto */}
                    <button 
                      className={cn(
                        "flex-grow flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <HardHat className="h-5 w-5 text-amber-500" />
                      <span className="flex-1 truncate">{t("navigation.categories.operations", "Operations")}</span>
                      <ChevronRight className={cn("h-4 w-4 transition-transform", openSections.operations ? "rotate-90" : "")} />
                    </button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1">
                  <div className="space-y-1">
                    {operationsNavItems.map((item) => (
                      <SidebarItem
                        key={item.href}
                        icon={item.icon}
                        label={item.name}
                        href={item.href}
                        isActive={checkIfActive(item.href)}
                        onClick={() => navigate(item.href)}
                        iconColor={item.iconColor}
                        isSubItem
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </SidebarSection>
            
            <Separator className="my-3" />
            
            <SidebarSection title={t("navigation.categories.tools", "Tools")}>
              <div className="space-y-1">
                {toolsNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    isActive={checkIfActive(item.href)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                  />
                ))}
              </div>
            </SidebarSection>
            
            <Separator className="my-3" />
            
            <SidebarSection title={t("navigation.categories.utilities", "Utilities")}>
              <div className="space-y-1">
                {otherNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    isActive={checkIfActive(item.href)}
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