import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SidebarReorganized } from "./sidebar-reorganized";
import { MobileNav } from "./mobile-nav";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  // Estado para controlar a visibilidade da barra lateral
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Verifica se existe preferência salva no localStorage
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  
  // Estado para detectar tela móvel
  const [isMobile, setIsMobile] = useState(false);

  // Salva a preferência no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);
  
  // Detecta se é dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Fecha automaticamente a barra lateral em telas pequenas
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    // Verifica inicialmente
    checkIfMobile();
    
    // Adiciona evento para verificar quando o tamanho da janela muda
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Alterna a visibilidade da barra lateral
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Barra de navegação no topo */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[57px] border-b border-border bg-background">
        <div className="flex h-full items-center px-4">
          <div className="flex items-center gap-2">
            {/* Botão de menu móvel */}
            <MobileNav />
            
            {/* Logo */}
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              M
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">
              Maria Faz
            </span>
          </div>
          
          {/* Espaçador */}
          <div className="flex-1"></div>
          
          {/* Itens do lado direito */}
          <div className="flex items-center gap-2">
            {/* Apenas em telas não móveis, mostrar botão de colapsar */}
            {!isMobile && (
              <button 
                className="p-2 text-muted-foreground hover:text-foreground"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left-close">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <path d="M9 3v18" />
                    <path d="m16 15-3-3 3-3" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-left-open">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <path d="M9 3v18" />
                    <path d="m14 9 3 3-3 3" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Conteúdo principal com barra lateral */}
      <div className="flex-1 flex relative pt-[57px]">
        {/* Barra lateral (ocultada em dispositivos móveis) */}
        <div className="hidden md:block">
          <SidebarReorganized 
            collapsed={!sidebarOpen} 
            onToggleCollapse={toggleSidebar} 
          />
        </div>
        
        {/* Conteúdo principal */}
        <main 
          className={cn(
            "flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 transition-all duration-300 ease-in-out", 
            className,
            sidebarOpen ? "md:ml-[240px]" : "md:ml-[60px]"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
