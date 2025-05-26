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
        throw new Error('Tipo de arquivo não suportado');
      }
      
      if (!extractedText.trim()) {
        return {
          success: false,
          type: 'unknown',
          reservations: [],
          error: 'Não foi possível extrair texto do arquivo'
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
   * Processa um arquivo PDF e extrai dados de reservas (método legado)
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
   * Extrai texto de uma imagem usando Gemini Vision
   */
  private async extractTextFromImage(filePath: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Converter imagem para base64
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `
        Analise esta imagem e extraia todo o texto visível. 
        Se for uma captura de tela de reserva (Airbnb, Booking.com, WhatsApp, etc.), 
        extraia todos os detalhes como nomes de hóspedes, datas, valores, propriedades.
        Retorne apenas o texto extraído, sem comentários adicionais.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Erro ao extrair texto da imagem:', error);
      throw new Error('Falha na extração de texto da imagem');
    }
  }

  /**
   * Classifica o tipo de documento
   */
  private async classifyDocument(text: string): Promise<'check-in' | 'check-out' | 'control-file' | 'unknown'> {
    // Análise simples baseada em palavras-chave
    const lowerText = text.toLowerCase();

    // Arquivos de controle primeiro (têm prioridade)
    if (lowerText.includes('controlo') || lowerText.includes('aroeira') || lowerText.includes('multiple')) {
      return 'control-file';
    }

    // Se tem múltiplas datas, provavelmente é um arquivo de controle
    const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || [];
    if (dateMatches.length > 6) {
      return 'control-file';
    }

    // Check-out tem prioridade se contém valores monetários ou palavras-chave específicas
    if (lowerText.includes('check-out') || 
        lowerText.includes('saída') ||
        lowerText.includes('total amount') ||
        lowerText.includes('total price') ||
        lowerText.includes('final bill') ||
        lowerText.includes('invoice') ||
        lowerText.includes('payment') ||
        lowerText.includes('€') ||
        lowerText.includes('eur') ||
        lowerText.includes('total:') ||
        /\d+[.,]\d{2}\s*€/.test(text) ||
        /total.*\d+[.,]\d+/i.test(text) ||
        /amount.*\d+[.,]\d+/i.test(text)) {
      return 'check-out';
    }
    
    if (lowerText.includes('check-in') || lowerText.includes('entrada')) {
      return 'check-in';
    }

    // Se não conseguir determinar, assumir check-in como padrão
    return 'check-in';
  }

  /**
   * Extrai dados de reservas usando Gemini (atualizado com prompt melhorado)
   */
  private async extractReservationData(text: string, documentType: string): Promise<ExtractedReservation[]> {
    // Verificar se documento é complexo e pode precisar do Gemini 2.5 Pro
    const isComplexDocument = text.length > 8000 || 
                             (text.match(/\n/g) || []).length > 300 ||
                             documentType === 'control-file';
    
    const modelName = isComplexDocument ? "gemini-1.5-pro" : "gemini-1.5-flash";
    console.log(`🤖 Usando modelo ${modelName} para documento ${documentType} (${text.length} chars)`);
    
    const model = this.genAI.getGenerativeModel({ 
      model: modelName,
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

      console.log('🤖 Resposta completa do Gemini:', extractedText);

      // Tentar várias estratégias para extrair JSON válido
      let parsedData;
      
      // Estratégia 1: Procurar por JSON entre ```json e ```
      const jsonCodeBlockMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonCodeBlockMatch) {
        try {
          parsedData = JSON.parse(jsonCodeBlockMatch[1]);
        } catch (e) {
          console.log('❌ Falha na estratégia 1 (code block)');
        }
      }
      
      // Estratégia 2: Procurar por JSON entre { e }
      if (!parsedData) {
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.log('❌ Falha na estratégia 2 (regex match)');
            // Tentar limpar JSON malformado
            const cleanedJson = this.cleanMalformedJson(jsonMatch[0]);
            try {
              parsedData = JSON.parse(cleanedJson);
            } catch (e2) {
              console.log('❌ Falha na estratégia 2b (cleaned JSON)');
            }
          }
        }
      }

      if (!parsedData) {
        throw new Error('Não foi possível extrair JSON válido da resposta do Gemini');
      }
      
      if (!parsedData.reservations || !Array.isArray(parsedData.reservations)) {
        throw new Error('Formato de resposta inválido do Gemini - falta array de reservations');
      }

      console.log(`✅ Gemini extraiu ${parsedData.reservations.length} reservas`);
      return this.validateAndCleanReservations(parsedData.reservations);

    } catch (error) {
      console.error('❌ Erro ao extrair dados com Gemini:', error);
      throw new Error(`Erro na extração de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Limpa JSON malformado comum do Gemini
   */
  private cleanMalformedJson(jsonStr: string): string {
    // Remove comentários
    let cleaned = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
    cleaned = cleaned.replace(/\/\/.*$/gm, '');
    
    // Corrige vírgulas trailing
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Corrige aspas não fechadas
    cleaned = cleaned.replace(/(['"])[^'"]*$/g, '$1');
    
    // Remove caracteres não printáveis
    cleaned = cleaned.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
    
    return cleaned;
  }

  /**
   * Constrói o prompt para o Gemini baseado no tipo de documento
   */
  private buildExtractionPrompt(text: string, documentType: string): string {
    if (documentType === 'control-file') {
      return `
Você é um especialista em extração de dados de documentos de reservas de alojamento.

ANALISE ESTE ARQUIVO DE CONTROLE e extraia TODAS as reservas individuais.

INSTRUÇÕES ESPECÍFICAS:
- Este documento contém MÚLTIPLAS RESERVAS
- Cada linha representa uma reserva diferente
- Procure por referências, nomes de propriedades, hóspedes, datas e valores
- Propriedades típicas: Aroeira I, Aroeira II, São João Batista, Sete Rios, Ajuda, etc.
- Datas normalmente no formato DD-MM-YYYY ou DD/MM/YYYY
- Valores em euros (€)

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS JSON válido (sem texto extra)
2. Datas no formato YYYY-MM-DD
3. Valores como números (sem símbolos €)
4. Use null se um campo estiver ausente
5. NÃO invente dados - só extraia o que existe

FORMATO EXATO:
\`\`\`json
{
  "reservations": [
    {
      "guestName": "Nome completo do hóspede",
      "propertyName": "Nome da propriedade",
      "checkInDate": "YYYY-MM-DD",
      "checkOutDate": "YYYY-MM-DD", 
      "totalAmount": 0.00,
      "guestCount": 1,
      "email": null,
      "phone": null,
      "notes": "Referência ou observações"
    }
  ]
}
\`\`\`

TEXTO DO DOCUMENTO:
${text}

EXTRAIA TODAS AS RESERVAS ENCONTRADAS:`;
    }

    // Usar o prompt estruturado melhorado
    return `
⚙️ FUNÇÃO
Converter QUALQUER documento (imagem, PDF, texto) que contenha reservas turísticas num fluxo estruturado de registos JSON.

🎯 OUTPUT
Por omissão: lista JSON. Não devolvas comentários, apenas JSON válido UTF-8.

📑 CAMPOS (ordem fixa)
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
  "valor_total": 0.00,
  "propriedade": ""
}

📝 ETAPAS

1. **Pré-OCR**
   • Auto-detecta orientação, idioma e faz binarização adaptativa.
   • Remove cabeçalhos/rodapés e ISBN/IDs de impressão.

2. **Segmentação de registos**
   • Um registo começa quando surge (data E nome) **ou** (data seguida de preço / hóspedes).
   • Usa janela deslizante ≤120 caracteres para juntar as partes.

3. **Mapeamento & Normalização**
   | Campo | Regex/Rótulos (idiomas PT, EN, ES, FR, DE) | Normalização |
   |-------|-------------------------------------------|--------------|
   | datas | 3-4 dígitos separados por \`/\`, \`-\`, \`.\` ou \`<esp>\` | \`YYYY-MM-DD\` |
   | noites | "night(s)", "noites", "Nº noches", "Nächte" | inteiro; se ausente → \`dif_dias\` |
   | hóspedes | "Guests", "PAX", "Hóspedes", "Adultos + Crianças" | soma |
   | telefone | \`\\+?\\d[\\d\\-\\s]{7,}\` | \`+<indicativo> <resto>\` |
   | site | palavras-chave → Airbnb, Booking, Vrbo, Direct, Owner | se nada coincidir → "Outro" |
   | país | após rótulo "Country/País/Pays/País de origem" | PT-BR → converte para PT-EU |
   | valores | procurar €, EUR, $, USD, totais, preços | números com 2 decimais |

4. **Inferências & Flags**
   • Se país vazio mas telefone tem indicativo → preenche \`pais\`; marca \`pais_inferido=true\`.
   • \`timezone_source = "doc"\` se o PDF declara fuso; \`"default Europe/Lisbon"\` caso contrário.

5. **Validação final**
   • Garante \`data_entrada\` ≤ \`data_saida\`.
   • Remove duplicados (\`nome\` + \`data_entrada\` + \`site\`).

⚠️ ERROS & LACUNAS
   • Campo não encontrado → \`""\` ou \`0\`.
   • Se OCR falha gravemente, devolve \`[]\`.

FORMATO DE RETORNO OBRIGATÓRIO:
\`\`\`json
{
  "reservations": [
    {
      "guestName": "valor do campo nome",
      "propertyName": "valor do campo propriedade", 
      "checkInDate": "valor do campo data_entrada",
      "checkOutDate": "valor do campo data_saida",
      "totalAmount": "valor do campo valor_total como número",
      "guestCount": "valor do campo hospedes",
      "email": null,
      "phone": "valor do campo telefone",
      "notes": "valor do campo observacoes"
    }
  ]
}
\`\`\`

DOCUMENTO PARA PROCESSAR:
${text}`;
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
   * Consolida reservas de check-in e check-out pelo nome do hóspede
   */
  async consolidateReservations(
    reservations: Array<ExtractedReservation & { documentType: string; source?: string }>
  ): Promise<Array<ExtractedReservation & { source: string }>> {
    console.log('🔄 Iniciando consolidação de reservas...');
    
    const checkIns = reservations.filter(r => r.documentType === 'check-in');
    const checkOuts = reservations.filter(r => r.documentType === 'check-out');
    const others = reservations.filter(r => !['check-in', 'check-out'].includes(r.documentType));
    
    console.log(`📥 Check-ins: ${checkIns.length}, 📤 Check-outs: ${checkOuts.length}, 📄 Outros: ${others.length}`);
    
    const consolidated: Array<ExtractedReservation & { source: string }> = [];
    
    // Consolidar check-ins com check-outs correspondentes
    for (const checkIn of checkIns) {
      const matchingCheckOut = checkOuts.find(checkOut => 
        this.namesMatch(checkIn.guestName, checkOut.guestName)
      );
      
      if (matchingCheckOut) {
        console.log(`🔗 Consolidando: ${checkIn.guestName} ↔ ${matchingCheckOut.guestName}`);
        
        const consolidatedReservation: ExtractedReservation & { source: string } = {
          guestName: checkIn.guestName,
          propertyName: checkIn.propertyName || matchingCheckOut.propertyName,
          checkInDate: checkIn.checkInDate,
          checkOutDate: checkIn.checkOutDate || matchingCheckOut.checkOutDate,
          totalAmount: matchingCheckOut.totalAmount || checkIn.totalAmount,
          guestCount: checkIn.guestCount || matchingCheckOut.guestCount,
          email: checkIn.email || matchingCheckOut.email,
          phone: checkIn.phone || matchingCheckOut.phone,
          notes: this.mergeNotes(checkIn.notes, matchingCheckOut.notes),
          source: 'consolidated'
        };
        
        consolidated.push(consolidatedReservation);
        
        // Remover check-out usado da lista
        const index = checkOuts.indexOf(matchingCheckOut);
        checkOuts.splice(index, 1);
      } else {
        console.log(`📥 Check-in órfão: ${checkIn.guestName}`);
        consolidated.push({ ...checkIn, source: 'check-in-only' });
      }
    }
    
    // Adicionar check-outs órfãos
    for (const checkOut of checkOuts) {
      console.log(`📤 Check-out órfão: ${checkOut.guestName}`);
      consolidated.push({ ...checkOut, source: 'check-out-only' });
    }
    
    // Adicionar outros tipos de documentos
    for (const other of others) {
      consolidated.push({ ...other, source: other.documentType || 'other' });
    }
    
    console.log(`✅ Consolidação concluída: ${consolidated.length} reservas finais`);
    return consolidated;
  }

  /**
   * Verifica se dois nomes de hóspedes correspondem
   */
  private namesMatch(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;
    
    const normalize = (name: string) => name.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z\s]/g, '')
      .trim();
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Verificação exata
    if (n1 === n2) return true;
    
    // Verificação por palavras (sobrenomes)
    const words1 = n1.split(/\s+/).filter(w => w.length > 2);
    const words2 = n2.split(/\s+/).filter(w => w.length > 2);
    
    // Se pelo menos 2 palavras em comum
    const commonWords = words1.filter(w1 => words2.some(w2 => w1.includes(w2) || w2.includes(w1)));
    
    return commonWords.length >= Math.min(2, Math.min(words1.length, words2.length));
  }

  /**
   * Combina notas de check-in e check-out
   */
  private mergeNotes(checkInNotes?: string, checkOutNotes?: string): string | undefined {
    const notes = [];
    if (checkInNotes) notes.push(`Check-in: ${checkInNotes}`);
    if (checkOutNotes) notes.push(`Check-out: ${checkOutNotes}`);
    return notes.length > 0 ? notes.join(' | ') : undefined;
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