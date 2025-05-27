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

      // Primeiro, tentar extrair com parser dedicado para documentos Aroeira
      if (text.includes('AROEIRA') && (text.includes('Data entrada') || text.includes('Data saída'))) {
        console.log('📋 Detectado documento Aroeira - usando parser dedicado');
        const aroeiraReservations = this.parseAroeiraDocument(text);
        if (aroeiraReservations.length > 0) {
          console.log(`✅ SUCESSO! ${aroeiraReservations.length} reservas extraídas via parser Aroeira`);
          return {
            success: true,
            reservations: aroeiraReservations,
            processingTime: Date.now() - startTime,
            message: `Processamento concluído com sucesso. ${aroeiraReservations.length} reserva(s) encontrada(s).`
          };
        }
      }

      // Fallback: tentar com Gemini AI
      console.log('Tentando processar com Gemini AI...');
      let reservations = this.fixMalformedJson(response);
      console.log(`Resultado: ${reservations.length} reservas encontradas`);

      // Garantir que temos um array válido
      const finalReservations = Array.isArray(reservations) ? reservations : 
                               (reservations && typeof reservations === 'object') ? [reservations] : [];
      
      return {
        success: finalReservations.length > 0,
        reservations: finalReservations,
        processingTime: Date.now() - startTime,
        message: finalReservations.length > 0 
          ? `Processamento concluído com sucesso. ${finalReservations.length} reserva(s) encontrada(s).`
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

  private fixMalformedJson(jsonStr: string): any[] {
    try {
      // Primeiro, tentar parsing normal
      return JSON.parse(jsonStr);
    } catch (error) {
      console.log('🔧 JSON malformado, tentando corrigir...');
      
      // Técnicas de correção baseadas na versão que funcionava
      let fixed = jsonStr.replace(/```json|```/g, '').trim();
      
      // 1. Remover vírgulas extras antes de } ou ]
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // 2. Adicionar vírgulas entre objetos quando necessário
      fixed = fixed.replace(/}(\s*){/g, '},$1{');
      
      // 3. Corrigir aspas não fechadas ou duplas
      fixed = fixed.replace(/""([^"]*)""/g, '"$1"');
      
      // 4. Remover quebras de linha problemáticas dentro de strings
      fixed = fixed.replace(/"([^"]*)\n([^"]*)"/, '"$1 $2"');
      
      // 5. Tentar extrair apenas o array se for um array direto
      const arrayMatch = fixed.match(/\[([\s\S]*)\]/);
      if (arrayMatch) {
        fixed = `[${arrayMatch[1]}]`;
      }
      
      try {
        const parsed = JSON.parse(fixed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (secondError) {
        console.log('🔧 Segunda tentativa falhou, extraindo dados manualmente...');
        
        // Como último recurso, extrair dados manualmente usando regex
        const reservations = [];
        const nameMatches = fixed.match(/"nome"\s*:\s*"([^"]+)"/g);
        const entradaMatches = fixed.match(/"data_entrada"\s*:\s*"([^"]+)"/g);
        const saidaMatches = fixed.match(/"data_saida"\s*:\s*"([^"]+)"/g);
        const hospedesMatches = fixed.match(/"hospedes"\s*:\s*(\d+)/g);
        
        if (nameMatches && entradaMatches) {
          const maxLen = Math.min(nameMatches.length, entradaMatches.length);
          for (let i = 0; i < maxLen; i++) {
            const nome = nameMatches[i].match(/"([^"]+)"/)?.[1] || '';
            const data_entrada = entradaMatches[i]?.match(/"([^"]+)"/)?.[1] || '';
            const data_saida = saidaMatches?.[i]?.match(/"([^"]+)"/)?.[1] || '';
            const hospedes = hospedesMatches?.[i]?.match(/(\d+)/)?.[1] || '2';
            
            if (nome && data_entrada) {
              reservations.push({
                data_entrada,
                data_saida,
                noites: data_saida ? this.calculateNights(data_entrada, data_saida) : 1,
                nome,
                hospedes: parseInt(hospedes),
                pais: '',
                site: 'Outro',
                telefone: '',
                observacoes: ''
              });
            }
          }
        }
        
        console.log(`✅ Extraídas ${reservations.length} reservas manualmente`);
        return reservations;
      }
    }
  }

  private parseAroeiraDocument(text: string): ExtractedReservation[] {
    console.log('📋 Iniciando parser específico para documento Aroeira');
    const reservations: ExtractedReservation[] = [];
    
    try {
      // Encontrar o nome da propriedade
      let propertyName = '';
      if (text.includes('EXCITING LISBON AROEIRA II')) {
        propertyName = 'AROEIRA II';
      } else if (text.includes('AROEIRA I')) {
        propertyName = 'AROEIRA I';
      } else if (text.includes('AROEIRA III')) {
        propertyName = 'AROEIRA III';
      }
      
      // Dividir o texto em linhas e procurar por padrões de reserva
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Procurar por padrão de data DD/MM/YYYY
        const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
        const dateMatches = line.match(datePattern);
        
        if (dateMatches && dateMatches.length >= 2) {
          // Encontrou datas de entrada e saída
          const data_entrada = this.formatDateToISO(dateMatches[0]);
          const data_saida = this.formatDateToISO(dateMatches[1]);
          
          // Extrair outras informações da linha
          const parts = line.split(/\s+/);
          let nome = '';
          let hospedes = 2;
          let pais = '';
          let site = 'Booking';
          
          // Procurar nome (geralmente após as datas)
          for (let j = 0; j < parts.length; j++) {
            const part = parts[j];
            if (!datePattern.test(part) && 
                !part.match(/^\d+$/) && 
                part.length > 1 && 
                !part.toLowerCase().includes('booking') &&
                !part.toLowerCase().includes('airbnb')) {
              if (!nome) {
                nome = part;
              } else if (!pais && part.length > 2) {
                pais = part;
              }
            } else if (part.match(/^\d+$/) && parseInt(part) <= 10) {
              hospedes = parseInt(part);
            } else if (part.toLowerCase().includes('booking')) {
              site = 'Booking.com';
            } else if (part.toLowerCase().includes('airbnb')) {
              site = 'Airbnb';
            }
          }
          
          if (data_entrada && data_saida && nome) {
            const reservation: ExtractedReservation = {
              data_entrada,
              data_saida,
              noites: this.calculateNights(data_entrada, data_saida),
              nome,
              hospedes,
              pais,
              site,
              telefone: '',
              observacoes: propertyName || 'Documento Aroeira'
            };
            
            reservations.push(reservation);
            console.log(`✅ Reserva extraída: ${nome} -> ${data_entrada} a ${data_saida}`);
          }
        }
      }
      
      console.log(`📋 Parser Aroeira completado: ${reservations.length} reservas encontradas`);
      return reservations;
      
    } catch (error) {
      console.error('Erro no parser Aroeira:', error);
      return [];
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