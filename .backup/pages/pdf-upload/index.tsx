import { UploadPDF } from "@/components/dashboard/upload-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export default function PDFUploadPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          {t("pdfUpload.title", "Processamento de Reservas")}
        </h2>
        <p className="text-secondary-500">
          {t("pdfUpload.description", "Converta PDFs de reservas em dados estruturados automaticamente")}
        </p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white shadow">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-xl font-semibold text-secondary-900">
              {t("pdfUpload.uploadSection", "Upload de PDFs")}
            </CardTitle>
            <p className="text-sm text-secondary-500 mt-1">
              {t("pdfUpload.uploadDescription", "Faça upload de PDFs de reservas para processamento com IA")}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <UploadPDF />
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-xl font-semibold text-secondary-900">
              {t("pdfUpload.instructionsTitle", "Como Funciona")}
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
                    {t("pdfUpload.step1Title", "Selecionar PDFs")}
                  </h4>
                  <p className="text-sm text-secondary-600 mt-1">
                    {t("pdfUpload.step1Description", "Faça upload de um ou múltiplos arquivos PDF das plataformas de reserva")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                  2
                </div>
                <div className="ml-4">
                  <h4 className="text-base font-medium text-secondary-900">
                    {t("pdfUpload.step2Title", "Processamento com IA")}
                  </h4>
                  <p className="text-sm text-secondary-600 mt-1">
                    {t("pdfUpload.step2Description", "O sistema analisa automaticamente os dados com OCR e processamento Mistral AI")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                  3
                </div>
                <div className="ml-4">
                  <h4 className="text-base font-medium text-secondary-900">
                    {t("pdfUpload.step3Title", "Revisão e Confirmação")}
                  </h4>
                  <p className="text-sm text-secondary-600 mt-1">
                    {t("pdfUpload.step3Description", "Verifique os dados extraídos e confirme para criar uma nova reserva no sistema")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 flex-shrink-0">
                  4
                </div>
                <div className="ml-4">
                  <h4 className="text-base font-medium text-secondary-900">
                    {t("pdfUpload.step4Title", "Reserva Criada")}
                  </h4>
                  <p className="text-sm text-secondary-600 mt-1">
                    {t("pdfUpload.step4Description", "A reserva é automaticamente criada e associada à propriedade, com todos os cálculos feitos")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}