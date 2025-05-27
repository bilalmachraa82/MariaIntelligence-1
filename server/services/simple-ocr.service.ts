import { GeminiService } from './gemini.service.js';
import { OpenRouterService } from './openrouter.service.js';

export interface ExtractedReservation {
  data_entrada: string;
  data_saida: string;
  noites: number;
  nome: string;
  hospedes: number;
  pais: string;
  site: string;
  telefone: string;
  observacoes: string;
}

export interface OCRResult {
  success: boolean;
  reservations: ExtractedReservation[];
  processingTime: number;
  message: string;
  type?: string;
  error?: string;
}

export class SimpleOCRService {
  private geminiService: GeminiService;
  private openRouterService: OpenRouterService;

  constructor() {
    this.geminiService = new GeminiService();
    this.openRouterService = new OpenRouterService();
  }

  async extractReservationsFromText(text: string): Promise<OCRResult> {
    const startTime = Date.now();

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        reservations: [],
        processingTime: Date.now() - startTime,
        message: 'Texto vazio fornecido'
      };
    }

    const prompt = `Analisa este texto e extrai todas as reservas encontradas. Responde APENAS com um array JSON válido no formato:

[
  {
    "data_entrada": "YYYY-MM-DD",
    "data_saida": "YYYY-MM-DD",
    "noites": número,
    "nome": "Nome do hóspede",
    "hospedes": número,
    "pais": "País",
    "site": "Plataforma (Booking, Airbnb, etc)",
    "telefone": "Telefone se disponível",
    "observacoes": "Observações se disponíveis"
  }
]

TEXTO:
${text}`;

    try {
      const response = await this.geminiService.generateText(prompt);
      
      if (!response) {
        throw new Error('Não foi possível processar o documento');
      }

      console.log('🤖 Resposta do Gemini recebida');
      console.log('Primeiros 500 chars:', response.substring(0, 500));
      
      // Limpar e processar resposta
      let cleanedResponse = response.trim();
      
      // Remover markdown se presente
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Tentar extrair array JSON
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      let reservations: ExtractedReservation[] = [];
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        reservations = Array.isArray(parsed) ? parsed : [parsed];
        console.log(`✅ JSON parseado com sucesso: ${reservations.length} reservas`);
      } catch (parseError) {
        console.log('🔧 Erro no JSON, tentando extrair manualmente...');
        
        // Extração manual como fallback
        const lines = text.split('\n');
        for (const line of lines) {
          const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
          const dates = line.match(datePattern);
          
          if (dates && dates.length >= 2) {
            // Encontrou linha com datas
            const parts = line.split(/\s+/);
            let nome = '';
            let hospedes = 2;
            let pais = '';
            let site = 'Booking';
            
            for (const part of parts) {
              if (!datePattern.test(part) && 
                  !part.match(/^\d+$/) && 
                  part.length > 1 && 
                  !part.toLowerCase().includes('booking')) {
                if (!nome) {
                  nome = part;
                } else if (!pais && part.length > 2) {
                  pais = part;
                }
              } else if (part.match(/^\d+$/) && parseInt(part) <= 10) {
                hospedes = parseInt(part);
              }
            }
            
            if (nome && dates[0] && dates[1]) {
              const data_entrada = this.formatDateToISO(dates[0]);
              const data_saida = this.formatDateToISO(dates[1]);
              
              reservations.push({
                data_entrada,
                data_saida,
                noites: this.calculateNights(data_entrada, data_saida),
                nome,
                hospedes,
                pais,
                site,
                telefone: '',
                observacoes: ''
              });
            }
          }
        }
      }
      
      console.log(`📊 Total de reservas processadas: ${reservations.length}`);
      
      return {
        success: reservations.length > 0,
        reservations,
        processingTime: Date.now() - startTime,
        message: reservations.length > 0 
          ? `Processamento concluído com sucesso. ${reservations.length} reserva(s) encontrada(s).`
          : `Documento processado mas nenhuma reserva foi encontrada.`
      };
    } catch (error) {
      console.error('Erro no processamento OCR:', error);
      return {
        success: false,
        reservations: [],
        processingTime: Date.now() - startTime,
        message: (error instanceof Error ? error.message : 'Erro no processamento do documento')
      };
    }
  }

  async processFile(filePath: string, mimeType?: string): Promise<OCRResult & { type?: string }> {
    try {
      // Import pdf-parse dynamically to handle PDF files
      const pdfParse = (await import('pdf-parse')).default;
      const fs = await import('fs');
      
      // Read and process the PDF file
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      console.log(`📄 PDF processado: ${pdfData.text.length} caracteres extraídos`);
      
      // Extract reservations from the PDF text
      const result = await this.extractReservationsFromText(pdfData.text);
      
      // Add document type classification
      return {
        ...result,
        type: this.classifyDocumentType(pdfData.text)
      };
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      return {
        success: false,
        reservations: [],
        processingTime: 0,
        message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        type: 'unknown'
      };
    }
  }

  private formatDateToISO(dateStr: string): string {
    try {
      // Converter DD/MM/YYYY para YYYY-MM-DD
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    try {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const diffTime = Math.abs(outDate.getTime() - inDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(diffDays, 1);
    } catch {
      return 1;
    }
  }

  private classifyDocumentType(text: string): string {
    if (text.includes('AROEIRA') && text.includes('Data entrada')) {
      return 'aroeira-control';
    }
    if (text.includes('check-in') || text.includes('entrada')) {
      return 'check-in';
    }
    if (text.includes('check-out') || text.includes('saída')) {
      return 'check-out';
    }
    return 'unknown';
  }
}