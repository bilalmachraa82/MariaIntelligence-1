/**
 * Componente de botão para gravação de voz
 * Permite gravar áudio através do microfone e enviar para processamento
 */

import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { speechClient, TranscriptionResult } from "@/lib/speech-client";
import { cn } from "@/lib/utils";

interface VoiceRecorderButtonProps {
  onMessageReceived?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function VoiceRecorderButton({
  onMessageReceived,
  disabled = false,
  className,
  variant = "outline",
  size = "icon"
}: VoiceRecorderButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  
  // Verificar se o navegador suporta gravação de áudio
  useEffect(() => {
    setIsSupported(speechClient.isSpeechSupported());
    
    if (!speechClient.isSpeechSupported()) {
      console.error("Gravação de áudio não suportada neste navegador");
    }
  }, []);
  
  // Atualizar tempo de gravação a cada segundo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  // Formatar o tempo de gravação (mm:ss)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  const handleTranscriptionResult = async (result: TranscriptionResult) => {
    if (result.success && result.transcription) {
      // Mostrar o texto transcrito
      toast({
        title: t("voiceInput.transcribed", "Transcrito"),
        description: result.transcription,
        duration: 5000
      });
      
      // Enviar o texto para o callback
      if (onMessageReceived) {
        onMessageReceived(result.transcription);
      }
    } else {
      // Mostrar erro de transcrição com mensagem amigável
      let errorMessage = result.error || t("voiceInput.unknownError", "Erro desconhecido");
      
      // Se temos uma mensagem alternativa do servidor, usá-la
      if (result.alternativeText) {
        errorMessage = result.alternativeText;
      } else if (result.message) {
        errorMessage = result.message;
      }
      
      toast({
        title: t("voiceInput.transcriptionFailed", "Transcrição não disponível"),
        description: errorMessage,
        variant: "default" // Menos agressivo que "destructive"
      });
      
      // Mostrar uma dica para o usuário
      setTimeout(() => {
        toast({
          title: t("voiceInput.tip", "Dica"),
          description: t("voiceInput.tipText", "Você pode digitar sua mensagem diretamente no campo de texto."),
          duration: 5000
        });
      }, 1500);
    }
    
    setIsProcessing(false);
  };
  
  const startRecording = async () => {
    try {
      await speechClient.startRecording({
        onStart: () => {
          setIsRecording(true);
          toast({
            title: t("voiceInput.recording", "Gravando..."),
            description: t("voiceInput.speakNow", "Fale agora. Toque novamente para parar."),
            duration: 4000
          });
        },
        onStop: async (audioBlob) => {
          setIsRecording(false);
          setIsProcessing(true);
          
          toast({
            title: t("voiceInput.processing", "Processando..."),
            description: t("voiceInput.transcribing", "Transcrevendo seu áudio..."),
            duration: 3000
          });
          
          // Transcrever o áudio
          const result = await speechClient.transcribeAudio(audioBlob);
          handleTranscriptionResult(result);
        },
        onError: (error) => {
          setIsRecording(false);
          console.error("Erro na gravação:", error);
          
          toast({
            title: t("voiceInput.recordingFailed", "Falha na gravação"),
            description: error.message,
            variant: "destructive"
          });
        },
        maxDuration: 15000 // 15 segundos - reduzindo para evitar payloads muito grandes
      });
    } catch (error: any) {
      console.error("Erro ao iniciar gravação:", error);
      
      toast({
        title: t("voiceInput.microphoneError", "Erro no microfone"),
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = () => {
    speechClient.stopRecording();
  };
  
  const toggleRecording = () => {
    if (!isSupported) {
      toast({
        title: t("voiceInput.notSupported", "Não suportado"),
        description: t("voiceInput.browserNotSupported", "Seu navegador não suporta gravação de áudio."),
        variant: "destructive"
      });
      return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Renderização condicional do ícone
  const renderIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    return isRecording 
      ? <MicOff className="h-4 w-4 text-red-500" /> 
      : <Mic className="h-4 w-4" />;
  };
  
  // Renderização condicional da cor do botão
  const getButtonVariant = () => {
    if (isRecording) return "destructive";
    return variant;
  };
  
  return (
    <div className="flex items-center">
      {isRecording && (
        <span className="mr-2 text-xs font-medium text-muted-foreground">
          {formatTime(recordingTime)}
        </span>
      )}
      
      <Button
        type="button"
        onClick={toggleRecording}
        variant={getButtonVariant()}
        size={size}
        className={cn(
          "transition-all duration-200", 
          isRecording && "animate-pulse",
          className
        )}
        disabled={disabled || isProcessing || !isSupported}
        title={isRecording 
          ? t("voiceInput.stopRecording", "Parar gravação") 
          : t("voiceInput.startRecording", "Iniciar gravação de voz")
        }
      >
        {renderIcon()}
      </Button>
    </div>
  );
}