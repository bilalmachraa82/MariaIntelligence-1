import React, { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Home,
  Building2,
  CalendarDays,
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  FileUp,
  ClipboardCheck,
  Wrench,
  PaintBucket,
  BadgeDollarSign,
  Receipt,
  PiggyBank,
  CreditCard,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  Bot,
  ArrowUpDown,
  ArrowDownUp,
  HardHat,
  ChevronLeft,
  Menu
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Toggle para uma seção específica
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Determina se um link está ativo
  const isActive = (href: string, altHref?: string) => {
    if (location === href) return true;
    if (altHref && location === altHref) return true;
    
    // Verifica subpáginas
    if (location.startsWith(`${href}/`)) return true;
    
    // Verifica padrões específicos
    if (href.includes('relatorios') || href.includes('reports')) {
      if (location.includes('relatorios') || location.includes('reports')) {
        return true;
      }
    }
    
    if (href.includes('limpeza') || href.includes('cleaning')) {
      if (location.includes('limpeza') || location.includes('cleaning') ||
          location.includes('manutencao') || location.includes('maintenance')) {
        return true;
      }
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
    isSubItem = false
  }: SidebarItemProps) => {
    return (
      <>
        <button
          className={cn(
            "flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            isActive
              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            isSubItem && "pl-10 text-xs"
          )}
          onClick={onClick}
        >
          {!isSubItem && <Icon className={cn("h-5 w-5", isActive ? "text-primary dark:text-primary-foreground" : iconColor)} />}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{label}</span>
              {children && <ChevronRight className={cn("h-4 w-4 transition-transform", openSections[href] ? "rotate-90" : "")} />}
            </>
          )}
        </button>
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
      <div className="mb-2">
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
    {
      name: t("navigation.reports.financial", "Relatórios"),
      href: isPortuguese ? "/relatorios/proprietario" : "/reports/owner-report",
      icon: FileSpreadsheet,
      iconColor: "text-emerald-500"
    },
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
      href: isPortuguese ? "/upload-pdf" : "/pdf-upload",
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

  return (
    <aside className={cn(
      "fixed top-[57px] left-0 z-30 h-[calc(100vh-57px)] border-r border-border bg-background transition-all duration-300 ease-in-out",
      collapsed ? "w-[60px]" : "w-[240px]"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-2">
          {!collapsed && <span className="text-sm font-medium">Maria Faz</span>}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={onToggleCollapse}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-1">
          <SidebarSection title={t("navigation.categories.main", "Main")}>
            {mainNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.name}
                href={item.href}
                altHref={item.altHref}
                isActive={isActive(item.href, item.altHref)}
                onClick={() => navigate(item.href)}
                iconColor={item.iconColor}
              />
            ))}
          </SidebarSection>
          
          <Separator className="my-2" />
          
          <SidebarSection title={t("navigation.categories.finances", "Finances")}>
            <Collapsible 
              open={openSections.finances && !collapsed}
              onOpenChange={() => !collapsed && toggleSection('finances')}
            >
              <CollapsibleTrigger asChild>
                <button className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}>
                  <BadgeDollarSign className="h-5 w-5 text-green-500" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{t("navigation.categories.finances", "Finances")}</span>
                      <ChevronRight className={cn("h-4 w-4 transition-transform", openSections.finances ? "rotate-90" : "")} />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {financeNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    isActive={isActive(item.href)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                    isSubItem
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </SidebarSection>
          
          <SidebarSection title={t("navigation.categories.operations", "Operations")}>
            <Collapsible 
              open={openSections.operations && !collapsed}
              onOpenChange={() => !collapsed && toggleSection('operations')}
            >
              <CollapsibleTrigger asChild>
                <button className={cn(
                  "flex items-center w-full gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}>
                  <HardHat className="h-5 w-5 text-amber-500" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{t("navigation.categories.operations", "Operations")}</span>
                      <ChevronRight className={cn("h-4 w-4 transition-transform", openSections.operations ? "rotate-90" : "")} />
                    </>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {operationsNavItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    icon={item.icon}
                    label={item.name}
                    href={item.href}
                    isActive={isActive(item.href)}
                    onClick={() => navigate(item.href)}
                    iconColor={item.iconColor}
                    isSubItem
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </SidebarSection>
          
          <Separator className="my-2" />
          
          <SidebarSection title={t("navigation.categories.tools", "Tools")}>
            {toolsNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.name}
                href={item.href}
                isActive={isActive(item.href)}
                onClick={() => navigate(item.href)}
                iconColor={item.iconColor}
              />
            ))}
          </SidebarSection>
          
          <Separator className="my-2" />
          
          <SidebarSection title={t("navigation.categories.utilities", "Utilities")}>
            {otherNavItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.name}
                href={item.href}
                isActive={isActive(item.href)}
                onClick={() => navigate(item.href)}
                iconColor={item.iconColor}
              />
            ))}
          </SidebarSection>
        </ScrollArea>
      </div>
    </aside>
  );
}