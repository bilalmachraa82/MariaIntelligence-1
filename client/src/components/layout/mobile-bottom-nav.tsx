import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Building2, 
  CalendarDays,
  Bot,
  Wrench,
  BadgeDollarSign,
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
    <div className="mobile-nav">
      <div className="mobile-nav-item" onClick={() => handleNavigate("/painel")}>
        <Home className={cn(
          "h-5 w-5 mb-1", 
          isActive("/painel") || isActive("/") 
            ? "text-maria-primary" 
            : "text-maria-gray"
        )} />
        <span className={cn(
          "text-xs",
          isActive("/painel") || isActive("/") 
            ? "text-maria-primary font-medium" 
            : "text-maria-gray"
        )}>
          Painel
        </span>
      </div>
      
      <div className="mobile-nav-item" onClick={() => handleNavigate("/propriedades")}>
        <Building2 className={cn(
          "h-5 w-5 mb-1", 
          isActive("/propriedades") 
            ? "text-maria-primary" 
            : "text-maria-gray"
        )} />
        <span className={cn(
          "text-xs",
          isActive("/propriedades") 
            ? "text-maria-primary font-medium" 
            : "text-maria-gray"
        )}>
          Imóveis
        </span>
      </div>
      
      <div className="mobile-nav-item" onClick={() => handleNavigate("/reservas")}>
        <CalendarDays className={cn(
          "h-5 w-5 mb-1", 
          isActive("/reservas") 
            ? "text-maria-primary" 
            : "text-maria-gray"
        )} />
        <span className={cn(
          "text-xs",
          isActive("/reservas") 
            ? "text-maria-primary font-medium" 
            : "text-maria-gray"
        )}>
          Reservas
        </span>
      </div>
      
      <div className="mobile-nav-item" onClick={() => handleNavigate("/manutencao/pendentes")}>
        <Wrench className={cn(
          "h-5 w-5 mb-1", 
          location.startsWith("/manutencao") 
            ? "text-yellow-500" 
            : "text-maria-gray"
        )} />
        <span className={cn(
          "text-xs",
          location.startsWith("/manutencao") 
            ? "text-yellow-500 font-medium" 
            : "text-maria-gray"
        )}>
          Manutenção
        </span>
      </div>
      
      <div className="mobile-nav-item" onClick={() => handleNavigate("/pagamentos/saida")}>
        <BadgeDollarSign className={cn(
          "h-5 w-5 mb-1", 
          location.startsWith("/pagamentos") 
            ? "text-green-500" 
            : "text-maria-gray"
        )} />
        <span className={cn(
          "text-xs",
          location.startsWith("/pagamentos") 
            ? "text-green-500 font-medium" 
            : "text-maria-gray"
        )}>
          Pagamentos
        </span>
      </div>
      
      <div className="mobile-nav-item" onClick={onOpenMenu}>
        <Menu className="h-5 w-5 mb-1 text-maria-gray" />
        <span className="text-xs text-maria-gray">
          Menu
        </span>
      </div>
    </div>
  );
}