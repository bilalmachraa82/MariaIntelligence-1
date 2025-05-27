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

    // Classificar tipo de documento primeiro
    const documentType = this.classifyDocumentType(text);
    console.log(`📋 Tipo de documento identificado: ${documentType}`);

    let prompt;
    
    if (documentType === 'aroeira-control') {
      prompt = `# ==============================================
#  EXTRACTOR DE RESERVAS – v4.1  (schema_version: 1.4)
# ==============================================

És um motor de OCR e parsing ultra-fiável para reservas turísticas.

FUNÇÃO  
    Receber QUALQUER documento (imagem, PDF ou texto) e devolver um fluxo
    estruturado de registos JSON segundo o esquema abaixo,
    aplicando consolidação inteligente de fragmentos, deduplicação,
    cálculo de confidence e validação de campos críticos.

PARÂMETROS  
    mode = "json"
    debug = false
    confidence_threshold = 0.35

OUTPUT  
    • JSON (lista) - responda APENAS com o array JSON
    • Nunca incluas texto fora do bloco JSON
    • Codificação UTF-8 sempre

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
  "confidence":        0.85,
  "source_page":       0,
  "needs_review":      false
}

ETAPAS DE PROCESSAMENTO:

ETAPA 1 – PRÉ-OCR  
    • Auto-detectar orientação + idioma (PT, EN, ES, FR, DE)
    • Binarização adaptativa; eliminar cabeçalhos/rodapés

ETAPA 2 – SEGMENTAÇÃO  
    • Novo fragmento quando encontra (data & nome) OU (data & preço/hóspedes)
    • Janela de 120 caract. para juntar linhas partidas

ETAPA 3 – MAPEAMENTO & NORMALIZAÇÃO  
    • Datas → DD/MM/AAAA para YYYY-MM-DD
    • Noites → calcular a partir das datas se ausente
    • Hóspedes → Adultos + Crianças + Bebés (separados ou total)
    • País → rótulo directo; se vazio mas telefone tem indicativo válido,
      preencher e pais_inferido=true
    • Telefone → normalizar como +<indicativo> <resto>, remover espaços
    • Site → palavras-chave (Airbnb, Booking.com, Vrbo, Direct, Owner);  
      se nada bater → "Booking.com"
    • Observações → texto com verbos imperativos ou rótulo "Info/Observações"
    • confidence → 0.85 para extrações bem-sucedidas

ETAPA 4 – VALIDAÇÃO  
    • data_entrada ≤ data_saida; caso contrário → needs_review=true
    • Se confidence < 0.35 → needs_review=true
    • Duplicado estrito (nome + data_entrada + site) → eliminar

DOCUMENTO AROEIRA:
${text}

Responda APENAS com o array JSON das reservas extraídas:`;
    } else {
      prompt = `Analise este texto e extraia todas as reservas. Responda APENAS com JSON válido:

{
  "reservations": [
    {
      "data_entrada": "YYYY-MM-DD",
      "data_saida": "YYYY-MM-DD",
      "noites": número,
      "nome": "Nome do hóspede", 
      "hospedes": número,
      "pais": "País",
      "site": "Plataforma",
      "telefone": "",
      "observacoes": ""
    }
  ]
}

TEXTO:
${text}`;
    }

    try {
      const response = await this.geminiService.generateText(prompt);
      
      if (!response) {
        throw new Error('Não foi possível processar o documento');
      }

      console.log('🤖 Resposta do Gemini recebida');
      console.log('Primeiros 500 chars:', response.substring(0, 500));
      
      // Limpar resposta e extrair JSON
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Tentar extrair objeto JSON com array de reservations
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      let reservations: ExtractedReservation[] = [];
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        
        // Verificar se tem array de reservations
        if (parsed.reservations && Array.isArray(parsed.reservations)) {
          reservations = parsed.reservations;
        } else if (Array.isArray(parsed)) {
          reservations = parsed;
        } else {
          reservations = [parsed];
        }
        
        console.log(`✅ JSON parseado com sucesso: ${reservations.length} reservas`);
        
        // Converter formato v4.1 para formato interno se necessário
        reservations = reservations.map(r => ({
          data_entrada: r.data_entrada,
          data_saida: r.data_saida,
          noites: r.noites || this.calculateNights(r.data_entrada, r.data_saida),
          nome: r.nome,
          hospedes: r.hospedes || 2,
          pais: r.pais || '',
          site: r.site || 'Booking.com',
          telefone: r.telefone || '',
          observacoes: r.observacoes || 'Extraído com EXTRACTOR v4.1'
        }));
        
        // Validar e limpar reservas
        reservations = reservations.filter(r => r.nome && r.data_entrada);
        
      } catch (parseError) {
        console.log('🔧 Erro no JSON, tentando extração manual para Aroeira...');
        
        if (documentType === 'aroeira-control') {
          reservations = this.extractAroeiraManually(text);
        }
      }
      
      console.log(`📊 Total de reservas válidas: ${reservations.length}`);
      
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

  private extractAroeiraManually(text: string): ExtractedReservation[] {
    console.log('🔧 Extração manual para documento Aroeira');
    const reservations: ExtractedReservation[] = [];
    
    const lines = text.split('\n');
    for (const line of lines) {
      // Procurar linhas com padrão específico do Aroeira: DD/MM/YYYYDD/MM/YYYYnúmeroNome...
      const aroeiraPattern = /(\d{2}\/\d{2}\/\d{4})(\d{2}\/\d{2}\/\d{4})(\d+)([A-Za-z]+)(\d+)([A-Za-z]+)(Booking|Airbnb)/;
      const match = line.match(aroeiraPattern);
      
      if (match) {
        const [, dataEntrada, dataSaida, noites, nome, hospedes, pais, site] = match;
        
        const data_entrada = this.formatDateToISO(dataEntrada);
        const data_saida = this.formatDateToISO(dataSaida);
        
        reservations.push({
          data_entrada,
          data_saida,
          noites: parseInt(noites),
          nome,
          hospedes: parseInt(hospedes),
          pais,
          site,
          telefone: '',
          observacoes: 'Extraído manualmente do documento Aroeira'
        });
        
        console.log(`✅ Reserva manual: ${nome} (${data_entrada} → ${data_saida})`);
      }
    }
    
    return reservations;
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