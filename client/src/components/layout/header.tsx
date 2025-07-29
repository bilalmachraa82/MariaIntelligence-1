import React, { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Bell,
  Menu,
  Search,
  Sun,
  Moon,
  Laptop,
  LifeBuoy,
  LogOut,
  Settings,
  User,
  GlobeIcon,
  Bot
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const isPortuguese = i18n.language?.startsWith("pt");

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // Implementar funcionalidade de busca aqui
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const userName = "Maria Administrador";
  const userInitials = getInitials(userName);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container flex h-14 items-center">
        <div className="flex items-center mr-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 md:hidden">
          <span className="font-semibold text-lg">
            Maria<span className="text-primary">Faz</span>
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-2">
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              aria-label="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <span className="font-semibold text-lg">
            Maria<span className="text-primary">Faz</span>
          </span>
        </div>

        <div className="flex-1 px-2">
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center space-x-2"
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("common.search", "Buscar...")}
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="default" size="sm">
              {t("common.search", "Buscar")}
            </Button>
          </form>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isPortuguese ? "/assistente" : "/assistant")}
            aria-label="Maria AI Assistant"
            className="relative"
          >
            <Bot className="h-5 w-5" />
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              AI
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Language">
                <GlobeIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.language", "Idioma")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => changeLanguage("pt-PT")}>
                Português
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage("en-US")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage("es-ES")}>
                Español
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage("fr-FR")}>
                Français
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Theme">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar-placeholder.jpg" alt={userName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@mariafaz.pt
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>{t("common.profile", "Perfil")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(isPortuguese ? "/configuracoes" : "/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t("navigation.settings", "Configurações")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>{t("common.help", "Ajuda")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("common.logout", "Sair")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}