import { UploadPDF } from "@/components/dashboard/upload-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DocumentScanPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          {t("documentScan.title", "Digitalização de Documentos")}
        </h2>
        <p className="text-secondary-500">
          {t("documentScan.description", "Converta PDFs ou imagens de reservas em dados estruturados com reconhecimento inteligente")}
        </p>
      </div>
      
      <Separator />
      
      <Card className="bg-white shadow">
        <CardHeader className="px-6 py-5">
          <div className="flex items-center mb-2">
            <FileUp className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-xl font-semibold text-secondary-900">
              {t("documentScan.uploadPdfSection", "Processamento Automático de Documentos")}
            </CardTitle>
          </div>
          <p className="text-sm text-secondary-500 mt-1">
            {t("documentScan.uploadPdfDescription", "Faça upload de PDFs de reservas para processamento automático com inteligência artificial")}
          </p>
          <div className="mt-1 flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              O sistema identifica automaticamente todos os tipos de documentos
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <UploadPDF />
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow">
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-xl font-semibold text-secondary-900">
            {t("documentScan.instructionsTitle", "Como Funciona")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                1
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-secondary-900">
                  {t("documentScan.step1Title", "Selecionar ou Capturar")}
                </h4>
                <p className="text-sm text-secondary-600 mt-1">
                  {t("documentScan.step1Description", "Faça upload de PDFs (único ou par de check-in/check-out), selecione imagens ou capture fotos dos documentos de reserva")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                2
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-secondary-900">
                  {t("documentScan.step2Title", "Processamento com IA")}
                </h4>
                <p className="text-sm text-secondary-600 mt-1">
                  {t("documentScan.step2Description", "O sistema analisa automaticamente os dados com OCR e processamento avançado de IA, priorizando Mistral OCR e extraindo informações de reservas")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                3
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-secondary-900">
                  {t("documentScan.step3Title", "Revisão e Confirmação")}
                </h4>
                <p className="text-sm text-secondary-600 mt-1">
                  {t("documentScan.step3Description", "Verifique os dados extraídos e confirme para criar uma nova reserva no sistema")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                4
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-secondary-900">
                  {t("documentScan.step4Title", "Reserva Criada")}
                </h4>
                <p className="text-sm text-secondary-600 mt-1">
                  {t("documentScan.step4Description", "A reserva é automaticamente criada e associada à propriedade, com todos os cálculos feitos")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}