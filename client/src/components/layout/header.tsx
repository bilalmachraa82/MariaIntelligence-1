import { BellIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white shadow z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="mr-2"
          >
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-lg font-semibold text-primary">Maria Faz</h1>
        </div>

        <div className="flex items-center">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700"
            >
              <BellIcon className="h-6 w-6" />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
