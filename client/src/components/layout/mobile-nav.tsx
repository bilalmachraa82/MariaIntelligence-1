import { Link, useLocation } from "wouter";
import { 
  Home, 
  Building2, 
  CalendarDays, 
  Users, 
  BarChart3, 
  Settings,
  Bot,
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [location] = useLocation();

  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language?.startsWith("pt");

  // Links de navegação sincronizados com o sidebar
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
      title: t("navigation.cleaningTeams"),
      href: isPortuguese ? "/equipas-limpeza" : "/cleaning-teams",
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 w-[280px]">
        <SheetHeader className="border-b border-secondary-200 p-4">
          <SheetTitle className="text-xl font-semibold text-primary-700">
            Maria Faz
          </SheetTitle>
        </SheetHeader>
        
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md group",
                location === link.href
                  ? "bg-primary-50 text-primary-700"
                  : "text-secondary-700 hover:bg-secondary-100"
              )}
              onClick={onClose}
            >
              <link.icon className="mr-3 h-5 w-5" />
              {link.title}
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200">
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
      </SheetContent>
    </Sheet>
  );
}
