import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';

// Interface para os dados extraídos - v4.1
interface ExtractedReservation {
  data_entrada: string;
  data_saida: string;
  noites: number;
  nome: string;
  hospedes: number;
  pais: string;
  pais_inferido: boolean;
  site: string;
  telefone: string;
  observacoes: string;
  timezone_source: string;
  id_reserva: string;
  confidence: number;
  source_page: number;
  needs_review: boolean;
  // Campos legacy para compatibilidade
  guestName?: string;
  propertyName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  totalAmount?: number;
  guestCount?: number;
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
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY não configurada');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Processa um arquivo (PDF ou imagem) e extrai reservas
   */
  async processFile(file: any): Promise<OCRResult> {
    try {
      console.log(`🔄 Processando arquivo: ${file.originalname || file.name}`);
      
      let text = '';
      
      // Extrair texto do arquivo
      if (file.mimetype === 'application/pdf') {
        const buffer = file.buffer || fs.readFileSync(file.path);
        const pdfData = await pdf(buffer);
        text = pdfData.text;
      } else {
        // Para imagens, usar o Gemini Vision
        text = await this.extractTextFromImage(file);
      }

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          type: 'unknown',
          reservations: [],
          error: 'Não foi possível extrair texto do arquivo'
        };
      }

      // Detectar tipo de documento
      const documentType = this.detectDocumentType(text);
      
      // Extrair reservas usando Gemini
      const reservations = await this.extractReservationsWithGemini(text, documentType);
      
      return {
        success: true,
        type: documentType,
        reservations: reservations,
        extractedText: text
      };

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      return {
        success: false,
        type: 'unknown',
        reservations: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Extrai texto de imagem usando Gemini Vision
   */
  private async extractTextFromImage(file: any): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const buffer = file.buffer || fs.readFileSync(file.path);
      const base64 = buffer.toString('base64');
      
      const result = await model.generateContent([
        'Extrai todo o texto desta imagem, mantendo a formatação original:',
        {
          inlineData: {
            data: base64,
            mimeType: file.mimetype
          }
        }
      ]);
      
      return result.response.text();
    } catch (error) {
      console.error('❌ Erro na extração de texto da imagem:', error);
      throw error;
    }
  }

  /**
   * Detecta o tipo de documento baseado no conteúdo
   */
  private detectDocumentType(text: string): 'check-in' | 'check-out' | 'control-file' | 'unknown' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('check-in') || lowerText.includes('entrada')) {
      return 'check-in';
    }
    
    if (lowerText.includes('check-out') || lowerText.includes('saída')) {
      return 'check-out';
    }
    
    if (lowerText.includes('controlo') || lowerText.includes('control')) {
      return 'control-file';
    }
    
    return 'unknown';
  }

  /**
   * Extrai reservas usando Gemini AI
   */
  private async extractReservationsWithGemini(text: string, documentType: string): Promise<ExtractedReservation[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = this.buildExtractionPrompt(text, documentType);
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse do JSON
      const cleanJson = this.cleanJsonResponse(responseText);
      const reservations = JSON.parse(cleanJson);
      
      // Validar e converter para o formato correto
      return this.validateAndCleanReservations(reservations);
      
    } catch (error) {
      console.error('❌ Erro na extração com Gemini:', error);
      return [];
    }
  }

  /**
   * Constrói o prompt para extração de reservas
   */
  private buildExtractionPrompt(text: string, documentType: string): string {
    return `EXTRACTOR DE RESERVAS v4.1 - Motor de OCR ultra-fiável para reservas turísticas

FUNÇÃO: Receber QUALQUER documento e devolver JSON estruturado de reservas.

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
  }

  /**
   * Limpa a resposta JSON do Gemini
   */
  private cleanJsonResponse(response: string): string {
    // Remove markdown e texto extra
    let cleaned = response.replace(/```json/g, '').replace(/```/g, '');
    
    // Encontra o array JSON
    const jsonStart = cleaned.indexOf('[');
    const jsonEnd = cleaned.lastIndexOf(']') + 1;
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    }
    
    return cleaned.trim();
  }

  /**
   * Valida e limpa as reservas extraídas
   */
  private validateAndCleanReservations(reservations: any[]): ExtractedReservation[] {
    if (!Array.isArray(reservations)) {
      return [];
    }
    
    return reservations.map(r => ({
      data_entrada: r.data_entrada || '',
      data_saida: r.data_saida || '',
      noites: Number(r.noites) || 0,
      nome: r.nome || '',
      hospedes: Number(r.hospedes) || 1,
      pais: r.pais || '',
      pais_inferido: Boolean(r.pais_inferido),
      site: r.site || 'Outro',
      telefone: r.telefone || '',
      observacoes: r.observacoes || '',
      timezone_source: r.timezone_source || '',
      id_reserva: r.id_reserva || '',
      confidence: Number(r.confidence) || 0.8,
      source_page: Number(r.source_page) || 1,
      needs_review: Boolean(r.needs_review),
      // Campos legacy
      guestName: r.nome || r.guestName,
      propertyName: r.propertyName || '',
      checkInDate: r.data_entrada || r.checkInDate,
      checkOutDate: r.data_saida || r.checkOutDate,
      totalAmount: Number(r.totalAmount) || 0,
      guestCount: Number(r.hospedes) || Number(r.guestCount) || 1,
      email: r.email || '',
      phone: r.telefone || r.phone || '',
      notes: r.observacoes || r.notes || ''
    })).filter(r => r.nome && r.data_entrada && r.data_saida);
  }

  /**
   * Processa múltiplos arquivos
   */
  async processMultipleFiles(files: any[]): Promise<OCRResult> {
    try {
      const allReservations: ExtractedReservation[] = [];
      
      for (const file of files) {
        const result = await this.processFile(file);
        if (result.success && result.reservations) {
          allReservations.push(...result.reservations);
        }
      }
      
      return {
        success: true,
        type: 'unknown',
        reservations: allReservations
      };
      
    } catch (error) {
      return {
        success: false,
        type: 'unknown',
        reservations: [],
        error: error instanceof Error ? error.message : 'Erro no processamento'
      };
    }
  }
}