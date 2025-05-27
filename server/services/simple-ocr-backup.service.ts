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
   * Converte dados do formato v4.1 para formato legacy
   */
  private convertV41ToLegacy(reservations: any[]): ExtractedReservation[] {
    return reservations.map(r => ({
      // Formato v4.1
      data_entrada: r.data_entrada || r.checkInDate,
      data_saida: r.data_saida || r.checkOutDate,
      noites: r.noites || 0,
      nome: r.nome || r.guestName,
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
      guestName: r.nome || r.guestName,
      propertyName: r.propriedade || r.propertyName || '',
      checkInDate: r.data_entrada || r.checkInDate,
      checkOutDate: r.data_saida || r.checkOutDate,
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