/**
 * Parser para extrair e validar dados de reservas a partir do texto OCR
 * Fornece funções de normalização, validação e extração de dados estruturados
 */

import { AIAdapter } from '../services/ai-adapter.service';

// Interface para dados de reserva extraídos
interface ReservationData {
  propertyName?: string;
  propertyId?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate?: string;
  checkOutDate?: string;
  numGuests?: number;
  totalAmount?: number;
  platformFee?: number;
  cleaningFee?: number;
  checkInFee?: number;
  commissionFee?: number;
  teamPayment?: number;
  netAmount?: number;
  platform?: string;
  status?: string;
  notes?: string;
  reservationId?: string;
  [key: string]: any; // Para outros campos
}

// Interface para o resultado do parsing
interface ParseResult {
  reservations: ReservationData[];
  boxes?: Record<string, any>; // Retângulos delimitadores para visualização
  missing: string[]; // Campos obrigatórios não encontrados
}

/**
 * Extrai dados de reservas do texto de OCR
 * @param text Texto extraído por OCR
 * @returns Resultado do parsing com reservas extraídas
 */
export async function parseReservationData(text: string): Promise<ParseResult> {
  console.log('🔍 Iniciando extração de dados de reserva a partir do texto OCR');
  
  // Instanciar o adaptador de IA
  const aiAdapter = AIAdapter.getInstance();
  
  // Lista de reservas extraídas
  const reservations: ReservationData[] = [];
  
  // Lista de campos obrigatórios em falta
  const missing: string[] = [];
  
  // Retângulos delimitadores (se disponíveis)
  const boxes: Record<string, any> = {};
  
  try {
    // Usar o Gemini para interpretação de dados estruturados
    // O Gemini é mais adequado para este tipo de tarefa de parsing complexo
    const structuredData = await aiAdapter.geminiService.parseReservationData(text);
    
    // Verificar se temos reservas
    if (structuredData && 
        (Array.isArray(structuredData.reservations) || 
         Array.isArray(structuredData.results) || 
         typeof structuredData === 'object')
    ) {
      // Normalizar os dados
      let dataArray: any[] = [];
      
      if (Array.isArray(structuredData.reservations)) {
        dataArray = structuredData.reservations;
      } else if (Array.isArray(structuredData.results)) {
        dataArray = structuredData.results;
      } else if (structuredData.propertyName || structuredData.guestName) {
        // É uma única reserva no formato direto
        dataArray = [structuredData];
      } else if (typeof structuredData === 'object') {
        // Tentar encontrar objeto de reserva
        for (const key in structuredData) {
          if (typeof structuredData[key] === 'object' && 
              (structuredData[key].propertyName || structuredData[key].guestName)) {
            dataArray.push(structuredData[key]);
          }
        }
        
        // Se não encontrou nada, tratar como uma única reserva
        if (dataArray.length === 0) {
          dataArray = [structuredData];
        }
      }
      
      // Processar cada reserva
      for (const data of dataArray) {
        // Reserva normalizada
        const reservation: ReservationData = {};
        
        // Campos obrigatórios
        const requiredFields = [
          'propertyName', 'guestName', 'checkInDate', 'checkOutDate', 
          'numGuests', 'totalAmount'
        ];
        
        // Lista de campos em falta nesta reserva
        const missingInThisReservation: string[] = [];
        
        // Mapear os campos
        const fieldMappings: Record<string, string[]> = {
          propertyName: ['propertyName', 'property', 'propertyId', 'accommodation', 'alojamento', 'propriedade'],
          guestName: ['guestName', 'guest', 'hospede', 'cliente', 'name', 'nome'],
          guestEmail: ['guestEmail', 'email', 'contacto', 'contato', 'contact'],
          guestPhone: ['guestPhone', 'phone', 'telefone', 'telemovel', 'telemóvel', 'contacto', 'contato', 'contact'],
          checkInDate: ['checkInDate', 'checkin', 'entrada', 'arrival', 'startDate', 'dataEntrada', 'dataInicio'],
          checkOutDate: ['checkOutDate', 'checkout', 'saida', 'saída', 'departure', 'endDate', 'dataSaida', 'dataFim'],
          numGuests: ['numGuests', 'guests', 'hospedes', 'numberOfGuests', 'pax', 'persons', 'pessoas'],
          totalAmount: ['totalAmount', 'amount', 'valor', 'price', 'preco', 'preço', 'total'],
          platformFee: ['platformFee', 'fee', 'taxa', 'comissao', 'comissão'],
          cleaningFee: ['cleaningFee', 'cleaning', 'limpeza', 'taxaLimpeza'],
          checkInFee: ['checkInFee', 'checkinFee', 'entradaFee', 'recepção', 'recepcao', 'reception'],
          commissionFee: ['commissionFee', 'commission', 'comissao', 'comissão'],
          teamPayment: ['teamPayment', 'team', 'equipe', 'equipa', 'pagamentoEquipe'],
          platform: ['platform', 'plataforma', 'source', 'origem', 'canal'],
          reservationId: ['reservationId', 'id', 'bookingId', 'booking', 'reserva']
        };
        
        // Normalizar cada campo
        for (const [targetField, sourceFields] of Object.entries(fieldMappings)) {
          // Tentar encontrar o campo na reserva
          for (const sourceField of sourceFields) {
            if (data[sourceField] !== undefined && data[sourceField] !== null && data[sourceField] !== '') {
              reservation[targetField] = data[sourceField];
              break;
            }
          }
          
          // Verificar se é um campo obrigatório e está faltando
          if (requiredFields.includes(targetField) && reservation[targetField] === undefined) {
            missingInThisReservation.push(targetField);
          }
        }
        
        // Normalizar valores para garantir tipos corretos
        if (reservation.checkInDate) {
          reservation.checkInDate = normalizeDateString(reservation.checkInDate);
        }
        
        if (reservation.checkOutDate) {
          reservation.checkOutDate = normalizeDateString(reservation.checkOutDate);
        }
        
        if (reservation.numGuests !== undefined) {
          reservation.numGuests = normalizeNumber(reservation.numGuests);
        }
        
        if (reservation.totalAmount !== undefined) {
          reservation.totalAmount = normalizeAmount(reservation.totalAmount);
        }
        
        if (reservation.platformFee !== undefined) {
          reservation.platformFee = normalizeAmount(reservation.platformFee);
        }
        
        if (reservation.cleaningFee !== undefined) {
          reservation.cleaningFee = normalizeAmount(reservation.cleaningFee);
        }
        
        if (reservation.checkInFee !== undefined) {
          reservation.checkInFee = normalizeAmount(reservation.checkInFee);
        }
        
        if (reservation.commissionFee !== undefined) {
          reservation.commissionFee = normalizeAmount(reservation.commissionFee);
        }
        
        if (reservation.teamPayment !== undefined) {
          reservation.teamPayment = normalizeAmount(reservation.teamPayment);
        }
        
        // Definir valores padrão para campos opcionais
        if (reservation.platform === undefined) {
          // Tentar inferir a plataforma pelo formato do documento
          if (text.toLowerCase().includes('airbnb')) {
            reservation.platform = 'airbnb';
          } else if (text.toLowerCase().includes('booking.com')) {
            reservation.platform = 'booking';
          } else {
            reservation.platform = 'other';
          }
        }
        
        // Status padrão
        reservation.status = 'confirmed';
        
        // Notas
        reservation.notes = `Extraído via OCR (${new Date().toLocaleDateString()})`;
        
        // Se há dados obrigatórios suficientes, adicionar a reserva
        if (missingInThisReservation.length <= 2) { // Permitir até 2 campos ausentes
          reservations.push(reservation);
          
          // Adicionar os campos em falta à lista geral
          for (const field of missingInThisReservation) {
            if (!missing.includes(field)) {
              missing.push(field);
            }
          }
        }
      }
      
      // Se temos retângulos delimitadores, salvar para visualização
      if (structuredData.boxes || structuredData.boundingBoxes) {
        Object.assign(boxes, structuredData.boxes || structuredData.boundingBoxes || {});
      }
    } else {
      console.warn('⚠️ Não foi possível extrair dados estruturados do texto OCR');
      
      // Tudo está faltando
      missing.push(...['propertyName', 'guestName', 'checkInDate', 'checkOutDate', 'numGuests', 'totalAmount']);
      
      // Tentar extrair manualmente algo básico
      const propertyMatch = text.match(/(?:propriedade|property|alojamento)[\s:]+([^\n]+)/i);
      const guestMatch = text.match(/(?:cliente|guest|hospede|hóspede)[\s:]+([^\n]+)/i);
      const dateMatch = text.match(/(?:data|date)[\s:]+(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/i);
      
      if (propertyMatch || guestMatch || dateMatch) {
        const reservation: ReservationData = {};
        
        if (propertyMatch) {
          reservation.propertyName = propertyMatch[1].trim();
          const index = missing.indexOf('propertyName');
          if (index !== -1) missing.splice(index, 1);
        }
        
        if (guestMatch) {
          reservation.guestName = guestMatch[1].trim();
          const index = missing.indexOf('guestName');
          if (index !== -1) missing.splice(index, 1);
        }
        
        if (dateMatch) {
          const dateStr = dateMatch[1];
          // Tentar interpretar como check-in ou check-out
          if (text.toLowerCase().includes('check-in') || text.toLowerCase().includes('entrada')) {
            reservation.checkInDate = normalizeDateString(dateStr);
            const index = missing.indexOf('checkInDate');
            if (index !== -1) missing.splice(index, 1);
          } else {
            reservation.checkOutDate = normalizeDateString(dateStr);
            const index = missing.indexOf('checkOutDate');
            if (index !== -1) missing.splice(index, 1);
          }
        }
        
        // Status padrão
        reservation.status = 'draft'; // Rascunho, pois está incompleto
        
        // Adicionar com dados parciais
        reservations.push(reservation);
      }
    }
    
    console.log(`✅ Extraídas ${reservations.length} reservas do texto OCR`);
    if (missing.length > 0) {
      console.log(`⚠️ Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }
    
    return {
      reservations,
      boxes,
      missing
    };
  } catch (error) {
    console.error('❌ Erro ao fazer parsing dos dados de reserva:', error);
    
    // Retornar um resultado vazio em caso de erro
    return {
      reservations: [],
      boxes: {},
      missing: ['error']
    };
  }
}

/**
 * Normaliza uma string de data para o formato YYYY-MM-DD
 * @param dateStr String de data em qualquer formato
 * @returns Data normalizada ou a string original se não for possível normalizar
 */
function normalizeDateString(dateStr: any): string {
  // Se não for string, converter para string
  if (typeof dateStr !== 'string') {
    dateStr = String(dateStr);
  }
  
  // Remover qualquer texto adicional, manter apenas a parte da data
  const cleanDateStr = dateStr.replace(/[^\d\/\.-]/g, '');
  
  // Padrões de data comuns
  // 1. DD/MM/YYYY or DD-MM-YYYY
  let match = cleanDateStr.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    let year = match[3];
    
    // Ajustar ano de 2 dígitos
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = century + parseInt(year);
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // 2. MM/DD/YYYY (formato americano)
  match = cleanDateStr.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (match && parseInt(match[1]) <= 12) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = match[3];
    
    // Heurística: se o primeiro número for <= 12, assumir formato MM/DD/YYYY
    return `${year}-${month}-${day}`;
  }
  
  // 3. YYYY/MM/DD or YYYY-MM-DD (ISO)
  match = cleanDateStr.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  // Se chegou aqui, não conseguiu normalizar
  // Tentar criar uma data válida com Date
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // Formato ISO YYYY-MM-DD
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignorar erro
  }
  
  // Retornar a string original se não conseguir normalizar
  return dateStr;
}

/**
 * Normaliza um número
 * @param value Valor a ser normalizado
 * @returns Número ou valor original se não for possível normalizar
 */
function normalizeNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remover caracteres não numéricos, exceto ponto e vírgula
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Converter para número
    try {
      // Substituir vírgula por ponto se for o separador decimal
      if (cleanedValue.includes(',') && !cleanedValue.includes('.')) {
        return parseFloat(cleanedValue.replace(',', '.'));
      }
      
      return parseFloat(cleanedValue);
    } catch (e) {
      // Ignorar erro
    }
  }
  
  // Se for indefinido ou não for possível converter, retornar um valor padrão
  return value !== undefined ? value : 0;
}

/**
 * Normaliza um valor monetário
 * @param value Valor a ser normalizado
 * @returns Valor monetário ou valor original se não for possível normalizar
 */
function normalizeAmount(value: any): number {
  if (value === undefined || value === null) {
    return 0;
  }
  
  // Se for número, retornar
  if (typeof value === 'number') {
    return value;
  }
  
  // Se for string, converter
  if (typeof value === 'string') {
    // Remover símbolos de moeda e outros caracteres não numéricos
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Converter para número
    try {
      // Substituir vírgula por ponto se for o separador decimal
      if (cleanedValue.includes(',') && !cleanedValue.includes('.')) {
        return parseFloat(cleanedValue.replace(',', '.'));
      }
      
      return parseFloat(cleanedValue);
    } catch (e) {
      // Ignorar erro
    }
  }
  
  // Se não for possível converter, retornar 0
  return 0;
}

export default parseReservationData;