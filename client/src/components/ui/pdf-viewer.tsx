import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  file: File | null;
  onClose: () => void;
}

export function PDFViewer({ file, onClose }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setError("No file provided");
      setLoading(false);
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Invalid file type. Only PDFs are supported.");
      setLoading(false);
      return;
    }

    // Create object URL for the PDF
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setLoading(false);

    // Clean up the object URL when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (loading) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <CardContent>
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-primary/50 animate-pulse" />
            <p className="mt-4 text-sm text-secondary-500">Carregando PDF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <CardContent>
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
            <p className="mt-4 text-sm text-secondary-700">{error}</p>
            <Button 
              className="mt-4" 
              variant="secondary" 
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={onClose}
        >
          Fechar
        </Button>
      </div>
      <iframe
        src={pdfUrl || ""}
        className="w-full h-[500px] rounded-md border border-secondary-200"
        title="PDF Viewer"
      />
    </div>
  );
}

interface PDFUploadResultProps {
  success: boolean;
  message: string;
  onClose: () => void;
}

export function PDFUploadResult({ success, message, onClose }: PDFUploadResultProps) {
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="text-center">
          {success ? (
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
          ) : (
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
          )}
          <p className="mt-4 text-sm text-secondary-700">{message}</p>
          <Button 
            className="mt-4" 
            variant={success ? "default" : "secondary"} 
            onClick={onClose}
          >
            {success ? "Continuar" : "Fechar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
