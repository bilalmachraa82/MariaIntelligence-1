import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type AIServiceStatus = {
  success: boolean;
  services: {
    gemini: {
      available: boolean;
      keyConfigured: boolean;
    };
  };
  currentService: string;
  anyServiceAvailable: boolean;
};

export function AIServiceStatus() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AIServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-ai-services');
      
      if (!response.ok) {
        throw new Error(`Erro ao verificar serviços: ${response.status}`);
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      console.error("Erro ao verificar status dos serviços de IA:", err);
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("aiServices.statusTitle", "Serviços de IA")}</CardTitle>
        <CardDescription>
          {t("aiServices.statusDescription", "Status dos serviços de inteligência artificial")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t("common.loading", "A carregar...")}</span>
          </div>
        ) : error ? (
          <div className="flex items-center text-destructive py-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : status ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("aiServices.currentService", "Serviço atual")}:</span>
              <Badge variant={status.anyServiceAvailable ? "default" : "destructive"}>
                {status.currentService === "gemini" ? "Google Gemini" : 
                 status.currentService === "auto" ? "Detecção automática" : "Indisponível"}
              </Badge>
            </div>
            
            <div className="grid gap-3 pt-3">
              <div className="flex items-start justify-between border p-3 rounded-md">
                <div>
                  <h4 className="font-medium">Google Gemini</h4>
                  <p className="text-sm text-muted-foreground">{t("aiServices.geminiDescription", "Serviço de IA do Google")}</p>
                </div>
                <Badge variant={status.services.gemini.available ? "default" : "destructive"} className={status.services.gemini.available ? "bg-green-500" : ""}>
                  {status.services.gemini.available ? (
                    <span className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" /> 
                      {t("aiServices.active", "Ativo")}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" /> 
                      {status.services.gemini.keyConfigured 
                        ? t("aiServices.error", "Erro") 
                        : t("aiServices.notConfigured", "Não configurado")}
                    </span>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Info className="h-5 w-5 mr-2" />
            <span>{t("aiServices.noData", "Sem informações disponíveis")}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={fetchStatus} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("common.refreshing", "A atualizar...")}
            </>
          ) : (
            t("common.refresh", "Atualizar")
          )}
        </Button>
        
        {status?.anyServiceAvailable && (
          <div className="text-sm text-muted-foreground flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            {t("aiServices.ready", "Pronto para uso")}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}