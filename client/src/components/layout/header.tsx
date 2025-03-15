import { BellIcon, Search, Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Verifica se a página foi rolada para aplicar efeito visual
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <header className={cn(
      "sticky top-0 bg-white dark:bg-gray-900 z-30 transition-all duration-200",
      scrolled ? "shadow-md" : "shadow"
    )}>
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Logo (visible only on desktop) */}
        <div className="hidden md:flex items-center">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Maria Faz
          </h1>
        </div>

        {/* Title (visible only on mobile) */}
        <div className="flex items-center md:hidden">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Maria Faz
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-1">
          {/* Botão de busca */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Button>
          
          {/* Botão de notificações */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <div className="relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                3
              </span>
            </div>
            <span className="sr-only">Notificações</span>
          </Button>
          
          {/* Botão de tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>
          
          {/* Botão de usuário */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <User className="h-5 w-5" />
            <span className="sr-only">Perfil</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
