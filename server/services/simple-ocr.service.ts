import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';

// Interface para os dados extraídos
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
   * Processa um arquivo (PDF ou imagem) e extrai dados de reservas
   */
  async processFile(filePath: string, mimeType: string): Promise<OCRResult> {
    try {
      console.log('🔍 Iniciando processamento OCR:', filePath, 'Tipo:', mimeType);

      let extractedText = '';

      // Determinar se é PDF ou imagem
      if (mimeType === 'application/pdf') {
        extractedText = await this.extractTextFromPDF(filePath);
      } else if (mimeType.startsWith('image/')) {
        extractedText = await this.extractTextFromImage(filePath);
      } else {
        throw new Error(`Tipo de arquivo não suportado: ${mimeType}`);
      }

      console.log(`📄 Texto extraído com sucesso, caracteres: ${extractedText.length}`);

      // Classificar o documento
      const documentType = await this.classifyDocument(extractedText);
      console.log(`📋 Tipo de documento identificado: ${documentType}`);

      // Extrair dados estruturados
      const reservations = await this.extractReservationData(extractedText, documentType);

      return {
        success: true,
        type: documentType,
        reservations,
        extractedText: extractedText.substring(0, 1000) // Primeiros 1000 chars para debug
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
   * Extrai texto de PDF usando pdf-parse
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  /**
   * Extrai texto de imagem usando Gemini Vision
   */
  private async extractTextFromImage(filePath: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imageData = fs.readFileSync(filePath);
    const base64Image = imageData.toString('base64');
    
    const result = await model.generateContent([
      "Extraia todo o texto desta imagem de forma precisa. Mantenha a formatação e estrutura original.",
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg"
        }
      }
    ]);
    
    const response = await result.response;
    return response.text();
  }

  /**
   * Classifica o tipo de documento baseado no conteúdo
   */
  private async classifyDocument(text: string): Promise<'check-in' | 'check-out' | 'control-file' | 'unknown'> {
    // Detectar arquivos de controle (múltiplas reservas)
    const reservationIndicators = [
      /check[\-\s]*in/gi,
      /check[\-\s]*out/gi,
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /\d{4}-\d{2}-\d{2}/g,
      /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi
    ];
    
    let indicatorCount = 0;
    for (const pattern of reservationIndicators) {
      const matches = text.match(pattern);
      if (matches) {
        indicatorCount += matches.length;
      }
    }
    
    if (indicatorCount > 5) {
      return 'control-file';
    }
    
    if (text.toLowerCase().includes('check-in') || text.toLowerCase().includes('entrada')) {
      return 'check-in';
    }
    
    if (text.toLowerCase().includes('check-out') || text.toLowerCase().includes('saida')) {
      return 'check-out';
    }
    
    return 'control-file';
  }

  /**
   * Extrai dados estruturados do texto usando Gemini
   */
  private async extractReservationData(text: string, documentType: string): Promise<ExtractedReservation[]> {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const prompt = this.buildExtractionPrompt(text, documentType);
    
    try {
      console.log('🤖 Enviando prompt para Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const extractedText = response.text();

      // Tentar extrair JSON válido
      let parsedData;
      
      const jsonCodeBlockMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonCodeBlockMatch) {
        try {
          parsedData = JSON.parse(jsonCodeBlockMatch[1]);
        } catch (e) {
          console.log('❌ Falha na estratégia 1 (code block)');
        }
      }
      
      if (!parsedData) {
        const arrayMatch = extractedText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            parsedData = JSON.parse(arrayMatch[0]);
          } catch (e) {
            console.log('❌ Falha na estratégia 2 (array)');
          }
        }
      }

      if (!parsedData) {
        console.log('❌ Não foi possível extrair JSON válido');
        return [];
      }

      console.log(`✅ Gemini extraiu ${Array.isArray(parsedData) ? parsedData.length : 0} reservas`);
      
      const reservations = Array.isArray(parsedData) ? parsedData : [parsedData];
      return this.convertV41ToLegacy(reservations);

    } catch (error) {
      console.error('❌ Erro na extração de dados:', error);
      return [];
    }
  }

  /**
   * Constrói o prompt para extração de dados
   */
  private buildExtractionPrompt(text: string, documentType: string): string {
    return `
EXTRACTOR DE RESERVAS v4.1 - Motor de OCR ultra-fiável para reservas turísticas

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
   * Converte dados do formato v4.1 para formato legacy
   */
  private convertV41ToLegacy(reservations: any[]): ExtractedReservation[] {
    return reservations.map(r => ({
      // Formato v4.1
      data_entrada: r.data_entrada || r.checkInDate || '',
      data_saida: r.data_saida || r.checkOutDate || '',
      noites: r.noites || 0,
      nome: r.nome || r.guestName || '',
      hospedes: r.hospedes || r.guestCount || 1,
      pais: r.pais || '',
      pais_inferido: r.pais_inferido || false,
      site: r.site || 'Outro',
      telefone: r.telefone || r.phone || '',
      observacoes: r.observacoes || r.notes || '',
      timezone_source: r.timezone_source || '',
      id_reserva: r.id_reserva || '',
      confidence: r.confidence || 0.8,
      source_page: r.source_page || 1,
      needs_review: r.needs_review || false,
      // Campos legacy para compatibilidade
      guestName: r.nome || r.guestName || '',
      propertyName: r.propriedade || r.propertyName || '',
      checkInDate: r.data_entrada || r.checkInDate || '',
      checkOutDate: r.data_saida || r.checkOutDate || '',
      totalAmount: r.valor_total || r.totalAmount || 0,
      guestCount: r.hospedes || r.guestCount || 1,
      email: r.email || null,
      phone: r.telefone || r.phone || null,
      notes: r.observacoes || r.notes || null
    }));
  }

  /**
   * Processa múltiplos arquivos e consolida dados
   */
  async processMultipleFiles(files: Array<{path: string, mimeType: string}>): Promise<{
    success: boolean;
    consolidatedReservations: ExtractedReservation[];
    totalReservations: number;
    consolidatedCount: number;
  }> {
    try {
      console.log(`📄 Processando ${files.length} arquivos para consolidação...`);
      
      let allReservations: ExtractedReservation[] = [];
      
      // Processar cada arquivo
      for (const file of files) {
        console.log(`🔍 Processando: ${file.path.split('/').pop()}`);
        const result = await this.processFile(file.path, file.mimeType);
        
        if (result.success && result.reservations.length > 0) {
          allReservations.push(...result.reservations);
          console.log(`✅ OCR concluído, reservas encontradas: ${result.reservations.length}`);
        }
      }
      
      // Consolidar reservas (juntar check-in com check-out pelo nome)
      const consolidatedReservations = this.consolidateReservations(allReservations);
      
      console.log(`✅ Consolidação concluída: ${consolidatedReservations.length} reservas finais`);
      
      return {
        success: true,
        consolidatedReservations,
        totalReservations: allReservations.length,
        consolidatedCount: allReservations.length - consolidatedReservations.length
      };
      
    } catch (error) {
      console.error('❌ Erro no processamento múltiplo:', error);
      return {
        success: false,
        consolidatedReservations: [],
        totalReservations: 0,
        consolidatedCount: 0
      };
    }
  }

  private consolidateReservations(reservations: ExtractedReservation[]): ExtractedReservation[] {
    return reservations; // Placeholder - implementar lógica de consolidação
  }
}