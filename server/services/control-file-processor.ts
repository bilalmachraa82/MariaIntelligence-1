/**
 * Serviço para processamento de arquivos de controle de reservas
 * Permite extrair múltiplas reservas de um único PDF de controle (como o Controlo_Aroeira)
 */

import fs from 'fs';
import pdf from 'pdf-parse';
import { storage } from '../storage';
import { InsertReservation } from '../../shared/schema';
import { AIAdapter } from './ai-adapter.service';
import { ragService } from './rag-enhanced.service';
import { controlFileValidator, ValidationResult, ValidationSummary } from './control-file-validator';

/**
 * Função auxiliar para encontrar o ID de uma propriedade por nome
 * 
 * @param propertyName Nome da propriedade a buscar
 * @returns ID da propriedade se encontrada, undefined caso contrário
 */
async function findPropertyIdByName(propertyName: string): Promise<number | undefined> {
  try {
    const properties = await storage.getProperties();
    
    // Normalizar o nome da propriedade extraído para comparação
    const normalizedPropertyName = propertyName.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9\s]/g, "") // Manter apenas letras, números e espaços
      .trim();
    
    // Processar casos especiais
    const isAroeira = normalizedPropertyName.includes('aroeira');
    const aroeiraSuffix = isAroeira ? 
      normalizedPropertyName.match(/aroeira\s*(i|ii|iii|iv|1|2|3|4)/i)?.[1] : null;
    
    let bestMatch: { property: any, score: number } = { property: null, score: 0 };
    
    // Loop por todas as propriedades para encontrar a melhor correspondência
    for (const property of properties) {
      // Normalizar o nome da propriedade para comparação
      const normalizedName = property.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
      
      let score = 0;
      
      // Casos especiais para Aroeira
      if (isAroeira && normalizedName.includes('aroeira')) {
        // Correspondência perfeita para Aroeira com o número romano correto
        if (aroeiraSuffix && normalizedName.includes(`aroeira ${aroeiraSuffix}`)) {
          score = 100;
        } 
        // Correspondência para Aroeira I quando temos apenas "aroeira" no documento
        else if (!aroeiraSuffix && normalizedName.includes('aroeira i')) {
          score = 80;
        }
        // Correspondência parcial para qualquer Aroeira
        else {
          score = 60;
        }
      }
      // Correspondência exata
      else if (normalizedName === normalizedPropertyName) {
        score = 100;
      }
      // Uma string contém a outra completamente
      else if (normalizedName.includes(normalizedPropertyName) || 
               normalizedPropertyName.includes(normalizedName)) {
        // Calculamos o score baseado no tamanho relativo das strings
        const lengthRatio = Math.min(normalizedName.length, normalizedPropertyName.length) / 
                           Math.max(normalizedName.length, normalizedPropertyName.length);
        score = 70 * lengthRatio;
      }
      // Correspondência parcial (palavras em comum)
      else {
        const nameWords = normalizedName.split(/\s+/);
        const propertyWords = normalizedPropertyName.split(/\s+/);
        
        // Contar palavras em comum
        const commonWords = nameWords.filter(word => 
          propertyWords.some(propWord => propWord === word));
        
        if (commonWords.length > 0) {
          // Pontuação baseada no número de palavras em comum
          score = 40 * (commonWords.length / Math.max(nameWords.length, propertyWords.length));
        }
      }
      
      // Atualizar a melhor correspondência
      if (score > bestMatch.score) {
        bestMatch = { property, score };
      }
    }
    
    // Retornar o ID da propriedade se tivermos uma correspondência razoável (score > 40)
    if (bestMatch.score > 40 && bestMatch.property) {
      return bestMatch.property.id;
    }
    
    // Caso especial: se é Aroeira sem correspondência, mas temos propriedades Aroeira no sistema
    if (isAroeira) {
      // Procurar qualquer propriedade Aroeira
      const anyAroeira = properties.find(p => 
        p.name.toLowerCase().includes('aroeira'));
        
      if (anyAroeira) {
        return anyAroeira.id;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error(`[ControlFileProcessor] Erro ao buscar propriedade para "${propertyName}":`, error);
    return undefined;
  }
}

// Definição do tipo para propriedade para resolver erros de tipo
export type Property = {
  id: number;
  name: string;
  cleaningCost: string | null;
  checkInFee: string | null;
  commission: string | null;
  teamPayment: string | null;
  cleaningTeam: string | null;
  active: boolean | null;
  cleaningTeamId: number | null;
  ownerId: number;
  monthlyFixedCost: string | null;
};

