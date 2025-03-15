import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { MobileNavReorganized } from "./mobile-nav-reorganized";
import { SidebarReorganized } from "./sidebar-reorganized";

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
      <Header 
        onMenuClick={toggleSidebar} 
        isSidebarOpen={sidebarOpen} 
      />
      
      <div className="flex-1 flex relative">
        <SidebarReorganized 
          collapsed={!sidebarOpen} 
          onToggleCollapse={toggleSidebar} 
        />
        
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
      
      <MobileNavReorganized />
    </div>
  );
}
