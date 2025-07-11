import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building2, 
  CalendarDays,
  Bot,
  Wrench,
  BadgeDollarSign,
  Euro,
  Menu
} from "lucide-react";

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const [location, setLocation] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  const handleNavigate = (path: string) => {
    setLocation(path);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50">
      <div className="flex flex-col items-center py-1 px-3" onClick={() => handleNavigate("/painel")}>
        <Home className={cn(
          "h-5 w-5 mb-1", 
          isActive("/painel") || isActive("/") 
            ? "text-primary" 
            : "text-gray-500"
        )} />
        <span className={cn(
          "text-xs",
          isActive("/painel") || isActive("/") 
            ? "text-primary font-medium" 
            : "text-gray-500"
        )}>
          Painel
        </span>
      </div>
      
      <div className="flex flex-col items-center py-1 px-3" onClick={() => handleNavigate("/propriedades")}>
        <Building2 className={cn(
          "h-5 w-5 mb-1", 
          isActive("/propriedades") 
            ? "text-primary" 
            : "text-gray-500"
        )} />
        <span className={cn(
          "text-xs",
          isActive("/propriedades") 
            ? "text-primary font-medium" 
            : "text-gray-500"
        )}>
          Imóveis
        </span>
      </div>
      
      <div className="flex flex-col items-center py-1 px-3" onClick={() => handleNavigate("/reservas")}>
        <CalendarDays className={cn(
          "h-5 w-5 mb-1", 
          isActive("/reservas") 
            ? "text-primary" 
            : "text-gray-500"
        )} />
        <span className={cn(
          "text-xs",
          isActive("/reservas") 
            ? "text-primary font-medium" 
            : "text-gray-500"
        )}>
          Reservas
        </span>
      </div>
      
      <div className="flex flex-col items-center py-1 px-3" onClick={() => handleNavigate("/manutencao/pendentes")}>
        <Wrench className={cn(
          "h-5 w-5 mb-1", 
          location.startsWith("/manutencao") 
            ? "text-yellow-500" 
            : "text-gray-500"
        )} />
        <span className={cn(
          "text-xs",
          location.startsWith("/manutencao") 
            ? "text-yellow-500 font-medium" 
            : "text-gray-500"
        )}>
          Manutenção
        </span>
      </div>
      
      <div className="flex flex-col items-center py-1 px-3" onClick={() => handleNavigate("/pagamentos/saida")}>
        <Euro className={cn(
          "h-5 w-5 mb-1", 
          location.startsWith("/pagamentos") 
            ? "text-green-500" 
            : "text-gray-500"
        )} />
        <span className={cn(
          "text-xs",
          location.startsWith("/pagamentos") 
            ? "text-green-500 font-medium" 
            : "text-gray-500"
        )}>
          Pagamentos
        </span>
      </div>
      
      <div className="flex flex-col items-center py-1 px-3" onClick={onOpenMenu}>
        <Menu className="h-5 w-5 mb-1 text-gray-500" />
        <span className="text-xs text-gray-500">
          Menu
        </span>
      </div>
    </div>
  );
}