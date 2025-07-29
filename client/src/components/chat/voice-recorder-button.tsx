/**
 * Componente placeholder que substitui o botão de gravação de voz
 * (Funcionalidade removida conforme solicitado)
 */

import { MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface VoiceRecorderButtonProps {
  onMessageReceived?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function VoiceRecorderButton({
  className,
  variant = "outline",
  size = "icon",
  disabled = false
}: VoiceRecorderButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Informa ao usuário que a funcionalidade de voz foi removida
  const showUnavailableMessage = () => {
    toast({
      title: t("voiceInput.removed", "Funcionalidade Removida"),
      description: t("voiceInput.featureRemoved", "A funcionalidade de entrada por voz foi removida do sistema."),
      variant: "default"
    });
  };
  
  // Renderizar apenas um botão desabilitado como placeholder
  return (
    <div className="hidden">
      <Button
        type="button"
        onClick={showUnavailableMessage}
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={true}
      >
        <MicOff className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}