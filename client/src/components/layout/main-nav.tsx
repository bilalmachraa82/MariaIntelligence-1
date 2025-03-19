import React, { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SidebarReorganized } from "./sidebar-reorganized";
import { MobileNav } from "./mobile-nav";

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const { t, i18n } = useTranslation();
  // Definir a detecção de idioma para reconhecer pt-PT
  const isPortuguese = i18n.language?.startsWith("pt");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Garantir que o idioma padrão seja pt-PT quando o aplicativo iniciar
  React.useEffect(() => {
    if (!isPortuguese) {
      i18n.changeLanguage("pt-PT");
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-[57px] border-b border-border bg-background">
        <div className="flex h-full items-center px-4">
          <div className="flex-1 flex items-center">
            {/* Logo e nome da aplicação */}
            <Link href={isPortuguese ? "/painel" : "/dashboard"}>
              <a className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  M
                </div>
                <span className="font-semibold text-lg hidden sm:inline-block">
                  Maria Faz
                </span>
              </a>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Componente de navegação móvel */}
            <MobileNav />

            {/* Botão de alternar idioma */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => i18n.changeLanguage(isPortuguese ? "en-GB" : "pt-PT")}
              className="px-2"
            >
              {isPortuguese ? "Inglês" : "Português (PT)"}
            </Button>
          </div>
        </div>
      </header>
      
      {/* Barra lateral com suporte a colapso */}
      <div className="hidden md:block">
        <SidebarReorganized 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar}
        />
      </div>
      
      {/* Espaçamento para conteúdo principal */}
      <main className={`pt-[57px] transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[60px]' : 'md:ml-[240px]'}`}>
        {/* Conteúdo da página será renderizado aqui */}
      </main>
    </>
  );
}