// Interface para o resultado do processamento do arquivo de controle
export interface ControlFileResult {
  success: boolean;
  isControlFile: boolean;
  propertyName: string;
  propertyId?: number;  // Adicionado ID da propriedade
  reservations: ControlReservation[];
  rawText: string;
  error?: string;
}

// Interface para uma reserva extraída do arquivo de controle
export interface ControlReservation {
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number | string;
  totalAmount: string | number;
  platform: string;
  // Campo para identificação da propriedade
  propertyId?: number;
  // Outros campos opcionais
  notes?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
  language?: string;
  paymentStatus?: string;
  comments?: string;
}

/**
 * Processa um arquivo PDF para verificar se é um arquivo de controle
 * e extrair as reservas listadas nele
 * 
 * @param filePath Caminho para o arquivo PDF
 * @returns Resultado do processamento com as reservas encontradas
 */
export async function processControlFile(filePath: string): Promise<ControlFileResult> {
  try {
    console.log(`[ControlFileProcessor] Verificando se ${filePath} é um arquivo de controle`);
    
    // Carregar o arquivo PDF
    const dataBuffer = fs.readFileSync(filePath);
    
    // Extrair o texto do PDF usando pdf-parse
    const pdfData = await pdf(dataBuffer);
    const rawText = pdfData.text;
    
    // Verificar se o texto contém padrões que indicam ser um arquivo de controle
    // Usando lower case para melhorar a detecção
    const normalizedText = rawText.toLowerCase();
    console.log(`[ControlFileProcessor] Texto extraído (primeiros 200 caracteres): ${rawText.substring(0, 200)}`);
    
    const isControlFile = 
      (normalizedText.includes('controlo_aroeira') || 
       normalizedText.includes('controlo aroeira') ||
       normalizedText.includes('exciting lisbon aroeira') ||
       normalizedText.includes('aroeira i') ||
       normalizedText.includes('aroeira ii') ||
       normalizedText.includes('controlo_') ||
       normalizedText.includes('mapa de reservas') ||
       // Adicionando mais padrões para melhorar a detecção
       (normalizedText.includes('data entrada') && normalizedText.includes('data saída')) ||
       (normalizedText.includes('check-in') && normalizedText.includes('check-out')) ||
       (normalizedText.includes('hóspedes') && normalizedText.includes('noites')));
    
    if (!isControlFile) {
      console.log('[ControlFileProcessor] Arquivo não identificado como controle de reservas');
      return {
        success: true,
        isControlFile: false,
        propertyName: '',
        reservations: [],
        rawText
      };
    }
    
    console.log('[ControlFileProcessor] Arquivo identificado como controle de reservas!');
    
    // Extrair nome da propriedade (geralmente presente no título do documento)
    let propertyName = '';
    
    // Padrões comuns para identificar o nome da propriedade
    const propertyNamePatterns = [
      // Padrões para Aroeira
      /EXCITING LISBON ([A-Za-z\s]+\s*[IVX]*)/i,
      /EXCITING\s+LISBON\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Controlo_([A-Za-z\s]+\s*[IVX]*)/i,
      /Controlo\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Aroeira\s+(I|II|III)/i,
      /AROEIRA\s+(I|II|III)/i,
      // Capturar apenas "Aroeira" se não estiver qualificado
      /\b(Aroeira)\b/i,
      /\b(AROEIRA)\b/i,
      // Outros formatos comuns
      /Mapa de Reservas\s+-\s+([A-Za-z\s]+\s*[IVX]*)/i,
      /Mapa de Ocupação\s+-\s+([A-Za-z\s]+\s*[IVX]*)/i,
      // Tentativa de capturar qualquer nome após "Lisbon"
      /Lisbon\s+([A-Za-z\s]+\s*[IVX]*)/i
    ];
    
    // Procurar padrões em ordem de prioridade
    for (const pattern of propertyNamePatterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        propertyName = match[1].trim();
        // Se encontrarmos, interrompemos o loop
        break;
      }
    }
    
    // Tratar caso especial de Aroeira
    if (propertyName.toLowerCase() === 'aroeira') {
      // Procurar por "Aroeira I", "Aroeira II", etc. no texto completo
      const aroeiraSuffixMatch = rawText.match(/Aroeira\s+(I|II|III)/i) || 
                                 rawText.match(/AROEIRA\s+(I|II|III)/i);
      
      if (aroeiraSuffixMatch && aroeiraSuffixMatch[1]) {
        propertyName = `Aroeira ${aroeiraSuffixMatch[1]}`;
      }
    }
    
    // Se ainda não encontramos nada, usar método alternativo
    if (!propertyName) {
      // Procurar por qualquer nome que pareça ser um título no início do documento
      const firstLine = rawText.split('\n')[0].trim();
      if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
        propertyName = firstLine;
      } else {
        propertyName = 'Propriedade Desconhecida';
      }
    }
    
    console.log(`[ControlFileProcessor] Propriedade identificada: ${propertyName}`);
    
    // Usar o adaptador de IA para extrair as reservas do texto
    const aiAdapter = AIAdapter.getInstance();
    
    // Definir um sistema de prompt para extração de múltiplas reservas
    const systemPrompt = "Extraia todas as reservas do seguinte documento de controle. " +
      "Cada reserva deve ter os seguintes campos: " +
      "- Nome do cliente (guestName) " +
      "- Data de check-in (checkInDate) no formato DD/MM/YYYY " +
      "- Data de check-out (checkOutDate) no formato DD/MM/YYYY " +
      "- Número de hóspedes (numGuests) " +
      "- Valor total (totalAmount) " +
      "- Plataforma de reserva (platform), como Airbnb, Booking, etc. " +
      "- Notas adicionais (notes), se houver " +
      "IMPORTANTE: Retorne APENAS um array JSON com as reservas extraídas. " +
      "NÃO use marcadores de código markdown. " +
      "NÃO inclua explicações ou textos adicionais. " +
      "Retorne APENAS o JSON puro.";
    
    // Extrair as reservas usando o adaptador de IA
    const extractionResult = await aiAdapter.extractDataFromText(
      rawText,
      {
        systemPrompt,
        responseFormat: { type: 'json' },
        temperature: 0.1,
        maxTokens: 4096,
        documentType: 'control_file'
      }
    );
    
    // Adicionar o conteúdo à base de conhecimento RAG
    await ragService.addToKnowledgeBase(
      rawText,
      'control_file',
      {
        fileName: filePath.split('/').pop(),
        propertyName,
        isControlFile: true,
        extractionDate: new Date().toISOString()
      }
    );
    
    let reservations = [];
    
    try {
      // Tentar processar a resposta JSON
      let jsonText = extractionResult;
      
      // Verificar se o texto está em formato markdown com backticks
      if (typeof extractionResult === 'string') {
        // Remover marcadores de código markdown (```json e ```)
        const markdownRegex = /```(?:json)?\s*([\s\S]*?)```/;
        const jsonMatch = extractionResult.match(markdownRegex);
        if (jsonMatch && jsonMatch[1]) {
          console.log('[ControlFileProcessor] Extraindo JSON de resposta markdown');
          jsonText = jsonMatch[1];
        }
      }
      
      const parsedResponse = typeof jsonText === 'string' 
        ? JSON.parse(jsonText) 
        : jsonText;
      
      // Verificar se temos um array de reservas ou um objeto com a propriedade reservations
      if (Array.isArray(parsedResponse)) {
        reservations = parsedResponse;
      } else if (parsedResponse && Array.isArray(parsedResponse.reservations)) {
        reservations = parsedResponse.reservations;
      }
      
      console.log(`[ControlFileProcessor] Extraídas ${reservations.length} reservas do documento`);
      
      // Encontrar a propriedade pelo nome para retornar o ID
      let propertyId: number | undefined;
      
      try {
        // Usar a função auxiliar definida neste arquivo
        propertyId = await findPropertyIdByName(propertyName);
      } catch (err) {
        console.warn(`Erro ao buscar ID da propriedade: ${err}`);
        // Em caso de erro, deixamos o propertyId como undefined
      }
      
      return {
        success: true,
        isControlFile: true,
        propertyName,
        propertyId,
        reservations,
        rawText
      };
    } catch (error) {
      console.error('[ControlFileProcessor] Erro ao processar resultado JSON:', error);
      return {
        success: false,
        isControlFile: true,
        propertyName,
        reservations: [],
        rawText,
        error: 'Erro ao processar resultado JSON da extração'
      };
    }
  } catch (error) {
    console.error('[ControlFileProcessor] Erro ao processar arquivo de controle:', error);
    return {
      success: false,
      isControlFile: false,
      propertyName: '',
      reservations: [],
      rawText: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Cria reservas no sistema a partir dos dados extraídos do arquivo de controle
 * 
 * @param controlResult Resultado do processamento do arquivo de controle
 * @returns Array com as reservas criadas
 */
export async function createReservationsFromControlFile(controlResult: ControlFileResult): Promise<any[]> {
  try {
    console.log(`[ControlFileProcessor] Criando ${controlResult.reservations.length} reservas do arquivo de controle`);
    
    const createdReservations = [];
    
    // Encontrar a propriedade pelo nome
    const properties = await storage.getProperties();
    
    // Usar o ID da propriedade do resultado se disponível, caso contrário encontrar pelo nome
    let propertyId: number | null = controlResult.propertyId || null;
    
    // Se já temos o ID da propriedade, não precisamos buscar
    if (propertyId) {
      console.log(`[ControlFileProcessor] Usando ID de propriedade fornecido: ${propertyId}`);
    } else {
      // Procurar a propriedade usando correspondência de texto e pontuação de similaridade
      let bestMatch: { property: any, score: number } = { property: null, score: 0 };
    
    // Normalizar o nome da propriedade extraído para comparação
    const normalizedPropertyName = controlResult.propertyName.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9\s]/g, "") // Manter apenas letras, números e espaços
      .trim();
    }
    
    console.log(`[ControlFileProcessor] Nome normalizado para busca: "${normalizedPropertyName}"`);
    
    // Processar casos especiais
    const isAroeira = normalizedPropertyName.includes('aroeira');
    const aroeiraSuffix = isAroeira ? 
      normalizedPropertyName.match(/aroeira\s*(i|ii|iii|iv|1|2|3|4)/i)?.[1] : null;
    
    // Loop por todas as propriedades para encontrar a melhor correspondência
    for (const property of properties) {
      // Normalizar o nome da propriedade para comparação
      const normalizedName = property.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
      
      let score = 0;
      
      // Casos especiais para Aroeira
      if (isAroeira && normalizedName.includes('aroeira')) {
        // Correspondência perfeita para Aroeira com o número romano correto
        if (aroeiraSuffix && normalizedName.includes(`aroeira ${aroeiraSuffix}`)) {
          score = 100;
        } 
        // Correspondência para Aroeira I quando temos apenas "aroeira" no documento
        else if (!aroeiraSuffix && normalizedName.includes('aroeira i')) {
          score = 80;
        }
        // Correspondência parcial para qualquer Aroeira
        else {
          score = 60;
        }
      }
      // Correspondência exata
      else if (normalizedName === normalizedPropertyName) {
        score = 100;
      }
      // Uma string contém a outra completamente
      else if (normalizedName.includes(normalizedPropertyName) || 
               normalizedPropertyName.includes(normalizedName)) {
        // Calculamos o score baseado no tamanho relativo das strings
        const lengthRatio = Math.min(normalizedName.length, normalizedPropertyName.length) / 
                           Math.max(normalizedName.length, normalizedPropertyName.length);
        score = 70 * lengthRatio;
      }
      // Correspondência parcial (palavras em comum)
      else {
        const nameWords = normalizedName.split(/\s+/);
        const propertyWords = normalizedPropertyName.split(/\s+/);
        
        // Contar palavras em comum
        const commonWords = nameWords.filter(word => 
          propertyWords.some(propWord => propWord === word));
        
        if (commonWords.length > 0) {
          // Pontuação baseada no número de palavras em comum
          score = 40 * (commonWords.length / Math.max(nameWords.length, propertyWords.length));
        }
      }
      
      // Atualizar a melhor correspondência
      if (score > bestMatch.score) {
        bestMatch = { property: property as Property, score };
      }
    }
    
    // Definir a propriedade se tivermos uma correspondência razoável (score > 40)
    if (bestMatch.score > 40 && bestMatch.property) {
      propertyId = bestMatch.property.id;
      console.log(`[ControlFileProcessor] Propriedade correspondente encontrada: ${bestMatch.property.name} (ID: ${propertyId}) com pontuação ${bestMatch.score.toFixed(2)}`);
    } else {
      // Caso especial: se é Aroeira sem correspondência, mas temos propriedades Aroeira no sistema
      if (isAroeira) {
        // Procurar qualquer propriedade Aroeira
        const anyAroeira = properties.find(p => 
          p.name.toLowerCase().includes('aroeira')) as Property | undefined;
          
        if (anyAroeira) {
          propertyId = anyAroeira.id;
          console.log(`[ControlFileProcessor] Usando propriedade Aroeira genérica: ${anyAroeira.name} (ID: ${propertyId})`);
        }
      }
    }
    
    if (!propertyId) {
      console.warn(`[ControlFileProcessor] Não foi possível encontrar uma propriedade para "${controlResult.propertyName}"`);
      return [];
    }
    
    // Processar cada reserva extraída
    for (const reservation of controlResult.reservations) {
      try {
        // Formatar datas para o formato YYYY-MM-DD com validação
        const formatDate = (dateStr: string): string => {
          if (!dateStr) return '';
          
          // Limpar a string de data de possíveis caracteres extras
          const cleanDateStr = dateStr.trim().replace(/\s+/g, '');
          
          // Padrões comuns de data
          const ddmmyyyyPattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
          const yyyymmddPattern = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/;
          
          let day: string, month: string, year: string;
          
          // Tentar detectar o formato da data
          if (ddmmyyyyPattern.test(cleanDateStr)) {
            // Formato DD/MM/YYYY (ou com - ou .)
            const match = cleanDateStr.match(ddmmyyyyPattern);
            if (!match) return '';
            
            [, day, month, year] = match;
            
            // Se o ano é de dois dígitos, adicionar 2000
            if (year.length === 2) {
              year = '20' + year;
            }
          } else if (yyyymmddPattern.test(cleanDateStr)) {
            // Formato YYYY/MM/DD (ou com - ou .)
            const match = cleanDateStr.match(yyyymmddPattern);
            if (!match) return '';
            
            [, year, month, day] = match;
          } else {
            // Formato padrão DD/MM/YYYY
            const parts = cleanDateStr.includes('/') 
              ? cleanDateStr.split('/') 
              : cleanDateStr.includes('-')
                ? cleanDateStr.split('-')
                : cleanDateStr.includes('.')
                  ? cleanDateStr.split('.')
                  : [];
            
            if (parts.length !== 3) return '';
            
            // Assumir formato DD/MM/YYYY
            [day, month, year] = parts;
            
            // Se o ano é de dois dígitos, adicionar 2000
            if (year.length === 2) {
              year = '20' + year;
            }
          }
          
          // Validar componentes da data
          const dayNum = parseInt(day, 10);
          const monthNum = parseInt(month, 10);
          const yearNum = parseInt(year, 10);
          
          // Validações básicas
          if (
            isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) ||
            dayNum < 1 || dayNum > 31 ||
            monthNum < 1 || monthNum > 12 ||
            yearNum < 2000 || yearNum > 2100
          ) {
            console.warn(`[ControlFileProcessor] Data inválida: ${dateStr}`);
            return '';
          }
          
          // Formatar no padrão YYYY-MM-DD
          return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
        };
        
        // Converter valores para os tipos adequados
        const checkInDate = formatDate(reservation.checkInDate);
        const checkOutDate = formatDate(reservation.checkOutDate);
        
        // Validar datas (não processar se alguma data estiver incorreta)
        if (!checkInDate || !checkOutDate) {
          console.warn(`[ControlFileProcessor] Ignorando reserva para ${reservation.guestName} devido a data inválida (check-in: ${reservation.checkInDate}, check-out: ${reservation.checkOutDate})`);
          continue;
        }
        
        // Converter e validar valor monetário
        const processMonetaryValue = (value: string | number | undefined): string => {
          if (value === undefined || value === null) return '0';
          
          let valueStr = typeof value === 'string' ? value : String(value);
          
          // Remover símbolos de moeda e caracteres não numéricos, mantendo pontos e vírgulas
          valueStr = valueStr.replace(/[^0-9.,]/g, '');
          
          // Detectar formato com vírgula como separador decimal (e.g. 1.234,56)
          const hasThousandsDot = valueStr.includes('.') && valueStr.includes(',') && 
                                 valueStr.lastIndexOf('.') < valueStr.lastIndexOf(',');
          
          if (hasThousandsDot) {
            // Formato europeu (1.234,56) - remover pontos de milhar e substituir vírgula por ponto
            valueStr = valueStr.replace(/\./g, '').replace(',', '.');
          } else if (valueStr.includes(',')) {
            // Formato com vírgula como separador decimal sem ponto de milhar (1234,56)
            valueStr = valueStr.replace(',', '.');
          }
          
          // Converter para número e validar
          const numValue = parseFloat(valueStr);
          
          if (isNaN(numValue)) {
            console.warn(`[ControlFileProcessor] Valor monetário inválido: ${value}, usando 0`);
            return '0';
          }
          
          // Lidar com valores negativos (improvável, mas por segurança)
          if (numValue < 0) {
            console.warn(`[ControlFileProcessor] Valor monetário negativo: ${value}, convertendo para positivo`);
            return String(Math.abs(numValue));
          }
          
          // Valores muito altos podem ser erros (mais de 100.000€)
          if (numValue > 100000) {
            console.warn(`[ControlFileProcessor] Valor monetário suspeito: ${value}, validar manualmente`);
          }
          
          // Formatar com 2 casas decimais
          return numValue.toFixed(2);
        };
        
        const totalAmount = processMonetaryValue(reservation.totalAmount);
        
        // Identificar plataforma e calcular taxas apropriadas
        let platform = (reservation.platform || '').toLowerCase().trim();
        
        // Normalizar nomes de plataformas
        if (platform.includes('airbnb')) {
          platform = 'Airbnb';
        } else if (platform.includes('booking')) {
          platform = 'Booking.com';
        } else if (platform.includes('vrbo') || platform.includes('homeaway')) {
          platform = 'VRBO';
        } else if (platform === '' || platform === 'direct' || platform.includes('direct')) {
          platform = 'Direct';
        }
        
        // Calcular taxas baseadas na plataforma
        let platformFeePercentage = 0;
        
        switch (platform) {
          case 'Airbnb':
            platformFeePercentage = 0.14; // 14%
            break;
          case 'Booking.com':
            platformFeePercentage = 0.15; // 15%
            break;
          case 'VRBO':
            platformFeePercentage = 0.12; // 12%
            break;
          default:
            platformFeePercentage = 0; // Sem taxa para reservas diretas
        }
        
        const platformFee = String((parseFloat(totalAmount) * platformFeePercentage).toFixed(2));
        
        // Estimar a taxa de limpeza com base na propriedade
        const property = properties.find(p => p.id === propertyId) as Property | undefined;
        const cleaningFee = property?.cleaningCost || '0';
        
        // Criar a reserva
        const newReservation: InsertReservation = {
          propertyId: propertyId,
          guestName: reservation.guestName,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          totalAmount: totalAmount,
          status: 'confirmed',
          notes: reservation.notes || '',
          platform: platform,
          numGuests: Number(reservation.numGuests || 1),
          platformFee: platformFee,
          cleaningFee: cleaningFee,
          checkInFee: property?.checkInFee || '0',
          commissionFee: String(parseFloat(totalAmount) * (parseFloat(property?.commission || '0') / 100)),
          teamPayment: property?.teamPayment || '0',
          // Usar os campos corretos para informações de contato
          guestPhone: reservation.phoneNumber || '',
          guestEmail: reservation.email || '',
          netAmount: String(parseFloat(totalAmount) - parseFloat(platformFee) - parseFloat(cleaningFee))
        };
        
        console.log(`[ControlFileProcessor] Criando reserva para ${newReservation.guestName}`);
        
        // Criar a reserva no banco de dados
        const createdReservation = await storage.createReservation(newReservation);
        
        // Registrar atividade no sistema
        await storage.createActivity({
          type: 'reservation_created',
          description: `Reserva criada a partir de arquivo de controle: ${createdReservation.propertyId} - ${createdReservation.guestName}`,
          entityId: createdReservation.id,
          entityType: 'reservation'
        });
        
        // Armazenar no RAG para aprendizado contínuo
        await ragService.addToKnowledgeBase(
          `Reserva criada a partir de arquivo de controle:\nPropriedade: ${property?.name || 'Desconhecida'}\nHóspede: ${reservation.guestName}\nCheck-in: ${checkInDate}\nCheck-out: ${checkOutDate}\nHóspedes: ${reservation.numGuests}\nPlataforma: ${platform}\nValor: ${totalAmount}`,
          'reservation_created',
          {
            reservationId: createdReservation.id,
            propertyId: propertyId,
            guestName: reservation.guestName,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            importSource: 'control_file'
          }
        );
        
        createdReservations.push(createdReservation);
      } catch (error) {
        console.error(`[ControlFileProcessor] Erro ao criar reserva para ${reservation.guestName}:`, error);
      }
    }
    
    console.log(`[ControlFileProcessor] Criadas ${createdReservations.length} reservas com sucesso`);
    return createdReservations;
  } catch (error) {
    console.error('[ControlFileProcessor] Erro ao criar reservas do arquivo de controle:', error);
    return [];
  }
}