import { UploadPDF } from "@/components/dashboard/upload-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, FileUp, Image, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { usePdfUpload } from "@/hooks/use-pdf-upload";

export default function DocumentScanPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleFileUpload } = usePdfUpload();
  
  // Função para capturar imagem da câmera
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoEl = document.createElement('video');
      videoEl.srcObject = stream;
      videoEl.play();
      
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoEl, 0, 0);
        
        // Converter para base64
        const imageBase64 = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageBase64);
        
        // Parar todas as trilhas da stream
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: t("documentScan.imageCaptured", "Imagem capturada"),
          description: t("documentScan.readyToProcess", "Imagem pronta para processamento"),
        });
      }, 500);
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      toast({
        title: t("documentScan.cameraError", "Erro na câmera"),
        description: t("documentScan.cameraAccessDenied", "Não foi possível acessar a câmera do dispositivo"),
        variant: "destructive"
      });
    }
  };
  
  // Função para processar imagem capturada
  const processImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    try {
      // Converter base64 para File
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      
      // Usar o mesmo processamento do PDF, já que o serviço OCR suporta imagens
      await handleFileUpload(file);
      
      toast({
        title: t("documentScan.processSuccess", "Processamento concluído"),
        description: t("documentScan.imageProcessed", "Imagem processada com sucesso")
      });
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      toast({
        title: t("documentScan.processError", "Erro no processamento"),
        description: t("documentScan.processErrorDesc", "Não foi possível processar a imagem"),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSelectedImage(null);
    }
  };
  
  // Função para selecionar arquivo de imagem
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: t("documentScan.invalidFile", "Arquivo inválido"),
        description: t("documentScan.selectImageFile", "Por favor selecione uma imagem"),
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Gatilho para seleção de arquivo de imagem
  const triggerImageFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
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
      
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            {t("documentScan.pdfTab", "PDF")}
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            {t("documentScan.imageTab", "Imagem")}
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {t("documentScan.cameraTab", "Câmera")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pdf" className="mt-0">
          <Card className="bg-white shadow">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-xl font-semibold text-secondary-900">
                {t("documentScan.uploadPdfSection", "Upload de PDFs")}
              </CardTitle>
              <p className="text-sm text-secondary-500 mt-1">
                {t("documentScan.uploadPdfDescription", "Faça upload de PDFs de reservas para processamento com IA")}
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <UploadPDF />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="image" className="mt-0">
          <Card className="bg-white shadow">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-xl font-semibold text-secondary-900">
                {t("documentScan.uploadImageSection", "Upload de Imagens")}
              </CardTitle>
              <p className="text-sm text-secondary-500 mt-1">
                {t("documentScan.uploadImageDescription", "Faça upload de imagens de reservas para processamento com OCR")}
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                className="hidden"
                onChange={handleImageFileSelect}
              />
              
              {!selectedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label className="relative cursor-pointer rounded-md bg-white font-semibold text-primary hover:text-primary-600">
                      <Button 
                        onClick={triggerImageFileSelect}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {t("documentScan.selectImage", "Selecionar imagem")}
                      </Button>
                    </label>
                  </div>
                  <p className="text-xs leading-5 text-gray-500 mt-2">
                    {t("documentScan.imageSupport", "Suporte para PNG, JPG ou JPEG")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative border rounded-lg overflow-hidden">
                    <img 
                      src={selectedImage} 
                      alt="Imagem selecionada" 
                      className="w-full object-contain max-h-[300px]" 
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedImage(null)}
                    >
                      {t("documentScan.remove", "Remover")}
                    </Button>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={processImage}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? 
                        t("documentScan.processing", "Processando...") : 
                        t("documentScan.processImage", "Processar imagem")
                      }
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="camera" className="mt-0">
          <Card className="bg-white shadow">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-xl font-semibold text-secondary-900">
                {t("documentScan.cameraCaptureSection", "Captura com Câmera")}
              </CardTitle>
              <p className="text-sm text-secondary-500 mt-1">
                {t("documentScan.cameraCaptureDescription", "Tire uma foto do documento diretamente com a câmera do dispositivo")}
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {!selectedImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                    <Button 
                      onClick={handleCameraCapture}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {t("documentScan.captureImage", "Capturar imagem")}
                    </Button>
                  </div>
                  <p className="text-xs leading-5 text-gray-500 mt-2">
                    {t("documentScan.cameraPermission", "Será necessário permitir acesso à câmera")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative border rounded-lg overflow-hidden">
                    <img 
                      src={selectedImage} 
                      alt="Imagem capturada" 
                      className="w-full object-contain max-h-[300px]" 
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setSelectedImage(null)}
                    >
                      {t("documentScan.remove", "Remover")}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={handleCameraCapture}
                      disabled={isProcessing}
                    >
                      {t("documentScan.newCapture", "Nova captura")}
                    </Button>
                    
                    <Button 
                      onClick={processImage}
                      disabled={isProcessing}
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? 
                        t("documentScan.processing", "Processando...") : 
                        t("documentScan.processImage", "Processar imagem")
                      }
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
                  {t("documentScan.step1Description", "Faça upload de PDFs, selecione imagens ou capture fotos diretamente dos documentos de reserva")}
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
                  {t("documentScan.step2Description", "O sistema analisa automaticamente os dados com OCR e processamento Mistral AI, independente do formato")}
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