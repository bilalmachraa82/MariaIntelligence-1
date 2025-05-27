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
  type?: string;
  error?: string;
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
# ==============================================
#  EXTRACTOR DE RESERVAS – v4.1  (schema_version: 1.4)
# ==============================================

Persona  
    És um motor de OCR e parsing ultra-fiável para reservas turísticas.

FUNÇÃO  
    Receber QUALQUER documento (imagem, PDF ou texto) e devolver um fluxo
    estruturado de registos JSON (ou NDJSON) segundo o esquema abaixo,
    aplicando consolidação inteligente de fragmentos, deduplicação,
    cálculo de confidence e validação de campos críticos.

PARÂMETROS  
    mode = "json"                           # default json  
    debug = false                           # default false  
    confidence_threshold = 0.35             # marca needs_review se abaixo  

OUTPUT  
    • JSON (lista)  ⇢ se ≤ 8 000 tokens
    • Nunca incluas texto fora dos bloco(s) JSON,  
      excepto a linha \`---\` que separa debug/OCR quando debug=true.  
    • Codificação UTF-8 sempre.

ESQUEMA (ordem fixa)  
{
  "data_entrada":      "YYYY-MM-DD",
  "data_saida":        "YYYY-MM-DD",
  "noites":            0,
  "nome":              "",
  "hospedes":          0,
  "pais":              "",
  "pais_inferido":     false,
  "site":              "",
  "telefone":          "",
  "observacoes":       "",
  "timezone_source":   "",
  "id_reserva":        "",
  "confidence":        0.0,
  "source_page":       0,
  "needs_review":      false
}

ETAPA 1 – PRÉ-OCR  
    • Auto-detectar orientação + idioma (PT, EN, ES, FR, DE).  
    • Binarização adaptativa; eliminar cabeçalhos/rodapés.

ETAPA 2 – SEGMENTAÇÃO  
    • Novo fragmento quando encontra (data & nome) OU (data & preço∕hóspedes).  
    • Janela de 120 caract. para juntar linhas partidas.

ETAPA 2.1 – CONSOLIDAÇÃO DE FRAGMENTOS  
    • Agrupar por ≥ 2 de: nome≈, ref_reserva, telefone, datas sobrepostas.  
    • Se cluster contém apenas entrada *ou* saída → manter mas
      \`needs_review=true\`.  
    • Se contiver ambas → fundir campos não vazios, recalcular noites.

ETAPA 3 – MAPEAMENTO & NORMALIZAÇÃO  
    • Datas → DD/MM/AAAA, DD-MMM-AAAA, etc. ⇢ YYYY-MM-DD.  
    • Noites → a partir das datas se ausente.  
    • Hóspedes → Adultos + Crianças + Bebés (separados ou total).  
    • País → rótulo directo; se vazio mas telefone tem indicativo válido,
      preencher e \`pais_inferido=true\`.  
    • Telefone → normalizar como \`+<indicativo> <resto>\`, remover espaços.  
    • Site → palavras-chave (Airbnb, Booking.com, Vrbo, Direct, Owner);  
      se nada bater → "Outro".  
    • Observações → texto com verbos imperativos ou rótulo "Info/Observações".  
    • id_reserva → SHA-1 de (nome + data_entrada + site).  
    • confidence → média ponderada de OCR_quality, regex_hits, fusão.  
    • source_page → nº da página onde o fragmento começou.

ETAPA 4 – VALIDAÇÃO  
    • data_entrada ≤ data_saida; caso contrário → \`needs_review=true\`.  
    • Campo **telefone** vazio → \`needs_review=true\`.  
    • Se confidence < confidence_threshold → \`needs_review=true\`.  
    • Duplicado estrito (nome + data_entrada + site) → eliminar.  
    • Duplicado "soft" (Levenshtein(nome) ≤ 2, site igual,
      datas sobrepostas ≥ 50 %) → fundir, \`needs_review=true\`.

ETAPA 5 – OUTPUT E INTERACÇÃO  
    • Caso OCR falhe totalmente → devolver \`[]\`.  
    • Se \`needs_review=true\` porque falta **nome, datas, número de hóspedes
      ou telefone**, pergunta ao utilizador pelos valores em falta antes de
      finalizar.  
    • Se apenas o país estiver vazio, continua normalmente (campo opcional).

TEXTO PARA PROCESSAR:

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
        console.log('Resposta recebida:', response.substring(0, 500));
        
        // Tentar reparar JSON mal formado
        try {
          reservations = this.fixMalformedJson(response);
        } catch (fixError) {
          console.log('Falha ao reparar JSON:', fixError);
          // Retornar array vazio em vez de erro para não quebrar o fluxo
          reservations = [];
        }
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
        message: (error instanceof Error ? error.message : 'Erro no processamento do documento')
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

  async processFile(filePath: string, mimeType?: string): Promise<OCRResult & { type?: string }> {
    try {
      // Import pdf-parse dynamically to handle PDF files
      const pdfParse = (await import('pdf-parse')).default;
      const fs = await import('fs');
      
      // Read and process the PDF file
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
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

  private classifyDocumentType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('check-in') || lowerText.includes('entrada')) {
      return 'check-in';
    }
    if (lowerText.includes('check-out') || lowerText.includes('saída')) {
      return 'check-out';
    }
    if (lowerText.includes('controlo') || lowerText.includes('control')) {
      return 'control';
    }
    
    return 'reservation';
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

  private fixMalformedJson(responseText: string): any[] {
    console.log('🔧 Tentando reparar JSON mal formado...');
    
    // Limpar a resposta
    let cleaned = responseText.replace(/```json|```/g, '').trim();
    
    // Tentar encontrar array JSON mesmo que incompleto
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
    }
    
    // Tentar reparar strings não fechadas
    cleaned = cleaned.replace(/"/g, '"').replace(/"/g, '"');
    
    // Tentar reparar vírgulas em excesso
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Se ainda não funcionar, tentar extrair objetos individuais
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.log('🔧 Tentando extração de objetos individuais...');
      
      // Procurar por padrões de reserva
      const reservationPattern = /{[^{}]*"data_entrada"[^{}]*}/g;
      const matches = cleaned.match(reservationPattern);
      
      if (matches) {
        const reservations = [];
        for (const match of matches) {
          try {
            const reservation = JSON.parse(match);
            reservations.push(reservation);
          } catch (parseError) {
            console.log('Falha ao parsear objeto individual:', match.substring(0, 100));
          }
        }
        return reservations;
      }
      
      // Se tudo falhar, retornar array vazio
      console.log('❌ Não foi possível reparar o JSON');
      return [];
    }
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