import { Link, useLocation } from "wouter";
import { 
  Home, 
  Building2, 
  CalendarDays, 
  Users, 
  BarChart3, 
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [location] = useLocation();

  const links = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      title: "Propriedades",
      href: "/properties",
      icon: Building2,
    },
    {
      title: "Reservas",
      href: "/reservations",
      icon: CalendarDays,
    },
    {
      title: "Proprietários",
      href: "/owners",
      icon: Users,
    },
    {
      title: "Relatórios",
      href: "/reports",
      icon: BarChart3,
    },
    {
      title: "Configurações",
      href: "/settings",
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
            <Link key={link.href} href={link.href}>
              <a
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
              </a>
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
