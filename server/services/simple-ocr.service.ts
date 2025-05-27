import { GeminiService } from './gemini.service.js';

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
}

export class SimpleOCRService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
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

    const prompt = `
Você é um especialista em extração de dados de reservas hoteleiras. 
Analise o texto fornecido e extraia TODAS as reservas encontradas.

INSTRUÇÕES:
- Consolida fragmentos inteligentemente
- Deduplica reservas similares  
- Calcula confidence score
- Valida campos críticos

OUTPUT: Responde APENAS com array JSON válido UTF-8.

ESQUEMA:
{
  "data_entrada": "YYYY-MM-DD",
  "data_saida": "YYYY-MM-DD", 
  "noites": 0,
  "nome": "",
  "hospedes": 0,
  "pais": "",
  "site": "",
  "telefone": "",
  "observacoes": ""
}

TEXTO DO DOCUMENTO:
${text}

EXTRAI TODAS AS RESERVAS:`;

    try {
      const response = await this.geminiService.generateText(prompt);
      
      if (!response) {
        throw new Error('Não foi possível processar o documento');
      }

      // Parse da resposta JSON
      let reservations = [];
      try {
        const cleanResponse = response.replace(/```json|```/g, '').trim();
        reservations = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.log('Erro no parse JSON:', parseError);
        throw new Error('Resposta inválida do serviço de IA');
      }

      return {
        success: true,
        reservations: Array.isArray(reservations) ? reservations : [reservations],
        processingTime: Date.now() - startTime,
        message: `Processamento concluído com sucesso. ${reservations.length || 0} reserva(s) encontrada(s).`
      };
    } catch (error) {
      console.error('Erro no processamento OCR:', error);
      return {
        success: false,
        reservations: [],
        processingTime: Date.now() - startTime,
        message: error.message || 'Erro no processamento do documento'
      };
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      // Tentar diversos formatos de data
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // Retorna original se não conseguir parsear
      }
      
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return dateStr;
    }
  }

  async processFile(filePath: string): Promise<OCRResult> {
    try {
      // Import pdf-parse dynamically to handle PDF files
      const pdfParse = (await import('pdf-parse')).default;
      const fs = await import('fs');
      
      // Read and process the PDF file
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      // Extract reservations from the PDF text
      return await this.extractReservationsFromText(pdfData.text);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      return {
        success: false,
        reservations: [],
        processingTime: 0,
        message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  async consolidateReservations(checkInData: any[], checkOutData: any[]): Promise<any[]> {
    // Simple consolidation logic - merge check-in and check-out data
    const consolidated = [];
    
    for (const checkIn of checkInData) {
      const matchingCheckOut = checkOutData.find(checkOut => 
        checkOut.nome === checkIn.nome && 
        checkOut.data_entrada === checkIn.data_entrada
      );
      
      consolidated.push({
        ...checkIn,
        data_saida: matchingCheckOut?.data_saida || checkIn.data_saida,
        observacoes: `${checkIn.observacoes || ''} ${matchingCheckOut?.observacoes || ''}`.trim()
      });
    }
    
    return consolidated;
  }

  private validateAndCleanReservations(reservations: any[]): ExtractedReservation[] {
    return reservations
      .filter(reservation => {
        // Filtrar reservas com dados mínimos necessários
        return reservation.nome && 
               (reservation.data_entrada || reservation.data_saida);
      })
      .map(reservation => ({
        data_entrada: this.formatDate(reservation.data_entrada) || '',
        data_saida: this.formatDate(reservation.data_saida) || '',
        noites: parseInt(reservation.noites) || 0,
        nome: String(reservation.nome || '').trim(),
        hospedes: parseInt(reservation.hospedes) || 1,
        pais: String(reservation.pais || '').trim(),
        site: String(reservation.site || 'Direto').trim(),
        telefone: String(reservation.telefone || '').trim(),
        observacoes: String(reservation.observacoes || '').trim()
      }));
  }
}