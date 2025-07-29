import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clipboard, ClipboardCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTextImport } from "@/hooks/use-text-import";
import { useProperties } from "@/hooks/use-properties";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface TextImportPanelProps {
  onImportComplete: (data: any) => void;
}

export function TextImportPanel({ onImportComplete }: TextImportPanelProps) {
  const [inputText, setInputText] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>();
  const [showClarificationForm, setShowClarificationForm] = useState(false);
  const [pastingFromClipboard, setPastingFromClipboard] = useState(false);
  
  const { 
    isImporting, 
    importData, 
    clarificationAnswers,
    importFromText,
    updateClarificationAnswer,
    resetImport
  } = useTextImport();
  
  const { data: properties } = useProperties();

  // Função para lidar com o botão de colar da área de transferência
  const handlePasteFromClipboard = async () => {
    try {
      setPastingFromClipboard(true);
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setInputText(clipboardText);
      }
    } catch (error) {
      console.error("Erro ao acessar a área de transferência:", error);
    } finally {
      setPastingFromClipboard(false);
    }
  };

  // Importar o texto
  const handleImport = async () => {
    if (!inputText.trim()) return;
    
    const result = await importFromText(inputText, selectedPropertyId);
    
    if (result?.needsClarification) {
      setShowClarificationForm(true);
    } else if (result?.success && result?.reservationData) {
      // Se tiver sucesso e não precisar de esclarecimentos, passa os dados para o componente pai
      if (typeof onImportComplete === 'function') {
        onImportComplete(result.reservationData);
      }
    }
  };

  // Enviar respostas de esclarecimento e reimportar
  const handleClarificationSubmit = async () => {
    const result = await importFromText(inputText, selectedPropertyId);
    
    if (result?.success && !result.needsClarification && result.reservationData) {
      setShowClarificationForm(false);
      if (typeof onImportComplete === 'function') {
        onImportComplete(result.reservationData);
      }
    }
  };

  // Resetar o formulário
  const handleReset = () => {
    setInputText("");
    setSelectedPropertyId(undefined);
    setShowClarificationForm(false);
    resetImport();
  };

  return (
    <div className="space-y-6">
      {/* Se não estiver mostrando o formulário de esclarecimento, mostrar a entrada de texto */}
      {!showClarificationForm && (
        <>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="import-text">
                Texto da Reserva
              </Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handlePasteFromClipboard}
                disabled={pastingFromClipboard}
              >
                {pastingFromClipboard ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Colando...
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Colar da Área de Transferência
                  </>
                )}
              </Button>
            </div>
            
            <Textarea
              id="import-text"
              placeholder="Cole aqui o texto com os detalhes da reserva (email, mensagem, etc.)"
              className="min-h-[200px]"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Label htmlFor="property-select">Propriedade (opcional)</Label>
                <Select
                  value={selectedPropertyId?.toString() || ''}
                  onValueChange={(value) => setSelectedPropertyId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((property) => (
                      <SelectItem 
                        key={property.id.toString()} 
                        value={property.id.toString()}
                      >
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecionar uma propriedade permite criar a reserva automaticamente
                </p>
              </div>
              
              <div className="flex items-end space-x-2">
                <Button 
                  onClick={handleImport} 
                  disabled={!inputText.trim() || isImporting}
                  className="flex-1 md:flex-none"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    'Extrair Dados'
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={isImporting}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mostrar alguma mensagem de erro se houver */}
          {importData && !importData.success && (
            <Alert variant="destructive">
              <AlertTitle>Erro na extração</AlertTitle>
              <AlertDescription>
                {importData.message || importData.error || "Não foi possível extrair os dados da reserva. Verifique o texto e tente novamente."}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
      
      {/* Formulário de esclarecimento */}
      {showClarificationForm && importData?.clarificationQuestions && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">
              Precisamos de algumas informações adicionais
            </h3>
            
            <div className="space-y-4">
              {importData.clarificationQuestions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`question-${index}`}>{question}</Label>
                  <Input
                    id={`question-${index}`}
                    value={clarificationAnswers[question] || ''}
                    onChange={(e) => updateClarificationAnswer(question, e.target.value)}
                    placeholder="Sua resposta"
                  />
                </div>
              ))}
              
              <div className="flex space-x-2 pt-2">
                <Button 
                  onClick={handleClarificationSubmit} 
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Enviar Respostas'
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowClarificationForm(false);
                    resetImport();
                  }}
                >
                  Voltar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Exibir dados extraídos (opcional - geralmente os dados serão passados ao componente pai) */}
      {importData?.success && !importData.needsClarification && importData.reservationData && (
        <Alert>
          <ClipboardCheck className="h-4 w-4" />
          <AlertTitle>Dados extraídos com sucesso</AlertTitle>
          <AlertDescription>
            Os dados da reserva foram extraídos e enviados ao formulário.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}