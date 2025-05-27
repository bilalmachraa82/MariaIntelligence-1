import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';

// Interface para os dados extraídos - v4.1 (working version)
export interface ExtractedReservation {
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

export interface OCRResult {
  success: boolean;
  type: 'check-in' | 'check-out' | 'control-file' | 'unknown';
  reservations: ExtractedReservation[];
  extractedText?: string;
  error?: string;
  processingTime?: number;
  message?: string;
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
   * Extrai texto de um arquivo PDF
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('❌ Erro ao extrair texto do PDF:', error);
      throw new Error(`Falha na extração de texto do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Extrai texto de uma imagem usando Gemini Vision
   */
  private async extractTextFromImage(filePath: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      // Ler e converter imagem para base64
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      const result = await model.generateContent([
        "Extraia todo o texto visível nesta imagem, preservando a estrutura e formatação. Inclua todos os detalhes como nomes, datas, números e valores.",
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('❌ Erro ao extrair texto da imagem:', error);
      throw new Error(`Falha na extração de texto da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Classifica o tipo de documento com base no conteúdo
   */
  private async classifyDocument(text: string): Promise<'check-in' | 'check-out' | 'control-file' | 'unknown'> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `
Analise o texto fornecido e classifique o documento em uma destas categorias:
- "check-in": Documento listando chegadas/entradas de hóspedes
- "check-out": Documento listando saídas/partidas de hóspedes  
- "control-file": Arquivo de controle com múltiplas reservas de uma propriedade
- "unknown": Não consegue determinar o tipo

Texto: ${text.substring(0, 2000)}

Responda APENAS com uma das categorias acima.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const classification = response.text().trim().toLowerCase();

      if (['check-in', 'check-out', 'control-file'].includes(classification)) {
        return classification as 'check-in' | 'check-out' | 'control-file';
      }

      return 'unknown';
    } catch (error) {
      console.error('❌ Erro na classificação do documento:', error);
      return 'unknown';
    }
  }

  /**
   * Extrai dados estruturados de reservas do texto
   */
  private async extractReservationData(text: string, documentType: string): Promise<ExtractedReservation[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = this.buildExtractionPrompt(text, documentType);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      console.log('📄 Resposta do Gemini (primeiros 500 chars):', responseText.substring(0, 500));

      // Tentar extrair JSON da resposta
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('❌ Nenhum JSON encontrado na resposta');
        return [];
      }

      const jsonText = jsonMatch[0];
      const extractedReservations = JSON.parse(jsonText);

      // Validar e processar reservas
      const validReservations = extractedReservations
        .filter((r: any) => r.nome && r.data_entrada)
        .map((r: any, index: number) => ({
          data_entrada: this.formatDate(r.data_entrada),
          data_saida: this.formatDate(r.data_saida),
          noites: r.noites || this.calculateNights(r.data_entrada, r.data_saida),
          nome: r.nome || '',
          hospedes: r.hospedes || 2,
          pais: r.pais || '',
          pais_inferido: r.pais_inferido || false,
          site: r.site || 'Booking.com',
          telefone: r.telefone || '',
          observacoes: r.observacoes || 'Extraído via OCR v4.1',
          timezone_source: r.timezone_source || 'Europe/Lisbon',
          id_reserva: r.id_reserva || `OCR-${Date.now()}-${index}`,
          confidence: r.confidence || 85,
          source_page: r.source_page || 1,
          needs_review: r.needs_review || false
        }));

      console.log(`✅ Extraídas ${validReservations.length} reservas válidas`);
      return validReservations;

    } catch (error) {
      console.error('❌ Erro na extração de dados:', error);
      return [];
    }
  }

  /**
   * Constrói o prompt para extração baseado no tipo de documento
   */
  private buildExtractionPrompt(text: string, documentType: string): string {
    const basePrompt = `
Analise o texto fornecido e extraia TODAS as reservas de hospedagem encontradas.

IMPORTANTE: Responda APENAS com um array JSON válido, sem texto adicional.

Formato para cada reserva:
{
  "data_entrada": "YYYY-MM-DD",
  "data_saida": "YYYY-MM-DD", 
  "noites": 3,
  "nome": "Nome do Hóspede",
  "hospedes": 2,
  "pais": "País",
  "pais_inferido": false,
  "site": "Booking.com",
  "telefone": "+351912345678",
  "observacoes": "Informações adicionais",
  "timezone_source": "Europe/Lisbon",
  "id_reserva": "REF123",
  "confidence": 90,
  "source_page": 1,
  "needs_review": false
}`;

    let specificInstructions = '';
    switch (documentType) {
      case 'check-in':
        specificInstructions = `
Tipo: Documento de CHECK-IN (Entradas)
- Procure por listas/tabelas de hóspedes chegando
- Foque nas datas de entrada
- Ignore cabeçalhos e filtros`;
        break;
      case 'check-out':
        specificInstructions = `
Tipo: Documento de CHECK-OUT (Saídas)
- Procure por listas/tabelas de hóspedes partindo
- Foque nas datas de saída
- Ignore cabeçalhos e filtros`;
        break;
      case 'control-file':
        specificInstructions = `
Tipo: Arquivo de CONTROLE
- Documento com múltiplas reservas de uma propriedade
- Pode ter formato menos estruturado
- Procure por padrões de nomes, datas e contatos`;
        break;
      default:
        specificInstructions = `
Tipo: Documento GENÉRICO
- Procure por qualquer padrão de dados de reserva
- Seja flexível na identificação dos campos`;
    }

    return `${basePrompt}

${specificInstructions}

TEXTO PARA ANÁLISE:
${text}

Responda APENAS com o array JSON:`;
  }

  /**
   * Formata data para formato ISO (YYYY-MM-DD)
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Se já está no formato ISO, retornar
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Converter DD/MM/YYYY para YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateStr;
  }

  /**
   * Calcula número de noites entre duas datas
   */
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
        console.log('🔧 Erro no JSON, tentando reparar e extrair manualmente...');
        console.log('JSON com erro:', cleanedResponse.substring(0, 500));
        
        // Tentar reparar JSON quebrado
        try {
          let repairedJson = cleanedResponse;
          
          // Fechar strings não terminadas
          if (repairedJson.includes('"') && !repairedJson.endsWith('"')) {
            const lastQuote = repairedJson.lastIndexOf('"');
            if (lastQuote > 0) {
              repairedJson = repairedJson.substring(0, lastQuote + 1);
            }
          }
          
          // Fechar arrays não terminados
          if (repairedJson.includes('[') && !repairedJson.includes(']')) {
            repairedJson += ']';
          }
          
          // Fechar objetos não terminados
          const openBraces = (repairedJson.match(/\{/g) || []).length;
          const closeBraces = (repairedJson.match(/\}/g) || []).length;
          for (let i = 0; i < openBraces - closeBraces; i++) {
            repairedJson += '}';
          }
          
          console.log('Tentando JSON reparado:', repairedJson.substring(0, 200));
          const repairedParsed = JSON.parse(repairedJson);
          
          if (Array.isArray(repairedParsed)) {
            reservations = repairedParsed;
            console.log('✅ JSON reparado com sucesso!');
          } else if (repairedParsed.reservations) {
            reservations = repairedParsed.reservations;
            console.log('✅ JSON reparado com sucesso!');
          }
        } catch (repairError) {
          console.log('❌ Não foi possível reparar JSON, usando extração manual');
          
          if (documentType === 'aroeira-control') {
            reservations = this.extractAroeiraManually(text);
          }
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
    console.log(`📄 Iniciando processamento OCR com Gemini 2.5 Flash: ${filePath}`);
    const startTime = Date.now();

    try {
      // Verificar se é PDF e usar o processador multi-reservas do Gemini 2.5 Flash
      const isPdf = require('path').extname(filePath).toLowerCase() === '.pdf';
      
      if (isPdf) {
        console.log('🤖 Usando processador Gemini 2.5 Flash para múltiplas reservas...');
        
        // Usar o processador working que estava funcionando com files (13) e (14)
        const multiResult = await processMultiReservationPDF(filePath);
        
        if (multiResult.success && multiResult.reservations.length > 0) {
          // Converter para formato esperado pela interface atual
          const convertedReservations = multiResult.reservations.map(r => ({
            data_entrada: r.checkInDate,
            data_saida: r.checkOutDate,
            noites: this.calculateNights(r.checkInDate, r.checkOutDate),
            nome: r.guestName,
            hospedes: r.numGuests || (r.adults || 0) + (r.children || 0),
            pais: r.country || '',
            site: r.platform || 'booking',
            telefone: r.guestPhone || '',
            observacoes: r.notes || `Ref: ${r.reference} - ${r.propertyName}`
          }));

          console.log(`✅ Gemini 2.5 Flash processou ${convertedReservations.length} reservas com sucesso`);

          return {
            success: true,
            reservations: convertedReservations,
            processingTime: Date.now() - startTime,
            message: `Extraídas ${convertedReservations.length} reservas via Gemini 2.5 Flash`,
            reservationsCount: convertedReservations.length,
            documentType: multiResult.documentType,
            scenario: multiResult.scenario,
            confidence: multiResult.confidence,
            type: multiResult.documentType
          };
        }
      }

      // Fallback para processamento tradicional se Gemini 2.5 Flash falhar
      console.log('📄 Usando processamento tradicional como fallback...');
      
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
        type: this.classifyDocumentType(pdfData.text),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      return {
        success: false,
        reservations: [],
        processingTime: Date.now() - startTime,
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