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
      
      let buffer;
      if (file.buffer) {
        buffer = file.buffer;
      } else if (file.path) {
        buffer = fs.readFileSync(file.path);
      } else {
        throw new Error('Ficheiro não encontrado - nem buffer nem path estão disponíveis');
      }
      
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
   * Constrói o prompt para extração de reservas usando v4.2
   */
  private buildExtractionPrompt(text: string, documentType: string): string {
    return `# EXTRACTOR DE RESERVAS – v4.2 (schema_version: 1.4)

Persona: És um motor de OCR + parsing ultra-fiável para reservas turísticas.

FUNÇÃO: Receber QUALQUER documento (imagem JPG/PNG, PDF ou texto) e devolver um fluxo estruturado de registos JSON segundo o esquema abaixo, aplicando consolidação inteligente, deduplicação, cálculo de confidence e validação de campos críticos.

PARÂMETROS:
- mode = "json"
- debug = false  
- confidence_threshold = 0.35

SENTINELA: Ao terminares o output escreve na última linha, isolada: END_OF_JSON

OUTPUT: Responde APENAS com array JSON válido UTF-8. Codificação UTF-8 obrigatória.

ESQUEMA (ordem fixa):
{
  "data_entrada": "YYYY-MM-DD",
  "data_saida": "YYYY-MM-DD",
  "noites": 0,
  "nome": "",
  "hospedes": 0,
  "pais": "",
  "pais_inferido": false,
  "site": "",
  "telefone": "",
  "observacoes": "",
  "timezone_source": "",
  "id_reserva": "",
  "confidence": 0.0,
  "source_page": 0,
  "needs_review": false
}

ETAPAS DE PROCESSAMENTO:

ETAPA 1 – PRÉ-OCR: Auto-detectar orientação + idioma (PT, EN, ES, FR, DE). Binarização adaptativa; remover cabeçalhos/rodapés.

ETAPA 2 – SEGMENTAÇÃO: Novo fragmento quando encontra (data & nome) OU (data & preço/hóspedes). Janela de 120 caract. para juntar linhas partidas.

ETAPA 2.1 – CONSOLIDAÇÃO: Agrupar por ≥ 2 de: nome≈, ref_reserva, telefone, datas sobrepostas. Se cluster contém só entrada ou saída → manter, needs_review=true.

ETAPA 3 – MAPEAMENTO & NORMALIZAÇÃO:
- Datas → DD/MM/AAAA … ⇢ YYYY-MM-DD
- Noites → a partir das datas se ausente
- Hóspedes → Adultos + Crianças + Bebés
- País → rótulo directo; se vazio mas telefone tem indicativo válido, preencher e pais_inferido=true
- Telefone → obrigatório; normalizar +<indicativo> <resto>
- Site → Airbnb, Booking.com, Vrbo, Direct, Owner; senão → "Outro"
- id_reserva → SHA-1 de (nome + data_entrada + site)
- confidence → média ponderada de OCR_quality, regex_hits, fusão

ETAPA 4 – VALIDAÇÃO:
- data_entrada ≤ data_saida → senão needs_review=true
- telefone == "" → needs_review=true (campo crítico)
- Se confidence < 0.35 → needs_review=true
- Duplicado estrito eliminar; duplicado soft fundir com needs_review=true

TEXTO DO DOCUMENTO:
${text}

EXTRAI TODAS AS RESERVAS ENCONTRADAS:`;
  }

  /**
   * Limpa a resposta JSON do Gemini v4.2
   */
  private cleanJsonResponse(response: string): string {
    // Remove a sentinela END_OF_JSON e texto depois dela
    let cleaned = response.split('END_OF_JSON')[0];
    
    // Remove markdown e texto extra
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    
    // Remove linhas de debug se existirem
    cleaned = cleaned.replace(/^---[\s\S]*?(?=\[)/m, '');
    
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