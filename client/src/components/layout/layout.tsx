import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      {/* Mobile nav overlay */}
      <MobileNav 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMobileMenuToggle={() => setIsMobileNavOpen(true)} />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-secondary-50 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
        
        {/* Mobile bottom navigation */}
        {isMobile && (
          <MobileBottomNav onOpenMenu={() => setIsMobileNavOpen(true)} />
        )}
      </div>
    </div>
  );
}
