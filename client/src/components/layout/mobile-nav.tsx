import React, { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { SidebarReorganized } from "./sidebar-reorganized";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslation } from "react-i18next";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  
  const closeDrawer = useCallback(() => {
    setOpen(false);
  }, []);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 border-r w-full sm:w-64 max-w-[calc(100vw-70px)]"
        aria-describedby="menu-description"
      >
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Maria Faz Logo" 
              className="h-8 w-auto mr-3" 
            />
            <SheetTitle>{t("navigation.mainMenu", "Menu")}</SheetTitle>
          </div>
          <VisuallyHidden id="menu-description">
            {t("navigation.mainAppNav", "Navegação principal do aplicativo Maria Faz")}
          </VisuallyHidden>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-57px)]">
          <SidebarReorganized isMobile={true} closeDrawer={closeDrawer} />
        </div>
      </SheetContent>
    </Sheet>
  );
}