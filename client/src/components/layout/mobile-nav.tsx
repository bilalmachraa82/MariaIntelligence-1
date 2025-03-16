import React from "react";
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

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  return (
    <Sheet>
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
        className="p-0 border-r w-full sm:w-96 max-w-[calc(100vw-48px)]"
        aria-describedby="menu-description"
      >
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle>Menu</SheetTitle>
          <VisuallyHidden id="menu-description">
            Navegação principal do aplicativo Maria Faz
          </VisuallyHidden>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-57px)]">
          <SidebarReorganized />
        </div>
      </SheetContent>
    </Sheet>
  );
}