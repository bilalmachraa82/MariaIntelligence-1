import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';

// Interface para os dados extraídos
interface ExtractedReservation {
  guestName: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  guestCount: number;
  email?: string;
  phone?: string;
  notes?: string;
}

interface OCRResult {
  success: boolean;
  type: 'check-in' | 'check-out' | 'control-file' | 'unknown';
  reservations: ExtractedReservation[];
  extractedText?: string;
  error?: string;
}

export class SimpleOCRService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Processa um arquivo PDF e extrai dados de reservas
   */
  async processPDF(filePath: string): Promise<OCRResult> {
    try {
      console.log('🔍 Iniciando processamento OCR:', filePath);

      // 1. Extrair texto do PDF
      const extractedText = await this.extractTextFromPDF(filePath);
      
      if (!extractedText.trim()) {
        return {
          success: false,
          type: 'unknown',
          reservations: [],
          error: 'Não foi possível extrair texto do PDF'
        };
      }

      console.log('📄 Texto extraído com sucesso, caracteres:', extractedText.length);

      // 2. Classificar tipo de documento
      const documentType = await this.classifyDocument(extractedText);
      console.log('📋 Tipo de documento identificado:', documentType);

      // 3. Extrair dados estruturados com Gemini
      const reservations = await this.extractReservationData(extractedText, documentType);
      
      console.log('✅ OCR concluído, reservas encontradas:', reservations.length);

      return {
        success: true,
        type: documentType,
        reservations,
        extractedText: extractedText.slice(0, 500) + '...' // Primeiro 500 caracteres para debug
      };

    } catch (error) {
      console.error('❌ Erro no processamento OCR:', error);
      return {
        success: false,
        type: 'unknown',
        reservations: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Extrai texto de um PDF usando pdf-parse
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  /**
   * Classifica o tipo de documento
   */
  private async classifyDocument(text: string): Promise<'check-in' | 'check-out' | 'control-file' | 'unknown'> {
    // Análise simples baseada em palavras-chave
    const lowerText = text.toLowerCase();

    if (lowerText.includes('check-in') || lowerText.includes('entrada')) {
      return 'check-in';
    }
    
    if (lowerText.includes('check-out') || lowerText.includes('saída')) {
      return 'check-out';
    }
    
    if (lowerText.includes('controlo') || lowerText.includes('aroeira') || lowerText.includes('multiple')) {
      return 'control-file';
    }

    // Se tem múltiplas datas, provavelmente é um arquivo de controle
    const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || [];
    if (dateMatches.length > 4) {
      return 'control-file';
    }

    return 'unknown';
  }

  /**
   * Extrai dados de reservas usando Gemini
   */
  private async extractReservationData(text: string, documentType: string): Promise<ExtractedReservation[]> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = this.buildExtractionPrompt(text, documentType);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const extractedText = response.text();

      console.log('🤖 Resposta do Gemini:', extractedText.slice(0, 200) + '...');

      // Parse da resposta JSON
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Gemini não retornou JSON válido');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      if (!parsedData.reservations || !Array.isArray(parsedData.reservations)) {
        throw new Error('Formato de resposta inválido do Gemini');
      }

      return this.validateAndCleanReservations(parsedData.reservations);

    } catch (error) {
      console.error('❌ Erro ao extrair dados com Gemini:', error);
      throw new Error(`Erro na extração de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Constrói o prompt para o Gemini baseado no tipo de documento
   */
  private buildExtractionPrompt(text: string, documentType: string): string {
    const basePrompt = `
Você é um especialista em extração de dados de documentos de hospedagem.
Analise o texto abaixo e extraia TODAS as reservas mencionadas.

IMPORTANTE:
- Retorne APENAS um JSON válido
- Datas no formato YYYY-MM-DD
- Valores monetários como números (sem símbolos)
- Se não encontrar um campo, use null

Formato de resposta:
{
  "reservations": [
    {
      "guestName": "Nome do hóspede",
      "propertyName": "Nome da propriedade", 
      "checkInDate": "YYYY-MM-DD",
      "checkOutDate": "YYYY-MM-DD",
      "totalAmount": 150.00,
      "guestCount": 2,
      "email": "email@exemplo.com",
      "phone": "+351123456789",
      "notes": "Observações adicionais"
    }
  ]
}

TEXTO DO DOCUMENTO:
${text}
`;

    if (documentType === 'control-file') {
      return basePrompt + `
      
ATENÇÃO: Este é um arquivo de controle com MÚLTIPLAS RESERVAS.
Procure por padrões repetitivos e extraia CADA reserva individual.
Propriedades comuns: Aroeira I, Aroeira II, Ajuda, Sete Rios, etc.`;
    }

    return basePrompt;
  }

  /**
   * Valida e limpa os dados das reservas extraídas
   */
  private validateAndCleanReservations(reservations: any[]): ExtractedReservation[] {
    return reservations
      .filter(reservation => {
        // Filtrar reservas com dados mínimos obrigatórios
        return reservation.guestName && 
               reservation.checkInDate && 
               reservation.checkOutDate;
      })
      .map(reservation => ({
        guestName: String(reservation.guestName).trim(),
        propertyName: reservation.propertyName ? String(reservation.propertyName).trim() : '',
        checkInDate: this.formatDate(reservation.checkInDate),
        checkOutDate: this.formatDate(reservation.checkOutDate),
        totalAmount: this.parseAmount(reservation.totalAmount),
        guestCount: this.parseGuestCount(reservation.guestCount),
        email: reservation.email ? String(reservation.email).trim() : undefined,
        phone: reservation.phone ? String(reservation.phone).trim() : undefined,
        notes: reservation.notes ? String(reservation.notes).trim() : undefined,
      }));
  }

  /**
   * Formata datas para YYYY-MM-DD
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      // Tentar vários formatos de data
      const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
      
      if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return cleanDate; // Já está no formato correto
      }
      
      if (cleanDate.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
        const parts = cleanDate.split(/[\/\-]/);
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      
      if (cleanDate.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2}$/)) {
        const parts = cleanDate.split(/[\/\-]/);
        const year = parseInt(parts[2]) + (parseInt(parts[2]) > 50 ? 1900 : 2000);
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      
      return dateStr; // Retornar original se não conseguir processar
    } catch {
      return dateStr;
    }
  }

  /**
   * Parse valores monetários
   */
  private parseAmount(amount: any): number {
    if (typeof amount === 'number') return amount;
    if (!amount) return 0;
    
    const cleanAmount = String(amount).replace(/[€$£,\s]/g, '');
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parse número de hóspedes
   */
  private parseGuestCount(count: any): number {
    if (typeof count === 'number') return count;
    if (!count) return 1;
    
    const parsed = parseInt(String(count));
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }
}